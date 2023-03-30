/*
Copyright 2022 Corsha.
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
	"net/url"
	"os"
	"os/signal"
	"regexp"
	"strings"
	"time"

	"github.com/avast/retry-go"
	"github.com/gorilla/websocket"
	_ "github.com/lib/pq"
	"github.com/mitchellh/mapstructure"
	log "github.com/sirupsen/logrus"

	"github.com/corshatech/cast/collector/analysis/pass_in_url"
)

const (
	kubesharkHubURLEnv = "KUBESHARK_HUB_URL"
	postgresHostEnv    = "PGHOST"
	postgresPortEnv    = "PGPORT"
	postgresUserEnv    = "PGUSER"
	postgresPassEnv    = "PGPASSWORD" /* #nosec */
	dbNameEnv          = "PGDATABASE"
)

const (
	retryAttempts        = 3
	retryDelay           = 3 * time.Second
	defaultReadDeadline  = 5 * time.Minute
	defaultWriteDeadline = 45 * time.Second
)

var jwtRegex = regexp.MustCompile(`eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/]*`)

type ProtocolSummary struct {
	Name string `messagestruct:"name"`
}
type Header struct {
	Host          string `messagestruct:"Host"`
	Authorization string `messagestruct:"Authorization"`
}
type Request struct {
	Headers Header `messagestruct:"headers"`
	Path    string `messagestruct:"path"`
	Url     string `messagestruct:"url"`
	// QueryString can be a map[string]string if the key is used once or
	// map[string]string[] if the key is use multiple times
	QueryString map[string]interface{}
}
type Data struct {
	Id        string          `messagestruct:"id"`
	Protocol  ProtocolSummary `messagestruct:"protocol"`
	Timestamp int64           `messagestruct:"timestamp"`
	Request   Request         `messagestruct:"request"`
}

type TrafficItem struct {
	Data Data `messagestruct:"data"`
}

type Message struct {
	Id    string       `json:"id"`
	Proto MessageProto `json:"proto"`
}

type MessageProto struct {
	Name string `json:"name"`
}

// CAST Metadata extracted from the accompanying request
type CASTMetadata struct {
	/*
		DetectedJwts are JWT strings detected in the request, if any present.
		Strings in this list may not necessarily be in any particular order,
		and need not be unique in the event the request contains duplicate JWTs somehow.
		(i.e. Neither list order nor unique items guaranteed.)
	*/
	DetectedJwts []string `json:",omitempty"`
	// Empty-array is not permitted in transit; empty value should be omit instead to save data in the backend

	// PassInUrl is the data returned by the pass_in_url analysis
	PassInUrl      *pass_in_url.PassInUrl `json:",omitempty"`
	UseOfBasicAuth bool
}

func main() {

	var err error

	pgHost := requiredEnv(postgresHostEnv)
	pgPort := requiredEnv(postgresPortEnv)
	pgUser := requiredEnv(postgresUserEnv)
	pgPass := requiredEnv(postgresPassEnv)
	dbName := requiredEnv(dbNameEnv)
	kubesharkHubURL := requiredEnv(kubesharkHubURLEnv)

	websocketURL, err := hubURLToWebsocketURL(kubesharkHubURL)
	if err != nil {
		log.WithError(err).WithField(kubesharkHubURLEnv, kubesharkHubURL).Fatal("could not determine kubeshark websocket URL")
	}

	var pgConnection *sql.DB
	var ksConnection *websocket.Conn

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", pgHost, pgPort, pgUser, pgPass, dbName)

	err = retry.Do(
		func() error {
			pgConnection, err = sql.Open("postgres", connStr)
			return err
		},
		retry.Attempts(retryAttempts),
		retry.Delay(retryDelay),
		retry.OnRetry(func(n uint, err error) {
			log.Infof("Error connecting to postgres database. Retrying in %v", retryDelay)
		}),
	)
	if err != nil {
		log.WithFields(log.Fields{
			"postgres host": pgHost,
			"postgres port": pgPort,
			"postgres user": pgUser,
		}).WithError(err).Fatal("Failed to open postgres database connection.")
	}

	// wait for postgres database to be ready before continuing
	err = retry.Do(
		func() error {
			return pgConnection.Ping()
		},
		retry.Attempts(5),
		retry.Delay(retryDelay),
		retry.OnRetry(func(n uint, err error) {
			log.Infof("Unable to reach postgres database. Retrying in %v", retryDelay)
		}),
	)
	if err != nil {
		log.WithError(err).Fatal("Failed to connect to postgres.")
	} else {
		log.Info("Established connection to postgres database.")
	}

	err = retry.Do(
		func() error {
			//nolint
			ksConnection, _, err = websocket.DefaultDialer.Dial(websocketURL, nil)
			return err
		},
		retry.Attempts(retryAttempts),
		retry.Delay(retryDelay),
		retry.OnRetry(func(n uint, err error) {
			log.Infof("Error connecting to kubeshark websocket. Retrying in %v", retryDelay)
		}),
	)
	if err != nil {
		log.WithError(err).Fatal("Failed to connect to kubeshark.")
	} else {
		log.Info("Established connection to kubeshark database.")
	}

	log.Info("Collector is ready to export records.")
	defer pgConnection.Close()
	defer ksConnection.Close()

	ctx := context.Background()

	// trap Ctrl+C and call cancel on the context
	ctx, cancel := context.WithCancel(ctx)
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)
	defer func() {
		signal.Stop(c)
		cancel()
	}()
	go func() {
		select {
		case <-c:
			cancel()
			log.Println("interrupt")
			// Cleanly close the connection by sending a close message and then
			// waiting (with timeout) for the server to close the connection.
			websocketErr := ksConnection.SetWriteDeadline(deadline(defaultWriteDeadline))
			if websocketErr != nil {
				log.WithError(websocketErr).Error("Unable to set connection deadline")
				return
			}
			websocketErr = ksConnection.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
			if websocketErr != nil {
				log.Println("write close:", websocketErr)
				return
			}
		case <-ctx.Done():
		}
	}()

	err = retry.Do(
		func() error {
			//nolint
			err = exportRecords(pgConnection, kubesharkHubURL, ksConnection, ctx)
			return err
		},
		retry.Attempts(retryAttempts),
		retry.Delay(retryDelay),
		retry.OnRetry(func(n uint, err error) {
			log.Infof("Error exporting records. Retrying in %v", retryDelay)
		}),
	)
	if err != nil {
		log.WithError(err).Fatal("Failed to start CAST.")
	}

}

func exportRecords(pgConnection *sql.DB, ksHubURL string, ksConnection *websocket.Conn, ctx context.Context) error {
	var err error

	log.Info("Starting export of records.")

	err = ksConnection.SetWriteDeadline(deadline(defaultWriteDeadline))
	if err != nil {
		log.WithError(err).Error("Unable to set connection deadline")
		return err
	}
	err = ksConnection.WriteMessage(websocket.TextMessage, []byte{})
	if err != nil {
		log.Println("write:", err)
		return err
	}

	for {
		err = writeRecords(pgConnection, ksHubURL, ksConnection)
		if err != nil {
			return err
		}

		select {
		case <-ctx.Done():
			return nil
		default:
			continue
		}
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

// Exits with 1 if envName not set, otherwise returns env value
func requiredEnv(envName string) string {
	ret, ok := os.LookupEnv(envName)
	if !ok {
		log.WithFields(log.Fields{
			"func": "requiredEnv",
			"var":  envName,
		}).Fatal("Failed to load required environment variable")
	}
	return ret
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

func detectJwts(request []byte) []string {
	matches := jwtRegex.FindAllString(string(request), -1)
	return matches
}

func hubURLToWebsocketURL(hubURL string) (string, error) {
	url, err := url.Parse(hubURL)
	if err != nil {
		return "", fmt.Errorf("could not parse Kubeshark Hub URL: %w", err)
	}

	// Lint disabled because it the constant would not mean the same
	// thing and the two strings are only used here.
	//
	// nolint:goconst
	url.Scheme = "ws"
	url.Path = "ws"
	return url.String(), nil
}
