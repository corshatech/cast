package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	log "github.com/sirupsen/logrus"
)

const (
	requestTimeout = 2 * time.Minute
)

type Connection struct {
	userRequestURL string
	authStrategy   AuthStrategy
}

func NewConnection(requestURL string) (*Connection, error) {
	auth, err := prepareAuth()
	if err != nil {
		return nil, err
	}

	return &Connection{
		userRequestURL: requestURL,
		authStrategy:   auth,
	}, nil
}

func (c *Connection) QueryUsers() ([]*User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), requestTimeout)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.userRequestURL, nil)
	if err != nil {
		msg := fmt.Sprintf("Failed to create HTTP request: %v", err)
		log.WithError(err).Error(msg)
		return nil, errors.New(msg)
	}

	req.Header.Set("Accept", "application/json")

	if c.authStrategy != nil {
		c.authStrategy.Apply(req)
	}

	log.Debugf("request: %+v", req)

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		msg := fmt.Sprintf("Failed to execute HTTP request against Jenkins: %v", err)
		log.WithError(err).Error(msg)
		return nil, errors.New(msg)
	}
	defer res.Body.Close()

	resBody, err := io.ReadAll(res.Body)
	if err != nil {
		msg := fmt.Sprintf("Could not read response body: %v", err)
		log.WithError(err).Error(msg)
		return nil, errors.New(msg)
	}
	log.Debugf("response body: %s", resBody)

	var data Data
	if err := json.Unmarshal(resBody, &data); err != nil {
		msg := fmt.Sprintf("Could not unmarshal response body as user data JSON: %v", err)
		log.WithError(err).Error(msg)
		return nil, errors.New(msg)
	}

	return data.TidyUsers(), nil
}
