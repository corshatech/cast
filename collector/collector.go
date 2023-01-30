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
	"regexp"
	"time"

	"github.com/avast/retry-go"
	"github.com/gorilla/websocket"
	_ "github.com/lib/pq"
	"github.com/mitchellh/mapstructure"
	log "github.com/sirupsen/logrus"
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

type Message struct {
	Data        Data   `messagestruct:"data"`
	MessageType string `messagestruct:"messageType"`
}

func main() {

	var err error

	pgHost := requiredEnv(postgresHostEnv)
	pgPort := requiredEnv(postgresPortEnv)
	pgUser := requiredEnv(postgresUserEnv)
	pgPass := requiredEnv(postgresPassEnv)
	dbName := requiredEnv(dbNameEnv)
	websocketURL := requiredEnv(websocketURLEnv)

	var pgConnection *sql.DB
	var ksConnection *websocket.Conn

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", pgHost, pgPort, pgUser, pgPass, dbName)

	err = retry.Do(
		func() error {
			pgConnection, err = sql.Open("postgres", connStr)
			return err
		},
		retry.Attempts(retryAttempts),
		retry.Delay(retryDelay*time.Second),
		retry.OnRetry(func(n uint, err error) {
			log.Infof("Error connecting to postgres database. Retrying in %vs", retryDelay)
			time.Sleep(retryDelay * time.Second)
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
		retry.Delay(5*time.Second),
		retry.OnRetry(func(n uint, err error) {
			log.Infof("Unable to reach postgres database. Retrying in %vs", 5)
			time.Sleep(5 * time.Second)
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
		retry.Delay(retryDelay*time.Second),
		retry.OnRetry(func(n uint, err error) {
			log.Infof("Error connecting to postgres database. Retrying in %vs", retryDelay)
			time.Sleep(retryDelay * time.Second)
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
			err = ksConnection.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
			if err != nil {
				log.Println("write close:", err)
				return
			}
		case <-ctx.Done():
		}
	}()

	err = retry.Do(
		func() error {
			//nolint
			err = exportRecords(pgConnection, ksConnection, ctx)
			return err
		},
		retry.Attempts(retryAttempts),
		retry.Delay(retryDelay*time.Second),
		retry.OnRetry(func(n uint, err error) {
			log.Infof("Error exporting records. Retrying in %vs", retryDelay)
			time.Sleep(retryDelay * time.Second)
		}),
	)
	if err != nil {
		log.WithError(err).Fatal("Failed to start CAST.")
	}

}

func exportRecords(pgConnection *sql.DB, ksConnection *websocket.Conn, ctx context.Context) error {
	var err error
	errc := make(chan error)

	log.Info("Starting export of records.")

	go func() {
		for {
			err = writeRecords(pgConnection, ksConnection)
			if err != nil {
				errc <- err
			}
		}

	}()

	// only fetch more records if writeRecords has no errors
	if err != nil {
		err = ksConnection.WriteMessage(websocket.TextMessage, []byte(`{"leftOff":"latest","query":"","enableFullEntries":true,"fetch":50,"timeoutMs":3000}`))
		if err != nil {
			log.Println("write:", err)
			return err
		}
	}
	for {
		select {
		case err := <-errc:
			return err
		case <-ctx.Done():
			return nil
		}
	}
}

func writeRecords(pgConnection *sql.DB, ksConnection *websocket.Conn) error {
	_, message, err := ksConnection.ReadMessage()
	if err != nil {
		log.Println("read:", err)
		return err
	}

	msgStruct := Message{}

	finalMessageMap, err := handleMessage(message, &msgStruct)
	if err != nil {
		log.WithError(err).Info("Failed to process kubeshark record.")
		return err
	}

	if finalMessageMap == nil {
		return nil
	}

	occurredAt := time.UnixMilli(msgStruct.Data.Timestamp)

	sqlStatement := `INSERT INTO traffic (occurred_at, data) VALUES ($1, $2)`

	err = retry.Do(
		func() error {
			//nolint
			_, err = pgConnection.Exec(sqlStatement, occurredAt, finalMessageMap)
			if err == nil {
				log.Info("Record successfully inserted into postgres database. Continuing export.")
			}
			return err
		},
		retry.Attempts(retryAttempts),
		retry.Delay(retryDelay*time.Second),
		retry.OnRetry(func(n uint, err error) {
			log.WithError(err).Infof("Error inserting entry into postgres database. Retrying in %vs.", retryDelay)
			time.Sleep(retryDelay * time.Second)
		}),
	)

	return err

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

func detectJwts(request []byte) []string {
	matches := jwtRegex.FindAllString(string(request), -1)
	return matches
}
