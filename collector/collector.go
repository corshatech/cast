/*
 * Copyright 2022 Corsha.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package main

import (
	"crypto/sha256"
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"os/signal"
	"time"

	_ "github.com/lib/pq"
	"github.com/mitchellh/mapstructure"
	log "github.com/sirupsen/logrus"

	"github.com/gorilla/websocket"
)

const (
	websocketUrlEnv = "WEBSOCKET_URL"
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
}
type Data struct {
	Protocol ProtocolSummary `messagestruct:"protocol"`
	Request  Request         `messagestruct:"request"`
}

type Message struct {
	Data        Data   `messagestruct:"data"`
	MessageType string `messagestruct:"messageType"`
}

func main() {
	var err error
	for i := 0; i < retryAttempts; i++ {
		if i > 0 {
			log.Infof("Error starting CAST. Retrying in %vs", retryDelay)
			time.Sleep(retryDelay * time.Second)
		}
		err = exportRecords()
		if err == nil {
			break
		}
	}
	if err != nil {
		log.WithError(err).Fatal("Failed to start CAST.")
	}
}

func exportRecords() error {
	// Open postgres connection
	pgHost := requiredEnv(postgresHostEnv)
	pgPort := requiredEnv(postgresPortEnv)
	pgUser := requiredEnv(postgresUserEnv)
	pgPass := requiredEnv(postgresPassEnv)
	dbName := requiredEnv(dbNameEnv)
	// TODO: look into sslmode
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
	log.Info("Established connection to postgres database.")

	defer db.Close()

	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt)

	errc := make(chan error)

	// Connecting to kubeshark database through kubeshark-api-server websocket
	websocketUrl := requiredEnv(websocketUrlEnv)
	c, _, err := websocket.DefaultDialer.Dial(websocketUrl, nil)
	if err != nil {
		log.WithError(err).Info("Failed to connect to kubeshark.")
		return err
	}

	log.Info("Established connection to kubeshark database.")

	defer c.Close()

	go func() {
		log.Info("Starting export of records.")
		for {
			_, message, err1 := c.ReadMessage()
			if err1 != nil {
				log.Println("read:", err1)
				errc <- err1
			}

			finalMessage, err1 := handleMessage(message)
			if err1 != nil {
				log.WithError(err1).Info("Failed to process kubeshark record.")
				errc <- err1
			}

			if finalMessage == nil {
				continue
			}

			sqlStatement := `INSERT INTO traffic (data) VALUES ($1)`

			for i := 0; i < retryAttempts; i++ {
				if i > 0 {
					log.WithError(err1).Info("Error inserting entry into postgres database.")
					time.Sleep(retryDelay * time.Second)
				}
				_, err1 = db.Exec(sqlStatement, finalMessage)
				if err1 == nil {
					break
				}
			}

			if err1 != nil {
				errc <- err1
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

func handleMessage(message []byte) ([]byte, error) {

	var messageMap map[string]interface{}

	err := json.Unmarshal(message, &messageMap)

	if err != nil {
		return nil, err
	}

	if messageMap["messageType"].(string) != "fullEntry" {
		return nil, nil
	}

	v := Message{}

	err = mapstructure.Decode(messageMap, &v)
	if err != nil {
		return nil, err
	}

	if v.Data.Protocol.Name != "" && v.Data.Request.Headers.Host != "" && v.Data.Request.Path != "" {
		absoluteUri := v.Data.Protocol.Name + "://" + v.Data.Request.Headers.Host + v.Data.Request.Path
		messageMap["data"].(map[string]interface{})["request"].(map[string]interface{})["absoluteUri"] = absoluteUri
	}

	if v.Data.Request.Headers.Authorization != "" {
		unHashedAuth := v.Data.Request.Headers.Authorization
		hashedAuth := sha256.Sum256([]byte(unHashedAuth))

		messageMap["data"].(map[string]interface{})["request"].(map[string]interface{})["headers"].(map[string]interface{})["Authorization"] = fmt.Sprintf("%x", hashedAuth)
	}

	editedMessage, err := json.Marshal(messageMap["data"])
	if err != nil {
		return nil, err
	}
	return editedMessage, nil
}
