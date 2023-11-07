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
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"net/http"
	"net/url"
	"os"

	log "github.com/sirupsen/logrus"
)

const (
	// Environment variable holding the top level domain corresponding with the Jenkins instance.
	tldEnv = "JENKINS_TLD"

	localEndpoint = "/jenkins"
)

func main() {
	requestURL, err := buildRequestURL()
	if err != nil {
		log.WithError(err).Fatal("Failed to prepare URL for HTTP request")
	}

	errLogger := log.WithField("requestURL", requestURL)

	conn, err := NewConnection(requestURL)
	if err != nil {
		errLogger.WithError(err).Fatal("Failed to initialize connection with Jenkins")
	}

	http.HandleFunc(localEndpoint, func(w http.ResponseWriter, r *http.Request) {
		queryJenkins(w, r, conn)
	})

	log.Infof("Setup complete. Now listening on endpoint: %s", localEndpoint)

	log.Fatal(http.ListenAndServe(":8080", nil))
}

func buildRequestURL() (string, error) {
	tld := os.Getenv(tldEnv)
	if tld == "" {
		msg := fmt.Sprintf("Required environment variable %s is not set!", tldEnv)
		log.Error(msg)
		return "", errors.New(msg)
	}

	// See this article for more details on the tree parameter:
	// https://www.cloudbees.com/blog/taming-jenkins-json-api-depth-and-tree
	requestBaseURL, err := url.JoinPath(tld, "/asynchPeople/api/json")
	if err != nil {
		msg := fmt.Sprintf("Failed to build request URL: %v", err)
		log.WithError(err).Fatal(msg)
		return "", errors.New(msg)
	}

	requestURL := fmt.Sprintf("%s?%s", requestBaseURL, "tree=users[lastChange,project[fullName,url],user[id,fullName,absoluteURL,property[_class,address]{,15}]]")

	log.WithField("requestURL", requestURL).Info("Built URL for querying Jenkins user data")

	return requestURL, nil
}

func queryJenkins(w http.ResponseWriter, r *http.Request, conn *Connection) {
	log.Debugf("Received request at endpoint: %s", html.EscapeString(r.URL.Path))

	usersByDomain, err := conn.UsersByEmailDomain()
	if err != nil {
		log.WithError(err).Error("Failed to list Jenkins users by email domain")
		fmt.Fprintf(w, "Failed to list Jenkins users by email domain: %v", err)
		return
	}

	userCount := 0

	if len(usersByDomain) == 0 {
		log.Warning("Found zero users with valid email addresses for the Jenkins instance")
	} else {
		for domain, usersList := range usersByDomain {
			userCount += len(usersList)
			log.Infof("For the domain %q, found %d Jenkins user account(s)", domain, len(usersList))
		}
	}

	log.WithFields(log.Fields{
		"userCount":   userCount,
		"domainCount": len(usersByDomain),
	}).Info("Jenkins users query completed!")

	payload := PayloadFromMap(usersByDomain)

	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		log.WithError(err).Error("Failed to marshal Jenkins users to JSON")
		fmt.Fprintf(w, "Failed to marshal Jenkins users to JSON: %v", err)
		return
	}

	fmt.Fprintf(w, string(payloadJSON))
	log.Debug("Wrote users payload to response writer")
}
