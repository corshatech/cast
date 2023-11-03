package main

import (
	"fmt"
	"os"
	"testing"
)

func TestUnsetBasicCredentials(t *testing.T) {
	testUsername := "user123"
	testPassword := "pass456"

	for _, test := range []struct {
		description string
		setupFunc   func()
	}{
		{
			description: "neither username or password env vars are set",
			setupFunc:   nil,
		},
		{
			description: "only username env var is set",
			setupFunc: func() {
				if err := os.Setenv(usernameEnv, testUsername); err != nil {
					t.Fatalf("Failed to set env var %q to %q: %v", usernameEnv, testUsername, err)
				}
			},
		},
		{
			description: "only password env var is set",
			setupFunc: func() {
				if err := os.Setenv(passwordEnv, testPassword); err != nil {
					t.Fatalf("Failed to set env var %q to %q: %v", passwordEnv, testPassword, err)
				}
			},
		},
	} {
		t.Run(test.description, func(t *testing.T) {
			if test.setupFunc != nil {
				test.setupFunc()
			}
			defer os.Clearenv() // ensure no test state is left behind

			username, password := basicCredentials()

			if got, want := username, ""; got != want {
				t.Errorf("Wanted empty username, but got %q", got)
			}

			if got, want := password, ""; got != want {
				t.Errorf("Wanted empty password, but got %q", got)
			}
		})
	}
}

func TestValidBasicCredentials(t *testing.T) {
	testUsername := "user123"
	testPassword := "pass456"

	if err := os.Setenv(usernameEnv, testUsername); err != nil {
		t.Fatalf("Failed to set env var %q to %q: %v", usernameEnv, testUsername, err)
	}
	defer os.Clearenv() // ensure no test state is left behind

	if err := os.Setenv(passwordEnv, testPassword); err != nil {
		t.Fatalf("Failed to set env var %q to %q: %v", passwordEnv, testPassword, err)
	}

	username, password := basicCredentials()

	if got, want := username, testUsername; got != want {
		t.Errorf("Wanted username %q, but got %q", want, got)
	}

	if got, want := password, testPassword; got != want {
		t.Errorf("Wanted password %q, but got %q", want, got)
	}
}

func TestPrepareAuthWithValidBasicCredentialsReturnsBasicAuthStrategy(t *testing.T) {
	testUsername := "user123"
	testPassword := "pass456"

	if err := os.Setenv(usernameEnv, testUsername); err != nil {
		t.Fatalf("Failed to set env var %q to %q: %v", usernameEnv, testUsername, err)
	}
	defer os.Clearenv() // ensure no test state is left behind

	if err := os.Setenv(passwordEnv, testPassword); err != nil {
		t.Fatalf("Failed to set env var %q to %q: %v", passwordEnv, testPassword, err)
	}

	strat, err := prepareAuth()
	if err != nil {
		t.Fatalf("Failed to prepare authentication strategy: %v", err)
	}

	basicStrat, ok := strat.(*basicAuth)
	if !ok {
		t.Fatalf("Wanted basic auth strategy, but got something else: %+v", strat)
	}

	if got, want := basicStrat.username, testUsername; got != want {
		t.Errorf("Wanted username %q, but got %q", want, got)
	}

	if got, want := basicStrat.password, testPassword; got != want {
		t.Errorf("Wanted password %q, but got %q", want, got)
	}
}

func TestUnsetSessionIDCookie(t *testing.T) {
	name, value, err := sessionIDCookie()
	if err != nil {
		t.Fatalf("Failed to get session ID cookie from environment: %v", err)
	}

	if got, want := name, ""; got != want {
		t.Errorf("Wanted empty cookie name, but got %q", got)
	}

	if got, want := value, ""; got != want {
		t.Errorf("Wanted empty cookie value, but got %q", got)
	}
}

func TestValidSessionIDCookie(t *testing.T) {
	testCookieName := "mySessionID"
	testCookieValue := "very-secret-session-id"

	testCookie := fmt.Sprintf("%s=%s", testCookieName, testCookieValue)

	if err := os.Setenv(sessionIDEnv, testCookie); err != nil {
		t.Fatalf("Failed to set env var %q to %q: %v", sessionIDEnv, testCookie, err)
	}
	defer os.Clearenv() // ensure no test state is left behind

	name, value, err := sessionIDCookie()
	if err != nil {
		t.Fatalf("Failed to get session ID cookie from environment: %v", err)
	}

	if got, want := name, testCookieName; got != want {
		t.Errorf("Wanted cookie name %q, but got %q", want, got)
	}

	if got, want := value, testCookieValue; got != want {
		t.Errorf("Wanted cookie value %q, but got %q", want, got)
	}
}

func TestPrepareAuthWithValidSessionIDCookieReturnsSessionCookieAuthStrategy(t *testing.T) {
	testCookieName := "mySessionID"
	testCookieValue := "very-secret-session-id"

	testCookie := fmt.Sprintf("%s=%s", testCookieName, testCookieValue)

	if err := os.Setenv(sessionIDEnv, testCookie); err != nil {
		t.Fatalf("Failed to set env var %q to %q: %v", sessionIDEnv, testCookie, err)
	}
	defer os.Clearenv() // ensure no test state is left behind

	strat, err := prepareAuth()
	if err != nil {
		t.Fatalf("Failed to prepare authentication strategy: %v", err)
	}

	cookieStrat, ok := strat.(*sessionCookieAuth)
	if !ok {
		t.Fatalf("Wanted session cookie auth strategy, but got something else: %+v", strat)
	}

	if got, want := cookieStrat.cookieName, testCookieName; got != want {
		t.Errorf("Wanted cookie name %q, but got %q", want, got)
	}

	if got, want := cookieStrat.cookieValue, testCookieValue; got != want {
		t.Errorf("Wanted cookie value %q, but got %q", want, got)
	}
}

func TestPrepareAuthWithMissingEnvValuesReturnsNilAuthStrategy(t *testing.T) {
	strat, err := prepareAuth()
	if err != nil {
		t.Fatalf("Failed to prepare authentication strategy: %v", err)
	}

	if strat != nil {
		t.Errorf("Wanted nil auth strategy when no env variables are set, but got non-nil: %+v", strat)
	}
}
