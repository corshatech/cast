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
	"time"

	"github.com/avast/retry-go"
	"github.com/gorilla/websocket"
	"github.com/mitchellh/mapstructure"
	log "github.com/sirupsen/logrus"

	"github.com/corshatech/cast/collector/analysis/pass_in_url"
)

type workerContext struct {
	Ctx          context.Context
	KsConnection *websocket.Conn
	KsHubUrl     string
	PgConnection *sql.DB
	Queue        <-chan Message
	WorkerNo     int
}

func createAnalysisPool(pgConnection *sql.DB, ksConnection *websocket.Conn, kubesharkHubURL string, workerBufSize, workerNo int, ctx context.Context) error {
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
		workCtx := workerContext{
			Ctx:          ctx,
			KsConnection: ksConnection,
			KsHubUrl:     kubesharkHubURL,
			PgConnection: pgConnection,
			Queue:        messageQueue,
			WorkerNo:     i,
		}

		go analysisWorker(&workCtx)
	}

	log.Info("Starting export of records.")

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
			return nil
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
			return nil
		default:
			continue
		}
	}
}

func analysisWorker(ctx *workerContext) {
	for message := range ctx.Queue {
		itemUrl := fmt.Sprintf("%s/item/%s?q=", ctx.KsHubUrl, message.Id)
		requestContext, cancel := context.WithDeadline(ctx.Ctx, deadline(1*time.Minute))

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

	// In Kubeshark 38 the trafficItem JSON contains the data and a
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

	// Start: Handle the pass-in-url analysis
	passInUrl, err := pass_in_url.Detect(absoluteURI)
	if err != nil {
		return nil, nil, fmt.Errorf("error in detecting PassInUrl: %w", err)
	}
	if passInUrl != nil {
		log.WithFields(log.Fields{
			"func":      "handleMessage",
			"PassInUrl": metadata.PassInUrl,
		}).Debug("password detected in url")
		metadata.PassInUrl = passInUrl
		trafficItemMap["data"].(map[string]interface{})["request"].(map[string]interface{})["absoluteURI"] = metadata.PassInUrl.AbsoluteUri
	}
	// End: Handle the pass-in-url analysis

	metadata.DetectedJwts = detectJwts(originalTrafficDataJson)

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
