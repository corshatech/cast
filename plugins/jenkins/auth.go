package main

import (
	"errors"
	"net/http"
	"os"
	"strings"

	log "github.com/sirupsen/logrus"
)

// prepareAuth prepares the request to authenticate with Jenkins if possible.
// Basic auth is used if all required values are provided. If not, set the session ID cookie
// if the required value is provided. If not, skip authentication entirely.
// NOTE: There is a distinction between missing values and invalid values; missing is
// acceptable whereas invalid will cause the program to fail.
func prepareAuth(req *http.Request) error {
	username, password := basicCredentials()
	if username != "" && password != "" {
		setBasicAuth(req, username, password)
		return nil
	}

	cookieName, cookieValue, err := sessionIDCookie()
	if err != nil {
		return err
	}

	if cookieName != "" && cookieValue != "" {
		setSessionIDCookie(req, cookieName, cookieValue)
	}

	return nil
}

func basicCredentials() (string, string) {
	username := os.Getenv(usernameEnv)
	password := os.Getenv(passwordEnv)

	if username == "" || password == "" {
		return "", ""
	}

	return username, password
}

func setBasicAuth(req *http.Request, username, password string) {
	req.SetBasicAuth(username, password)
	log.Info("Basic auth has been set up for the request!")
}

func sessionIDCookie() (string, string, error) {
	cookie := os.Getenv(sessionIDEnv)
	if cookie == "" {
		return "", "", nil
	}

	parts := strings.Split(cookie, "=")
	if len(parts) != 2 {
		msg := "Jenkins Session ID cookie is not valid; both parts, before and after the equal sign, are required"
		log.WithField(sessionIDEnv, cookie).Fatal(msg)
		return "", "", errors.New(msg)
	}

	cookieName, cookieValue := parts[0], parts[1]
	return cookieName, cookieValue, nil
}

func setSessionIDCookie(req *http.Request, cookieName, cookieValue string) {
	req.AddCookie(&http.Cookie{
		Name:  cookieName,
		Value: cookieValue,
	})

	log.Info("Session ID cookie has been set up for the request!")
}
