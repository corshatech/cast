package main

import (
	"testing"
)

func TestGroupByEmailDomain(t *testing.T) {
	testUsers := []*User{
		{
			FullName:     "Test User 1",
			ID:           "test1",
			EmailAddress: "test.1@domain.com", // valid domain 1
		},
		{
			FullName:     "Test User Missing Email",
			ID:           "test-no-email",
			EmailAddress: "",
		},
		{
			FullName:     "Test User Invalid Email",
			ID:           "test-bad-email",
			EmailAddress: "nonsense-no-at-domain.com",
		},
		{
			FullName:     "Test User 2",
			ID:           "test2",
			EmailAddress: "test.2@domain.com", // valid domain 1
		},
		{
			FullName:     "Test User Different Domain",
			ID:           "test-diff-domain",
			EmailAddress: "test@different-domain.com", // valid domain 2
		},
	}

	usersByDomain := groupByEmailDomain(testUsers)

	if got, want := len(usersByDomain), 2; got != want {
		t.Errorf("Wanted users grouped by %d email domains, got %d domains", want, got)
	}

	usersCount := 0

	for domain, users := range usersByDomain {
		usersCount += len(users)
		switch domain {
		case "domain.com":
			if got, want := len(users), 2; got != want {
				t.Errorf("Wanted %d users for email domain %q, got %d users", want, domain, got)
			}
		case "different-domain.com":
			if got, want := len(users), 1; got != want {
				t.Errorf("Wanted %d users for email domain %q, got %d users", want, domain, got)
			}
		default:
			t.Errorf("Got unexpected email domain %q with %d users!", domain, len(users))
		}
	}

	if got, want := usersCount, 3; got != want {
		t.Errorf("Wanted %d total users, got %d users", want, got)
	}
}

func TestDomainFromEmailAddress(t *testing.T) {
	for _, test := range []struct {
		description string
		email       string
		wantError   bool
		wantDomain  string
	}{
		{
			description: "multiple @ symbols",
			email:       "user\"@wow@\"@website.com",
			wantDomain:  "website.com",
		},
		{
			description: "email with display name",
			email:       "Real Name <silly-email@website.org>",
			wantDomain:  "website.org",
		},
		{
			description: "domain value missing",
			email:       "user@",
			wantError:   true,
		},
		{
			description: "no @ symbol in email at all",
			email:       "what-even-is-email",
			wantError:   true,
		},
	} {
		t.Run(test.description, func(t *testing.T) {
			gotDomain, err := domainFromEmailAddress(test.email)

			if err == nil && test.wantError {
				t.Fatalf("Expected parsing domain from email %q to fail, but got success", test.email)
			}

			if !test.wantError {
				if err != nil {
					t.Fatalf("Expected parsing domain from email %q to succeed, but got error: %v", test.email, err)
				}

				if got, want := gotDomain, test.wantDomain; got != want {
					t.Errorf("Expected domain %q from email %q, but got domain %q", want, test.email, got)
				}
			}
		})
	}
}
