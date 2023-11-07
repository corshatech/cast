package main

type Domain struct {
	Domain string   `json:"domain"`
	Users  []string `json:"users"`
}

type Response struct {
	Data []*Domain `json:"data"`
}

func PayloadFromMap(usersByDomain map[string][]*User) *Response {
	var data []*Domain
	for domain, users := range usersByDomain {
		var emails []string
		for _, u := range users {
			emails = append(emails, u.EmailAddress)
		}
		data = append(data, &Domain{
			Domain: domain,
			Users:  emails,
		})
	}

	return &Response{Data: data}
}
