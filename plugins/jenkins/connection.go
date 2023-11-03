package main

import "net/http"

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

func (c *Connection) Authenticate(req *http.Request) {
	if c.authStrategy != nil {
		c.authStrategy.Apply(req)
	}
}

func (c *Connection) QueryUsers(req *http.Request) error {
	return nil // TODO
}
