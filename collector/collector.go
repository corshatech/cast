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
	"database/sql"
	"fmt"
	"net/url"
	"os"
	"os/signal"
	"regexp"
	"runtime"
	"strconv"
	"time"

	"github.com/avast/retry-go"
	"github.com/gorilla/websocket"
	_ "github.com/lib/pq"
	log "github.com/sirupsen/logrus"

	"github.com/corshatech/cast/collector/analysis/url_regex"
)

const (
	kubesharkHubURLEnv = "KUBESHARK_HUB_URL"
	postgresHostEnv    = "PGHOST"
	postgresPortEnv    = "PGPORT"
	postgresUserEnv    = "PGUSER"
	postgresPassEnv    = "PGPASSWORD" /* #nosec */
	dbNameEnv          = "PGDATABASE"

	PoolWorkerNoEnv  = "NUM_WORKERS"
	WorkerBufSizeEnv = "WORKER_BUF_SIZE"
)

const (
	retryAttempts        = 3
	retryDelay           = 3 * time.Second
	defaultReadDeadline  = 5 * time.Minute
	defaultWriteDeadline = 45 * time.Second

	defaultWorkerBufSize = 100
)

var defaultPoolWorkerNo = runtime.NumCPU()

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
	Id      string       `json:"id"`
	Context string       `json:"context"`
	Proto   MessageProto `json:"proto"`
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

	UseOfBasicAuth  bool
	PatternFindings []url_regex.CastRegexpDbMatch `json:",omitempty"`
}

func intEnvOrDefault(env string, def int) int {
	strEnv, ok := os.LookupEnv(env)
	if ok {
		parsed, err := strconv.Atoi(strEnv)
		if err != nil {
			log.WithFields(log.Fields{
				"env":          env,
				"parsedValue":  strEnv,
				"defaultValue": def,
			}).Warn("Environment var was not an integer, using the default value")
			return def
		}
		return parsed
	}
	return def
}

func main() {

	var err error

	pgHost := requiredEnv(postgresHostEnv)
	pgPort := requiredEnv(postgresPortEnv)
	pgUser := requiredEnv(postgresUserEnv)
	pgPass := requiredEnv(postgresPassEnv)
	dbName := requiredEnv(dbNameEnv)
	kubesharkHubURL := requiredEnv(kubesharkHubURLEnv)
	workerBufSize := intEnvOrDefault(WorkerBufSizeEnv, defaultWorkerBufSize)
	workerNo := intEnvOrDefault(PoolWorkerNoEnv, defaultPoolWorkerNo)

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
			err = createAnalysisPool(ctx, pgConnection, ksConnection, kubesharkHubURL, workerBufSize, workerNo)
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
