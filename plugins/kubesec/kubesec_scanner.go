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

func kubesecScan(resource, namespace, yamlBody string) ([]Finding, error) {
	var receiver []kubesecReceiver

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

	criticalCount := len(receiver[0].Scoring.Critical)
	adviseCount := len(receiver[0].Scoring.Advise)
	result := make([]Finding, 0, criticalCount+adviseCount)

	for _, critical := range receiver[0].Scoring.Critical {
		result = append(result, Finding{
			Severity:  "critical",
			Resource:  resource,
			Namespace: namespace,
			RuleID:    critical.ID,
			Selector:  critical.Selector,
			Reason:    critical.Reason,
			Points:    critical.Points,
		})
	}
	for _, none := range receiver[0].Scoring.Advise {
		result = append(result, Finding{
			Severity:  "none",
			Resource:  resource,
			Namespace: namespace,
			RuleID:    none.ID,
			Selector:  none.Selector,
			Reason:    none.Reason,
			Points:    none.Points,
		})
	}

	return result, nil
}
