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
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"time"

	_ "github.com/lib/pq"

	"github.com/avast/retry-go"
	log "github.com/sirupsen/logrus"
)

const (
	postgresHostEnv = "PGHOST"
	postgresPortEnv = "PGPORT"
	postgresUserEnv = "PGUSER"
	postgresPassEnv = "PGPASSWORD" /* #nosec */
	dbNameEnv       = "PGDATABASE"

	kubesecPluginID = "cast-kubesec"
)

const (
	retryAttempts = 3
	retryDelay    = 3 * time.Second
)

var pgConnection *sql.DB

func init() {
	pgHost := requiredEnv(postgresHostEnv)
	pgPort := requiredEnv(postgresPortEnv)
	pgUser := requiredEnv(postgresUserEnv)
	pgPass := requiredEnv(postgresPassEnv)
	dbName := requiredEnv(dbNameEnv)

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", pgHost, pgPort, pgUser, pgPass, dbName)

	var err error
	err = retry.Do(
		func() error {
			pgConnection, err = sql.Open("postgres", connStr)
			return err
		},
		retry.Attempts(retryAttempts),
		retry.Delay(retryDelay),
		retry.OnRetry(func(n uint, err error) {
			log.Infof("Error connecting to postgres database. Retrying in %vs", retryDelay)
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
		retry.Attempts(retryAttempts),
		retry.Delay(retryDelay),
		retry.OnRetry(func(n uint, err error) {
			log.Infof("Unable to reach postgres database. Retrying in %vs", retryDelay)
		}),
	)
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

func writeFinding(f Finding) error {
	const sqlStatement = `INSERT INTO plugins_findings (plugin_name, data) VALUES ($1, $2)`

	findingJson, err := json.Marshal(f)
	if err != nil {
		return err
	}

	err = retry.Do(
		func() error {
			_, err := pgConnection.Exec(sqlStatement, kubesecPluginID, findingJson)
			return err
		},
		retry.Attempts(retryAttempts),
		retry.Delay(retryDelay),
		retry.OnRetry(func(n uint, err error) {
			log.WithError(err).Info("Error inserting entry into postgres database.")
		}),
	)
	if err != nil {
		return err
	}
	return nil
}

func writeCompleted() error {
	const sqlStatement = `INSERT INTO plugins_completions (plugin_name) VALUES ($1)`

	err := retry.Do(
		func() error {
			_, err := pgConnection.Exec(sqlStatement, kubesecPluginID)
			return err
		},
		retry.Attempts(retryAttempts),
		retry.Delay(retryDelay),
		retry.OnRetry(func(n uint, err error) {
			log.WithError(err).Info("Error inserting completion notice into postgres database.")
		}),
	)
	return err
}
