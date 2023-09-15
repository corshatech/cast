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

package url_regex

import (
	"regexp"
	"time"
)

type CastRegexpDbEntry struct {
	// Underlying regex matcher, private because it shouldn't be mutated after
	// creation. Use the Detect method in this package to URLs on these rules.
	regex *regexp.Regexp

	// Title is a human-readable title for the detection as a whole, e.g.
	//    "Javascript Keywords in URL"
	Title string

	// A cvss severity word, all lowercase, describing the severity of this
	// finding when encountered; i.e. exactly one of:
	// "none"
	// "low"
	// "medium"
	// "high"
	// "critical"
	Severity string

	// Description is a human-readable text description of the finding and its
	// purpose. A good description should include the general structure of the
	// following three sentences, at least:
	// 1. What was detected?
	//    - e.g. "Javascript keywords were found in a query parameter."
	// 2. What is this detection's impact?
	//    - e.g. "This could be evidence of an XSS attack against your service."
	// 3. What should I do when encountering this?
	//    - e.g. "You may want to check your site to ensure that you are not
	//    	vulnerable to a Reflected XSS Attack using this request parameter.
	//      You may also consider banning the client performing this suspicious
	//      behavior."
	Description string

	// WeaknessLink is the URL linked to for displaying a relevant software
	// weakness related to this scan; e.g. the proper OWASP control that applies
	WeaknessLink string

	// WeaknessTitle is the human-readable link text used for displaying
	// relevant software weakness info
	WeaknessTitle string

	// Sensitive == true indicates the full MatchText should not be captured
	// and the URL should be suppressed in the UI. This should be used e.g.
	// if matching possible credentials
	Sensitive bool
}

// CastRegexpDatabase is a map of regex rule ID -> RegexpDbEntry structs
type CastRegexpDatabase = map[string]CastRegexpDbEntry

// CastRegexpDbMatch is a CAST representation of a regex rule infraction
// It includes information like the rule ID; a pointer to the rule
// so that description etc may be looked up without consulting the database;
// and the full text (if available) of the match. It also includes a
// DetectedAt time indicating when this match was made, which may not be
// the same as the traffic timestamp depending on when processing was run.
type CastRegexpDbMatch struct {
	// Rule is a pointer to the CastRegDbEntry doing the matching
	Rule *CastRegexpDbEntry

	// Unique ID of the matching Regex rule
	Id string

	// MatchText is filled with the actual text matched by the rule, provided
	// the Sensitive flag is not enabled for the rule.
	MatchText string
	// DetectedAt is the moment that CAST encountered this issue, used
	// for reporting purposes.
	DetectedAt time.Time
}

var RegexDb CastRegexpDatabase

func init() {
	RegexDb = make(map[string]CastRegexpDbEntry)

	// TODO: parameterize construction of this database, and make it
	// customizable rather than hardcoded.
	RegexDb["PassInUrl"] = CastRegexpDbEntry{
		regex:         regexp.MustCompile("(password|pass|pwd|auth|api[ -_]*key|session|session[ -_]*key)="),
		Title:         "Password in Query String",
		Severity:      "high",
		Description:   "A password or credential was detected in a URL as a query parameter. Using secure transport like HTTPS does not resolve the issue, because the URL may become logged or leak to third parties through e.g. the Referrer header. Do not include credentials in any part of a URL.",
		WeaknessLink:  "https://owasp.org/www-community/vulnerabilities/Information_exposure_through_query_strings_in_url",
		WeaknessTitle: "(OWASP) Information Exposure through Query Strings in URL",
		Sensitive:     true,
	}
}

/**
 * Detect is the same function as DetectTime, but uses time.now() as the default
 * DetectedAt value for all detections that matched.
 */
func Detect(url string) []CastRegexpDbMatch {
	return DetectTime(url, time.Now())
}

/**
 * DetectTime runs the full regular expression battery against the provided
 * URLs, returning a slice of matches against rules. An empty or nil list
 * indicates no findings were generated.
 */
func DetectTime(url string, now time.Time) []CastRegexpDbMatch {
	r := make([]CastRegexpDbMatch, 0, len(RegexDb))

	for key := range RegexDb {
		rule := RegexDb[key]
		matchIndex := rule.regex.FindStringIndex(url)
		if matchIndex != nil {
			var matchString string

			if !rule.Sensitive {
				matchString = url[matchIndex[0]:matchIndex[1]]
			}

			r = append(r, CastRegexpDbMatch{
				Rule:       &rule,
				Id:         key,
				MatchText:  matchString,
				DetectedAt: now,
			})
		}
	}

	return r
}
