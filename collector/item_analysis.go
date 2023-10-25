/*
Copyright 2023 Corsha.
Licensed under the Apache License, Version 2.0 (the 'License');
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an 'AS IS' BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package main

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/avast/retry-go"
	"github.com/gorilla/websocket"
	"github.com/mitchellh/mapstructure"
	log "github.com/sirupsen/logrus"

	"github.com/corshatech/cast/collector/analysis/url_regex"
)

type workerContext struct {
	KsConnection *websocket.Conn
	KsHubUrl     string
	PgConnection *sql.DB
	Queue        <-chan Message
	WorkerNo     int
}

func createAnalysisPool(ctx context.Context, pgConnection *sql.DB, ksConnection *websocket.Conn, kubesharkHubURL string, workerBufSize, workerNo int) error {
	var wg sync.WaitGroup
	messageQueue := make(chan Message, workerBufSize)

	err := ksConnection.SetWriteDeadline(deadline(defaultWriteDeadline))
	if err != nil {
		log.WithError(err).Error("Unable to set connection deadline")
		return err
	}
	err = ksConnection.WriteMessage(websocket.TextMessage, []byte{})
	if err != nil {
		log.Println("write:", err)
		return err
	}

	for i := 0; i < workerNo; i++ {
		wg.Add(1)

		workCtx := workerContext{
			KsConnection: ksConnection,
			KsHubUrl:     kubesharkHubURL,
			PgConnection: pgConnection,
			Queue:        messageQueue,
			WorkerNo:     i,
		}

		go func() {
			defer wg.Done()
			analysisWorker(&workCtx)
		}()
	}

	log.Info("Starting export of records.")

outer:
	for {
		err = ksConnection.SetReadDeadline(deadline(defaultReadDeadline))
		if err != nil {
			log.WithError(err).Error("Unable to set connection deadline")
			return err
		}
		_, messageJson, err := ksConnection.ReadMessage()
		if err != nil {
			log.Println("read:", err)
			return err
		}

		message := Message{}
		err = json.Unmarshal(messageJson, &message)
		if err != nil {
			log.WithError(err).Error("Failed to unmarshal websocket message")
			return fmt.Errorf("failed to unmarshal websocket message: %w", err)
		}

		if message.Proto.Name != "http" {
			log.WithField("proto.name", message.Proto.Name).Debug("ignoring non-HTTP traffic")
			continue
		}

		select {
		case messageQueue <- message:
			// Nothing
		default:
			log.Warn("Can't keep up! Traffic was discarded.")
		}

		select {
		case <-ctx.Done():
			close(messageQueue)
			break outer
		default:
			continue
		}
	}

	log.Infof("Ending export of records, waiting for %d workers to exit...", workerNo)
	wg.Wait()
	log.Info("All workers done.")

	return nil
}

func analysisWorker(ctx *workerContext) {
	for message := range ctx.Queue {
		itemUrl := fmt.Sprintf("%s/item/%s?c=%s&q=", ctx.KsHubUrl, message.Id, message.Context)
		requestContext, cancel := context.WithDeadline(context.Background(), deadline(1*time.Minute))

		trafficItemJson, err := fetchItem(requestContext, itemUrl)
		if err != nil {
			log.
				WithFields(log.Fields{
					"itemUrl": itemUrl,
					"worker":  ctx.WorkerNo,
				}).
				WithError(err).
				Error("Failed to fetch item from kubeshark")
			cancel()
			continue
		}
		cancel()

		trafficItem := TrafficItem{}

		// finalTrafficDataJson is the data object inside the trafficItemJson object
		finalTrafficDataJson, metadataJson, err := handleTrafficItem(trafficItemJson, &trafficItem)
		if err != nil {
			log.WithField("worker", ctx.WorkerNo).WithError(err).Error("Failed to process kubeshark record.")
			continue
		}

		// When finalTrafficDataJson is nil and err is nil, the trafficItem is not relevant so we skip it
		if finalTrafficDataJson == nil {
			continue
		}

		occurredAt := time.UnixMilli(trafficItem.Data.Timestamp)

		sqlStatement := `INSERT INTO traffic (occurred_at, data, meta) VALUES ($1, $2, $3)`

		err = retry.Do(
			func() error {
				//nolint
				_, err = ctx.PgConnection.Exec(sqlStatement, occurredAt, finalTrafficDataJson, metadataJson)
				return err
			},
			retry.Attempts(retryAttempts),
			retry.Delay(retryDelay),
			retry.OnRetry(func(n uint, err error) {
				log.WithField("worker", ctx.WorkerNo).WithError(err).Infof("Error inserting entry into postgres database. Retrying in %v", retryDelay)
			}),
		)
		if err != nil {
			log.WithField("worker", ctx.WorkerNo).WithError(err).Infof("Error inserting entry into postgres database.")
			continue
		}

		log.WithFields(log.Fields{
			"worker": ctx.WorkerNo,
			"item":   message.Id,
		}).Info("Wrote record")
	}
}

func writeRecords(pgConnection *sql.DB, ksURL string, ksConnection *websocket.Conn) error {
	err := ksConnection.SetReadDeadline(deadline(defaultReadDeadline))
	if err != nil {
		log.WithError(err).Error("Unable to set connection deadline")
		return err
	}
	_, messageJson, err := ksConnection.ReadMessage()
	if err != nil {
		log.Println("read:", err)
		return err
	}

	message := Message{}
	err = json.Unmarshal(messageJson, &message)
	if err != nil {
		log.WithError(err).Error("Failed to unmarshal websocket message")
		return fmt.Errorf("failed to unmarshal websocket message: %w", err)
	}

	if message.Proto.Name != "http" {
		log.WithField("proto.name", message.Proto.Name).Debug("ignoring non-HTTP traffic")
		return nil
	}

	itemUrl := fmt.Sprintf("%s/item/%s?q=", ksURL, message.Id)
	trafficItemJson, err := fetchItem(context.Background(), itemUrl)
	if err != nil {
		log.
			WithField("itemUrl", itemUrl).
			WithError(err).
			Error("Failed to fetch item from kubeshark")
		return fmt.Errorf("failed to fetch item from kubeshark: %w", err)
	}

	trafficItem := TrafficItem{}

	// finalTrafficDataJson is the data object inside the trafficItemJson object
	finalTrafficDataJson, metadataJson, err := handleTrafficItem(trafficItemJson, &trafficItem)
	if err != nil {
		log.WithError(err).Error("Failed to process kubeshark record.")
		return fmt.Errorf("failed to process kubeshark record: %w", err)
	}

	// When finalTrafficDataJson is nil and err is nil, the trafficItem is not relevant so we skip it
	if finalTrafficDataJson == nil {
		return nil
	}

	occurredAt := time.UnixMilli(trafficItem.Data.Timestamp)

	sqlStatement := `INSERT INTO traffic (occurred_at, data, meta) VALUES ($1, $2, $3)`

	err = retry.Do(
		func() error {
			//nolint
			_, err = pgConnection.Exec(sqlStatement, occurredAt, finalTrafficDataJson, metadataJson)
			return err
		},
		retry.Attempts(retryAttempts),
		retry.Delay(retryDelay),
		retry.OnRetry(func(n uint, err error) {
			log.WithError(err).Infof("Error inserting entry into postgres database. Retrying in %v", retryDelay)
		}),
	)

	return err

}

func fetchItem(ctx context.Context, itemUrl string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, itemUrl, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating item request: %w", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error fetching item: %w", err)
	}
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}

// handleTrafficItem takes a message read from the kubeshark websocket and processes it for insertion
// into the postgres database. It returns the processed message and a CASTMetadata struct for the message.
func handleTrafficItem(trafficItemJson []byte, trafficItem *TrafficItem) ([]byte, []byte, error) {
	var err error
	var trafficItemMap map[string]interface{}
	var metadata CASTMetadata

	err = json.Unmarshal(trafficItemJson, &trafficItemMap)
	if err != nil {
		return nil, nil, err
	}

	// In Kubeshark 41 the trafficItem JSON contains the data and a
	// string version of data in a key called representation. This
	// caused the JWT detection to match each JWT string twice
	originalTrafficDataJson, err := json.Marshal(trafficItemMap["data"])
	if err != nil {
		return nil, nil, err
	}

	err = mapstructure.Decode(trafficItemMap, trafficItem)
	if err != nil {
		return nil, nil, err
	}

	var absoluteURI string
	if trafficItem.Data.Protocol.Name != "" && trafficItem.Data.Request.Headers.Host != "" && trafficItem.Data.Request.Url != "" {
		absoluteURI = trafficItem.Data.Protocol.Name + "://" + trafficItem.Data.Request.Headers.Host + trafficItem.Data.Request.Url
		trafficItemMap["data"].(map[string]interface{})["request"].(map[string]interface{})["absoluteURI"] = absoluteURI
	}

	if trafficItem.Data.Request.Headers.Authorization != "" {
		unHashedAuth := trafficItem.Data.Request.Headers.Authorization
		hashedAuth := sha256.Sum256([]byte(unHashedAuth))
		trafficItemMap["data"].(map[string]interface{})["request"].(map[string]interface{})["headers"].(map[string]interface{})["Authorization"] = fmt.Sprintf("%x", hashedAuth)
		metadata.UseOfBasicAuth = strings.HasPrefix(unHashedAuth, "Basic ")
	}

	metadata.DetectedJwts = detectJwts(originalTrafficDataJson)

	metadata.PatternFindings, err = url_regex.Detect(absoluteURI, trafficItem.Data.Request.Url)
	if err != nil {
		return nil, nil, fmt.Errorf("error in detecting regex findings: %w", err)
	}

	editedTrafficDataJson, err := json.Marshal(trafficItemMap["data"])
	if err != nil {
		return nil, nil, err
	}

	metadataJson, err := json.Marshal(metadata)
	if err != nil {
		return nil, nil, err
	}
	return editedTrafficDataJson, metadataJson, nil
}
