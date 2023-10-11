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
	"fmt"
	"io"
	"net/http"
	"os"

	log "github.com/sirupsen/logrus"
)

// For now, since authentication has not been implemented for hitting the Jenkins instance,
// this URL must correspond with a public Jenkins instance.
const jenkinsTLDEnv = "JENKINS_TLD"

type UserData struct {
	Class string `json:"_class"`
	Users []struct {
		LastChange int64 `json:"lastChange"`
		Project    struct {
			Class    string `json:"_class"`
			FullName string `json:"fullName"`
			URL      string `json:"url"`
		} `json:"project"`
		User struct {
			FullName string `json:"fullName"`
			ID       string `json:"id"`
			Property []struct {
				Class   string `json:"_class"`
				Address string `json:"address,omitempty"`
			} `json:"property"`
		} `json:"user"`
	} `json:"users"`
}

func main() {
	tld := os.Getenv(jenkinsTLDEnv)
	if tld == "" {
		log.Fatalf("Required environment variable %s is not set!", jenkinsTLDEnv)
	}

	requestURL := fmt.Sprintf("%s/asynchPeople/api/json?tree=users[lastChange,project[fullName,url],user[id,fullName,absoluteURL,property[_class,address]{,15}]]", tld)

	log.WithField("requestURL", requestURL).Info("here is the request URL")

	req, err := http.NewRequest(http.MethodGet, requestURL, nil)
	if err != nil {
		log.WithError(err).Fatal("Failed to create HTTP request")
	}

	req.Header.Set("Content-Type", "application/json")

	// TODO: Set up authentication on the request to hit a non-public Jenkins instance

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		log.WithError(err).Fatal("Failed to execute HTTP request against Jenkins")
	}
	defer res.Body.Close()

	log.Info("got response!")
	log.Infof("got status code: %d", res.StatusCode)

	resBody, err := io.ReadAll(res.Body)
	if err != nil {
		log.WithError(err).Fatal("could not read response body")
	}
	log.Infof("response body: %s", resBody)

	var data UserData
	if err := json.Unmarshal(resBody, &data); err != nil {
		log.WithError(err).Fatal("could not read response body")
	}
	log.Infof("Jenkins user data: %+v", data)

	log.WithField("resultsLength", len(data.Users)).Info("Scan completed. Skipping writing results to CAST DB...")
	log.Info("Done.")
}
