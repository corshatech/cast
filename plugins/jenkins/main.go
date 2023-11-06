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
	"errors"
	"fmt"
	"net/url"
	"os"

	log "github.com/sirupsen/logrus"
)

const (
	// Environment variable holding the top level domain corresponding with the Jenkins instance.
	tldEnv = "JENKINS_TLD"
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

	usersByDomain, err := conn.UsersByEmailDomain()
	if err != nil {
		errLogger.WithError(err).Fatal("Failed to list Jenkins users by email domain")
	}

	userCount := 0

	if len(usersByDomain) == 0 {
		errLogger.Warning("Found zero users with valid email addresses for the provided Jenkins instance")
	} else {
		for domain, usersList := range usersByDomain {
			userCount += len(usersList)
			log.Infof("For the domain %q, found %d Jenkins user account(s)", domain, len(usersList))
		}
	}

	log.WithFields(log.Fields{
		"userCount":   userCount,
		"domainCount": len(usersByDomain),
	}).Info("Scan completed. Skipping writing results to CAST DB...")
	log.Info("Done.")
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
