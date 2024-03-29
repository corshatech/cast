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
	"net/http"
	"os"
	"strings"

	log "github.com/sirupsen/logrus"
)

const (
	// Environment variables holding the username and password for basic authentication.
	usernameEnv = "JENKINS_USERNAME"
	passwordEnv = "JENKINS_PASSWORD"

	// Environment variable holding the session ID cookie for a user already authenticated with Jenkins.
	sessionIDEnv = "JENKINS_SESSION_ID"
)

// AuthStrategy defines the values and logic needed to apply an authentication strategy
// to an HTTP request.
type AuthStrategy interface {
	Apply(req *http.Request)
}

type basicAuth struct {
	username, password string
}

func (a *basicAuth) Apply(req *http.Request) {
	req.SetBasicAuth(a.username, a.password)
	log.Info("Basic auth has been set up for the request!")
}

type sessionCookieAuth struct {
	cookieName, cookieValue string
}

func (a *sessionCookieAuth) Apply(req *http.Request) {
	req.AddCookie(&http.Cookie{
		Name:  a.cookieName,
		Value: a.cookieValue,
	})

	log.Info("Session ID cookie has been set up for the request!")
}

// prepareAuth prepares the authentication strategy for any requests made to Jenkins.
// Basic auth is used if all required values are provided. If not, the session ID cookie
// is used if the required value is provided. If not, skip authentication entirely.
// NOTE: There is a distinction between missing values and invalid values; missing is
// acceptable whereas invalid will result in an error.
func prepareAuth() (AuthStrategy, error) {
	basic := basicCredentials()
	if basic != nil {
		return basic, nil
	}

	sessionCookie, err := sessionIDCookie()
	if err != nil {
		return nil, err
	}

	if sessionCookie != nil {
		return sessionCookie, nil
	}

	return nil, nil
}

func basicCredentials() *basicAuth {
	username := os.Getenv(usernameEnv)
	password := os.Getenv(passwordEnv)

	if username != "" && password != "" {
		return &basicAuth{
			username: username,
			password: password,
		}
	}

	return nil
}

func sessionIDCookie() (*sessionCookieAuth, error) {
	cookie := os.Getenv(sessionIDEnv)
	if cookie == "" {
		return nil, nil
	}

	parts := strings.Split(cookie, "=")
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		msg := "Jenkins Session ID cookie is not valid; both cookie name and value are required (before and after the equal sign)"
		log.WithField(sessionIDEnv, cookie).Error(msg)
		return nil, errors.New(msg)
	}

	cookieName, cookieValue := parts[0], parts[1]
	return &sessionCookieAuth{
		cookieName:  cookieName,
		cookieValue: cookieValue,
	}, nil
}
