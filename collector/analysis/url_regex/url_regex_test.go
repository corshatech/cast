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
	passInUrlRule := url_regex.RegexDb["PassInUrl"]
	serverSideRequestForgeryRule := url_regex.RegexDb["ServerSideRequestForgery"]
	sqlInjectionRule := url_regex.RegexDb["SQLInjection"]
	log4ShellRule := url_regex.RegexDb["Log4Shell"]
	xssRule := url_regex.RegexDb["XSS"]

	type urlRegexTestcase struct {
		Name      string
		Input     string
		ExpectOut []url_regex.CastRegexpDbMatch
	}

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
			Name:  "does not match a harmless forgot_my_password url",
			Input: "http://example.com/actions/forgot_my_password.aspmx?token=bar",
		},
		{
			Name:  "matches PIU on a URL with a password in it",
			Input: "http://example.com/some/path?query=4&password=blah",
			ExpectOut: []url_regex.CastRegexpDbMatch{{
				Rule:       &passInUrlRule,
				Id:         "PassInUrl",
				MatchText:  "",
				DetectedAt: fakeNow,
			}},
		},
		{
			Name:  "PIU matches multiple",
			Input: "http://example.com?password=xyzzy&pass=xyzzy&foo=bar",
			ExpectOut: []url_regex.CastRegexpDbMatch{{
				Rule:       &passInUrlRule,
				Id:         "PassInUrl",
				MatchText:  "",
				DetectedAt: fakeNow,
			}},
		},
		{
			Name:  "matches SSRF",
			Input: "http://example.com?upload_url=localhost:3000",
			ExpectOut: []url_regex.CastRegexpDbMatch{{
				Rule:       &serverSideRequestForgeryRule,
				Id:         "ServerSideRequestForgery",
				MatchText:  "url=localhost:3000",
				DetectedAt: fakeNow,
			}},
		},
		{
			Name:  "matches SQLInjection",
			Input: "http://example.com?user=%22%20OR%20%22%22%3D%22",
			ExpectOut: []url_regex.CastRegexpDbMatch{{
				Rule:       &sqlInjectionRule,
				Id:         "SQLInjection",
				MatchText:  "%22%20OR%20%22%22%3D%22",
				DetectedAt: fakeNow,
			}},
		},
		{
			Name:  "matches Log4Shell",
			Input: "http://example.com?q=${jndi:http:%2F%2Fgoogle.com}",
			ExpectOut: []url_regex.CastRegexpDbMatch{{
				Rule:       &log4ShellRule,
				Id:         "Log4Shell",
				MatchText:  "${",
				DetectedAt: fakeNow,
			}},
		},
		{
			Name:  "matches XSS",
			Input: "http://example.com?var1=Math.random()&var2=test",
			ExpectOut: []url_regex.CastRegexpDbMatch{{
				Rule:       &xssRule,
				Id:         "XSS",
				MatchText:  "Math.random()&var2=test",
				DetectedAt: fakeNow,
			}},
		},
	} {
		t.Run("Detect "+scenario.Name, func(t *testing.T) {
			result := url_regex.DetectTime(scenario.Input, fakeNow)

			if scenario.ExpectOut == nil {
				assert.Len(t, result, 0)
			} else {
				// All examples currently have 1 finding
				assert.Equal(t, scenario.ExpectOut[0].MatchText, result[0].MatchText)
				assert.Equal(t, scenario.ExpectOut[0].Rule, result[0].Rule)
				assert.Equal(t, scenario.ExpectOut[0].Id, result[0].Id)
				assert.Equal(t, scenario.ExpectOut[0].DetectedAt, result[0].DetectedAt)
			}
		})
	}

}
