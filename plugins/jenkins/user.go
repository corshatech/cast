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
	"fmt"

	log "github.com/sirupsen/logrus"
)

// Project contains information about the last project/repository that a UserAccount has contributed to.
type Project struct {
	Class    string `json:"_class"`
	FullName string `json:"fullName"`
	URL      string `json:"url"`
}

// AccountProperty contains any property information regarding a specific UserAccount.
// New fields must be added here if we want to capture property values for any additional
// properties going forward.
type AccountProperty struct {
	Class   string `json:"_class"`
	Address string `json:"address,omitempty"`
}

// UserAccount contains the metadata and properties of a user account.
type UserAccount struct {
	FullName   string            `json:"fullName"`
	ID         string            `json:"id"`
	Properties []AccountProperty `json:"property"`
}

// UserActivity contains information about each UserAccount associated with the Jenkins instance,
// as well as information about the user's most recent code change.
type UserActivity struct {
	LastChange int64       `json:"lastChange"`
	Project    Project     `json:"project"`
	User       UserAccount `json:"user"`
}

// Email finds a non-empty email address within the properties of this user.
func (ua *UserActivity) Email() string {
	for _, p := range ua.User.Properties {
		if p.Address != "" {
			return p.Address
		}
	}
	log.WithFields(log.Fields{
		"user.FullName": ua.User.FullName,
		"user.ID":       ua.User.ID,
	}).Warning("No email address found for this user.")
	return ""
}

// Data contains all the information returned from the Jenkins instance regarding its users.
type Data struct {
	Class string         `json:"_class"`
	Users []UserActivity `json:"users"`
}

// TidyUsers converts the JSON user data from Jenkins into just the usable pieces of data for each user account.
func (d *Data) TidyUsers() []*User {
	users := make([]*User, len(d.Users))
	for i, u := range d.Users {
		users[i] = &User{
			FullName:     u.User.FullName,
			ID:           u.User.ID,
			EmailAddress: u.Email(),
			LastChange:   u.LastChange,
		}
	}
	return users
}

// User contains all the information for a Jenkins user that we need to check for security red-flags in the instance.
type User struct {
	FullName     string
	ID           string
	EmailAddress string
	LastChange   int64
}

// String implements the Stringify interface so the users aren't just printed as raw pointer values.
func (u *User) String() string {
	return fmt.Sprintf("{Name: %s, ID: %s, Email: %s, Last change: %v}", u.FullName, u.ID, u.EmailAddress, u.LastChange)
}
