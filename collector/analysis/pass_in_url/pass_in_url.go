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

package pass_in_url

import (
	"fmt"
	"net/url"
	"strings"

	"github.com/emirpasic/gods/sets/hashset"
)

// keys are the query string keys to match on.
// NOTE: these must be lower-case
var keys = hashset.New(
	"password",
	"pass",
	"pwd",
	"auth",
	"apikey",
	"api-key",
	"session",
	"sessionkey",
	"session-key",
)

// PassInUrl is the result of the pass-in-url analysis
type PassInUrl struct {
	// AbsoluteUri is the AbsoluteUri without a query string
	AbsoluteUri string
	// QueryParams are the query keys that look like passwords
	QueryParams []string
}

// Detect returns a new PassInUrl if it detects passwords in the absoluteUri, nil otherwise
func Detect(absoluteUri string) (*PassInUrl, error) {
	uri, err := url.Parse(absoluteUri)
	if err != nil {
		return nil, fmt.Errorf("error parsing absoluteUri: %w", err)
	}

	query, err := url.ParseQuery(uri.RawQuery)
	if err != nil {
		return nil, fmt.Errorf("error parsing absoluteUri query: %w", err)
	}

	var matches []string
	for k := range query {
		if keys.Contains(strings.ToLower(k)) {
			matches = append(matches, k)
		}
	}
	if len(matches) == 0 {
		return nil, nil
	}

	uri.RawQuery = ""
	passInUrl := PassInUrl{
		AbsoluteUri: uri.String(),
		QueryParams: matches,
	}
	return &passInUrl, nil
}
