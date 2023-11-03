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
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	log "github.com/sirupsen/logrus"
)

const (
	// Environment variable holding the top level domain corresponding with the Jenkins instance.
	tldEnv = "JENKINS_TLD"

	// Environment variables holding the username and password for basic authentication.
	usernameEnv = "JENKINS_USERNAME"
	passwordEnv = "JENKINS_PASSWORD"

	// Environment variable holding the session ID cookie for a user already authenticated with Jenkins.
	sessionIDEnv = "JENKINS_SESSION_ID"

	requestTimeout = 2 * time.Minute
)

// Project contains information about the last project/repository that a User has contributed to.
type Project struct {
	Class    string `json:"_class"`
	FullName string `json:"fullName"`
	URL      string `json:"url"`
}

// UserProperty contains any property information regarding a specific User.
// New fields must be added here if we want to capture property values for any additional
// properties going forward.
type UserProperty struct {
	Class   string `json:"_class"`
	Address string `json:"address,omitempty"`
}

// User contains the metadata and properties of a user account.
type User struct {
	FullName   string         `json:"fullName"`
	ID         string         `json:"id"`
	Properties []UserProperty `json:"property"`
}

// UserActivity contains information about each User associated with the Jenkins instance,
// as well as information about the user's most recent code change.
type UserActivity struct {
	LastChange int64   `json:"lastChange"`
	Project    Project `json:"project"`
	User       User    `json:"user"`
}

// Data contains all the information returned from the Jenkins instance regarding its users.
type Data struct {
	Class string         `json:"_class"`
	Users []UserActivity `json:"users"`
}

func main() {
	tld := os.Getenv(tldEnv)
	if tld == "" {
		log.Fatalf("Required environment variable %s is not set!", tldEnv)
	}

	// See this article for more details on the tree parameter:
	// https://www.cloudbees.com/blog/taming-jenkins-json-api-depth-and-tree
	requestBaseURL, err := url.JoinPath(tld, "/asynchPeople/api/json")
	if err != nil {
		log.WithError(err).Fatal("Failed to build request URL")
	}

	requestURL := fmt.Sprintf("%s?%s", requestBaseURL, "tree=users[lastChange,project[fullName,url],user[id,fullName,absoluteURL,property[_class,address]{,15}]]")

	log.WithField("requestURL", requestURL).Info("Successfully built URL to fetch Jenkins user data")

	ctx, cancel := context.WithTimeout(context.Background(), requestTimeout)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		log.WithError(err).Fatal("Failed to create HTTP request")
	}

	req.Header.Set("Accept", "application/json")

	// Authenticate with Jenkins. Try basic auth first, then fall back to using the session ID cookie.
	// If the environment variables needed for authentication are all missing, skip it entirely.
	if !setBasicAuth(req) {
		setSessionIDCookie(req)
	}

	log.Debugf("request: %+v", req)

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		log.WithError(err).Fatal("Failed to execute HTTP request against Jenkins")
	}
	defer res.Body.Close()

	resBody, err := io.ReadAll(res.Body)
	if err != nil {
		log.WithError(err).Fatal("could not read response body")
	}
	log.Debugf("response body: %s", resBody)

	var data Data
	if err := json.Unmarshal(resBody, &data); err != nil {
		log.WithError(err).Fatal("could not unmarshal user data")
	}

	log.Debugf("Jenkins user data: %+v", data)

	log.WithField("resultsLength", len(data.Users)).Info("Scan completed. Skipping writing results to CAST DB...")
	log.Info("Done.")
}

func setBasicAuth(req *http.Request) bool {
	username := os.Getenv(usernameEnv)
	if username == "" {
		return false
	}

	password := os.Getenv(passwordEnv)
	if password == "" {
		return false
	}

	req.SetBasicAuth(username, password)
	log.Info("Basic auth has been set up for the request!")
	return true
}

func setSessionIDCookie(req *http.Request) {
	cookie := os.Getenv(sessionIDEnv)
	if cookie == "" {
		return
	}

	parts := strings.Split(cookie, "=")
	if len(parts) != 2 {
		log.WithField(sessionIDEnv, cookie).Fatal("Jenkins Session ID cookie is not valid; both parts, before and after the equal sign, are required")
	}

	cookieName, cookieValue := parts[0], parts[1]

	req.AddCookie(&http.Cookie{
		Name:  cookieName,
		Value: cookieValue,
	})

	log.Info("Session ID cookie has been set up for the request!")
}
