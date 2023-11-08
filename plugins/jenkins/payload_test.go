package main

import "testing"

func TestPayloadFromMap(t *testing.T) {
	testUsers := map[string][]*User{
		"domain-one.com": {
			{
				FullName:     "Com User 1",
				ID:           "user1",
				EmailAddress: "user1@domain-one.com",
			},
			{
				FullName:     "Com User 2",
				ID:           "user2",
				EmailAddress: "user2@domain-one.com",
			},
		},
		"second-domain.biz": {
			{
				FullName:     "Biz User 1",
				ID:           "user1",
				EmailAddress: "user1@second-domain.biz",
			},
		},
	}

	payload := PayloadFromMap(testUsers)
	if got, want := len(payload.Data), 2; got != want {
		t.Errorf("Wanted %d domains, got %d domains", want, got)
	}

	usersCount := 0

	for _, d := range payload.Data {
		usersCount += len(d.Users)

		switch d.Domain {
		case "domain-one.com":
			if got, want := len(d.Users), 2; got != want {
				t.Errorf("Wanted %d users for email domain %q, got %d users", want, d, got)
			}
		case "second-domain.biz":
			if got, want := len(d.Users), 1; got != want {
				t.Errorf("Wanted %d users for email domain %q, got %d users", want, d, got)
			}
		default:
			t.Errorf("Got unexpected email domain %q with %d users!", d.Domain, len(d.Users))
		}
	}

	if got, want := usersCount, 3; got != want {
		t.Errorf("Wanted %d total users, got %d users", want, got)
	}
}
