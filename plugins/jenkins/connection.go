package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
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

func (c *Connection) rawUserData() (*Data, error) {
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
	return &data, nil
}

// Users lists the useful info for all users associated with the configured Jenkins instance.
func (c *Connection) Users() ([]*User, error) {
	data, err := c.rawUserData()
	if err != nil {
		return nil, err
	}
	return data.TidyUsers(), nil
}

// UsersByEmailDomain lists the useful info for all users associated with the configured Jenkins instance,
// with the users grouped by the domain of their email addresses.
func (c *Connection) UsersByEmailDomain() (map[string][]*User, error) {
	users, err := c.Users()
	if err != nil {
		return nil, err
	}

	return groupByEmailDomain(users), nil
}

func groupByEmailDomain(users []*User) map[string][]*User {
	result := map[string][]*User{}

	for _, u := range users {
		if u.EmailAddress == "" {
			log.WithFields(log.Fields{
				"user.FullName": u.FullName,
				"user.ID":       u.ID,
			}).Warning("No email address set for this user")
			continue
		}

		parts := strings.Split(u.EmailAddress, "@")
		if len(parts) < 2 {
			log.WithFields(log.Fields{
				"user.FullName": u.FullName,
				"user.ID":       u.ID,
			}).Warningf("Invalid email address for this user: %q", u.EmailAddress)
			continue
		}

		domain := parts[len(parts)-1]
		if usersSoFar, ok := result[domain]; ok {
			result[domain] = append(usersSoFar, u)
		} else {
			result[domain] = []*User{u}
		}
	}

	return result
}
