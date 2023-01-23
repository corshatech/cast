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
	"os"
	"os/signal"
	"time"

	"github.com/avast/retry-go"
	"github.com/gorilla/websocket"
	_ "github.com/lib/pq"
	"github.com/mitchellh/mapstructure"
	log "github.com/sirupsen/logrus"

	"github.com/corshatech/cast/collector/analysis/urlpassword"
)

const (
	websocketURLEnv = "WEBSOCKET_URL"
	postgresHostEnv = "PGHOST"
	postgresPortEnv = "PGPORT"
	postgresUserEnv = "PGUSER"
	postgresPassEnv = "PGPASSWORD" /* #nosec */
	dbNameEnv       = "PGDATABASE"
)

const (
	retryAttempts = 3
	retryDelay    = 3
)

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
	// QueryString can be a map[string]string if the key is used once or
	// map[string]string[] if the key is use multiple times
	QueryString map[string]interface{}
}
type Data struct {
	Id       string          `messagestruct:"id"`
	Protocol ProtocolSummary `messagestruct:"protocol"`
	Request  Request         `messagestruct:"request"`
}

type Message struct {
	Data        Data   `messagestruct:"data"`
	MessageType string `messagestruct:"messageType"`
}

func main() {
	err := retry.Do(
		exportRecords,
		retry.Attempts(retryAttempts),
		retry.Delay(retryDelay*time.Second),
		retry.OnRetry(func(n uint, err error) {
			log.WithError(err).Infof("Error starting CAST. Retrying in %vs", retryDelay)
		}),
	)
	if err != nil {
		log.WithError(err).Fatal("Failed to start CAST.")
	}
}

//gocyclo:ignore
func exportRecords() error {
	// Open postgres connection
	pgHost := requiredEnv(postgresHostEnv)
	pgPort := requiredEnv(postgresPortEnv)
	pgUser := requiredEnv(postgresUserEnv)
	pgPass := requiredEnv(postgresPassEnv)
	dbName := requiredEnv(dbNameEnv)
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", pgHost, pgPort, pgUser, pgPass, dbName)
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.WithFields(log.Fields{
			"postgres host": pgHost,
			"postgres port": pgPort,
			"postgres user": pgUser,
		}).WithError(err).Info("Failed to open postgres database connection.")
		return err
	}

	// wait for postgres database to be ready before continuing
	err = retry.Do(
		func() error {
			return db.Ping()
		},
		retry.Attempts(5),
		retry.Delay(5*time.Second),
		retry.OnRetry(func(n uint, err error) {
			log.Infof("Unable to reach postgres database. Retrying in %vs", 5)
		}),
	)
	if err != nil {
		log.WithError(err).Info("Failed to reach postgres database.")
		return err
	}
	defer db.Close()

	log.Info("Established connection to postgres database.")

	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt)

	errc := make(chan error)

	// Connecting to kubeshark database through kubeshark-api-server websocket
	websocketURL := requiredEnv(websocketURLEnv)
	c, _, err := websocket.DefaultDialer.Dial(websocketURL, nil)
	if err != nil {
		log.WithError(err).Info("Failed to connect to kubeshark.")
		return err
	}

	log.Info("Established connection to kubeshark database.")

	defer c.Close()

	log.Info("Collector is ready to export records.")

	go func() {
		log.Info("Starting export of records.")
		for {
			_, message, err1 := c.ReadMessage()
			if err1 != nil {
				log.Println("read:", err1)
				errc <- err1
			}

			msgStruct := Message{}
			finalMessageMap, err1 := handleMessage(message, &msgStruct)
			if err1 != nil {
				log.WithError(err1).Info("Failed to process kubeshark record.")
				errc <- err1
			}

			if finalMessageMap == nil {
				continue
			}

			sqlStatement := `INSERT INTO traffic (data) VALUES ($1)`

			err1 = retry.Do(
				func() error {
					_, err2 := db.Exec(sqlStatement, finalMessageMap)
					return err2
				},
				retry.Attempts(retryAttempts),
				retry.Delay(retryDelay*time.Second),
				retry.OnRetry(func(n uint, err error) {
					log.WithError(err).Infof("Error inserting entry into postgres database. Retrying in %vs.", retryDelay)
				}),
			)
			if err1 != nil {
				errc <- err1
				continue
			}

			log.WithField("data.id", msgStruct.Data.Id).Infof("Record successfully inserted into postgres database.")

			// Attempt to select the UUID of the record we just inserted
			var dbId string
			err1 = retry.Do(
				func() error {
					err2 := db.QueryRow(`SELECT id FROM traffic WHERE data->>'id' = $1`, msgStruct.Data.Id).Scan(&dbId)
					if err2 != nil {
						return fmt.Errorf("error selecting traffic.id: %w", err2)
					}
					return nil
				},
				retry.Attempts(retryAttempts),
				retry.Delay(retryDelay*time.Second),
				retry.OnRetry(func(n uint, err error) {
					log.WithError(err).Errorf("Error selecting traffic.id")
				}),
			)
			if err1 != nil {
				errc <- err1
				continue
			}

			err1 = retry.Do(
				func() error {
					ctx := context.Background()
					matches, err2 := urlpassword.Handle(ctx, db, dbId, msgStruct.Data.Request.QueryString)
					if err2 != nil {
						return fmt.Errorf("error handling urlpassword analysis: %w", err2)
					}
					if len(matches) > 0 {
						log.
							WithField("analysis.id", "urlpassword").
							WithField("urlpassword.matches", matches).
							Info("password detected in querystring")
					}
					return nil
				},
				retry.Attempts(retryAttempts),
				retry.Delay(retryDelay*time.Second),
				retry.OnRetry(func(n uint, err error) {
					log.
						WithField("analysis.id", "urlpassword").
						WithError(err).
						Errorf("error handling urlpassword analysis")
				}),
			)
			if err1 != nil {
				errc <- err1
				continue
			}
		}

	}()

	err = c.WriteMessage(websocket.TextMessage, []byte(`{"leftOff":"latest","query":"","enableFullEntries":true,"fetch":50,"timeoutMs":3000}`))
	if err != nil {
		log.Println("write:", err)
		return err
	}
	for {
		select {
		case err := <-errc:
			return err
		case <-interrupt:
			log.Println("interrupt")

			// Cleanly close the connection by sending a close message and then
			// waiting (with timeout) for the server to close the connection.
			err := c.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
			if err != nil {
				log.Println("write close:", err)
				return err
			}
			return nil
		}
	}

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

func handleMessage(message []byte, msgStruct *Message) ([]byte, error) {

	var messageMap map[string]interface{}

	err := json.Unmarshal(message, &messageMap)

	if err != nil {
		return nil, err
	}

	if messageMap["messageType"].(string) != "fullEntry" {
		return nil, nil
	}

	err = mapstructure.Decode(messageMap, msgStruct)
	if err != nil {
		return nil, err
	}

	if msgStruct.Data.Protocol.Name != "" && msgStruct.Data.Request.Headers.Host != "" && msgStruct.Data.Request.Path != "" {
		absoluteURI := msgStruct.Data.Protocol.Name + "://" + msgStruct.Data.Request.Headers.Host + msgStruct.Data.Request.Path
		messageMap["data"].(map[string]interface{})["request"].(map[string]interface{})["absoluteURI"] = absoluteURI
	}

	if msgStruct.Data.Request.Headers.Authorization != "" {
		unHashedAuth := msgStruct.Data.Request.Headers.Authorization
		hashedAuth := sha256.Sum256([]byte(unHashedAuth))

		messageMap["data"].(map[string]interface{})["request"].(map[string]interface{})["headers"].(map[string]interface{})["Authorization"] = fmt.Sprintf("%x", hashedAuth)
	}

	editedMessage, err := json.Marshal(messageMap["data"])
	if err != nil {
		return nil, err
	}
	return editedMessage, nil
}
