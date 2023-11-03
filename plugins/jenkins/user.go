package main

// Project contains information about the last project/repository that a User has contributed to.
type Project struct {
	Class    string `json:"_class"`
	FullName string `json:"fullName"`
	URL      string `json:"url"`
}

// UserProperty contains any property information regarding a specific User.
// New fields must be added here if we want to capture property values for any additional
// properties going forward.
type UserProperty struct {
	Class   string `json:"_class"`
	Address string `json:"address,omitempty"`
}

// User contains the metadata and properties of a user account.
type User struct {
	FullName   string         `json:"fullName"`
	ID         string         `json:"id"`
	Properties []UserProperty `json:"property"`
}

// UserActivity contains information about each User associated with the Jenkins instance,
// as well as information about the user's most recent code change.
type UserActivity struct {
	LastChange int64   `json:"lastChange"`
	Project    Project `json:"project"`
	User       User    `json:"user"`
}

// Data contains all the information returned from the Jenkins instance regarding its users.
type Data struct {
	Class string         `json:"_class"`
	Users []UserActivity `json:"users"`
}
