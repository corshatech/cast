package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

// kubesecRuleOut is the shape of a Kubesec rule output
type kubesecRuleOut struct {
	ID       string `json:"id"`
	Selector string `json:"selector"`
	Reason   string `json:"reason"`
	Points   int    `json:"points"`
}

// kubesecScore is the shape of only parts of the Kubesec score model we care
// about.
//
// (we're specifically ignoring the "passed" list. We only need findings the
// user would have to see.)
type kubesecScore struct {
	Advise   []kubesecRuleOut `json:"advise"`
	Critical []kubesecRuleOut `json:"critical"`
}

// kubesecReceiver is the shape of only parts of the Kubesec report
// that we care about
type kubesecReceiver struct {
	Scoring kubesecScore `json:"scoring"`
}

// Finding represents the shape of our own output to be passed back
// to CAST.
type Finding struct {
	Severity  string `json:"Severity"`
	Resource  string `json:"Resource"`
	Namespace string `json:"Namespace"`
	RuleID    string `json:"Rule ID"`
	Selector  string `json:"Selector"`
	Reason    string `json:"Reason"`
	Points    int    `json:"Points"`
}

func kubesecScan(resource, yamlBody string) ([]Finding, error) {
	res := make([]Finding, 0)
	receiver := make([]kubesecReceiver, 0)

	response, err := http.Post(
		"http://cast-plugin-kubesec-srv:80/",
		"text/plain",
		strings.NewReader(yamlBody),
	)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	err = json.NewDecoder(response.Body).Decode(&receiver)

	if err != nil {
		return nil, err
	}

	if len(receiver) != 1 {
		return nil, fmt.Errorf("unexpected amount of Kubesec results: there should be exactly one document")
	}

	for _, critical := range receiver[0].Scoring.Critical {
		res = append(res, Finding{
			Severity: "critical",
			Resource: resource,
			RuleID:   critical.ID,
			Selector: critical.Selector,
			Reason:   critical.Reason,
			Points:   critical.Points,
		})
	}
	for _, none := range receiver[0].Scoring.Advise {
		res = append(res, Finding{
			Severity: "none",
			Resource: resource,
			RuleID:   none.ID,
			Selector: none.Selector,
			Reason:   none.Reason,
			Points:   none.Points,
		})
	}

	return res, nil
}
