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

package url_regex_test

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"

	"github.com/corshatech/cast/collector/analysis/url_regex"
)

var fakeNow time.Time = time.UnixMilli(1100149200)

func TestUrlRegex(t *testing.T) {
	const PIUId = "PassInUrl"
	passInUrlRule := url_regex.RegexDb[PIUId]

	type urlRegexTestcase struct {
		Name      string
		Input     string
		ExpectOut []url_regex.CastRegexDbMatch
	}
	var PIUMatch = []url_regex.CastRegexDbMatch{{
		Rule:       &passInUrlRule,
		Id:         PIUId,
		MatchText:  "",
		DetectedAt: fakeNow,
	}}

	for _, scenario := range []urlRegexTestcase{
		{
			Name:  "no matches on emptystring",
			Input: "",
		},
		{
			Name:  "no matches on a harmless example URL",
			Input: "http://www.example.com/some/path?and=a+query#and_hash",
		},
		{
			Name:      "matches PIU on a URL with a password in it",
			Input:     "http://example.com/some/path?query=4&password=blah",
			ExpectOut: PIUMatch,
		},
		{
			Name:  "does not match a harmless forgot_my_password url",
			Input: "http://example.com/actions/forgot_my_password.aspmx?token=bar",
		},
	} {
		t.Run("Detect "+scenario.Name, func(t *testing.T) {
			result := url_regex.DetectTime(scenario.Input, fakeNow)
			assert.ElementsMatch(t, result, scenario.ExpectOut)
		})
	}
}
