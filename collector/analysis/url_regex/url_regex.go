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
	"fmt"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/emirpasic/gods/sets/hashset"
)

type CastRegexpDbEntry struct {
	// Underlying regex matcher, private because it shouldn't be mutated after
	// creation. Use the Detect method in this package to URLs on these rules.
	regex *regexp.Regexp

	// Title is a human-readable title for the detection as a whole, e.g.
	//    "Javascript Keywords in URL"
	Title string `json:"title"`

	// A cvss severity word, all lowercase, describing the severity of this
	// finding when encountered; i.e. exactly one of:
	// "none"
	// "low"
	// "medium"
	// "high"
	// "critical"
	Severity string `json:"severity"`

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
	Description string `json:"description"`

	// WeaknessLink is the URL linked to for displaying a relevant software
	// weakness related to this scan; e.g. the proper OWASP control that applies
	WeaknessLink string `json:"weaknessLink"`

	// WeaknessTitle is the human-readable link text used for displaying
	// relevant software weakness info
	WeaknessTitle string `json:"weaknessTitle"`

	// Sensitive == true indicates the full MatchText should not be captured
	// and the URL should be suppressed in the UI. This should be used e.g.
	// if matching possible credentials
	Sensitive bool `json:"sensitive"`
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
	// AbsoluteUri is the AbsoluteUri without a query string
	AbsoluteUri string
	// QueryParams are the query keys that look like passwords
	QueryParams []string
}

var RegexDb CastRegexpDatabase

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

func init() {
	RegexDb = make(map[string]CastRegexpDbEntry)

	// TODO: parameterize construction of this database, and make it
	// customizable rather than hardcoded.
	RegexDb["PassInUrl"] = CastRegexpDbEntry{
		regex:         regexp.MustCompile("(password|pass|pwd|auth|api[ -_]*key|session|session[ -_]*key)="),
		Title:         "Broken Authentication: Password in Query String",
		Severity:      "high",
		Description:   "A password or credential was detected in a URL as a query parameter. Using secure transport like HTTPS does not resolve the issue, because the URL may become logged or leak to third parties through e.g. the Referrer header. Do not include credentials in any part of a URL.",
		WeaknessLink:  "https://owasp.org/www-community/vulnerabilities/Information_exposure_through_query_strings_in_url",
		WeaknessTitle: "(OWASP) Information Exposure through Query Strings in URL",
		Sensitive:     true,
	}

	RegexDb["ServerSideRequestForgery"] = CastRegexpDbEntry{
		regex:         regexp.MustCompile(`(url=.*)|(file=.*)`),
		Title:         "Server Side Request Forgery",
		Severity:      "none",
		Description:   "A request was detected whose URL has patterns that match Server Side Request Forgery attacks. Requests in which the URL has been modified to potentially connect and retrieve data from internal unprotected services that were not previously exposed. Check that services that accept URLs reject any references to internal resources.",
		WeaknessLink:  "https://owasp.org/API-Security/editions/2023/en/0xa7-server-side-request-forgery/",
		WeaknessTitle: "(OWASP) API7:2023 Server Side Request Forgery",
		Sensitive:     false,
	}

	RegexDb["SQLInjection"] = CastRegexpDbEntry{
		regex:         regexp.MustCompile(`((;|%3B)(\s|%20)*--|("|%22)(\s|%20)*[Oo][Rr](\s|%20|\+)*("|%22){2}(%3D|=)("|%22))`),
		Title:         "SQL Injection",
		Severity:      "medium",
		Description:   "A request was detected whose URL has patterns that match SQL Injection attacks. Any input that is eventually sent to a backend service with a SQL query may not be properly sanitized and can be accessed by crafting a response that will allow the attacker to execute any query. Ensure that all queries to databases have sanitized inputs and use prepared statements.",
		WeaknessLink:  "https://owasp.org/Top10/A03_2021-Injection/",
		WeaknessTitle: "(OWASP) A03:2021 – Injection",
		Sensitive:     false,
	}

	RegexDb["Log4Shell"] = CastRegexpDbEntry{
		regex:         regexp.MustCompile(`\$\{`),
		Title:         "Log4Shell",
		Severity:      "medium",
		Description:   "A request was detected whose URL has patterns that match the Log4Shell attack. A vulnerability in a commonly used Java logging library, Log4J, allows for remote code execution with calls to JNDI servers. Apply all available security updates to Log4J and Java.",
		WeaknessLink:  "https://nvd.nist.gov/vuln/detail/CVE-2021-44228",
		WeaknessTitle: "CVE-2021-44228",
		Sensitive:     false,
	}

	RegexDb["XSS"] = CastRegexpDbEntry{
		regex:         regexp.MustCompile("(?:(?:(?:\"|%22|'|\\]|%5D|\\}|%7D|\\\\|%5C|\\d|(?:NaN|Infinity|true|false|null|undefined|Symbol|Math)|\\`|%60|\\-|\\+|%2B)(?:\\.|;|%3B))+[)]*(?:;|%3B)?((?:\\s|-|~|!|{}|%7B%7D|\\|\\||%7C%7C|\\+|%2B)*.*(?:.*=.*)))|(?:(=|%3D)[^\n]*(<|%3C)[^\n]+(>|%3E))"),
		Title:         "Cross Site Scripting",
		Severity:      "medium",
		Description:   "A request was detected whose URL has patterns that match Cross Site Scripting attacks. A Cross Site Scripting attack occurs when malicious code is sent to a user from a seemingly trusted source. This code can access session details as well as rewrite parts of the page being accessed. Ensure that your content security policy only contains references to trusted resources.",
		WeaknessLink:  "https://owasp.org/www-community/attacks/xss/",
		WeaknessTitle: "(OWASP) Cross Site Scripting (XSS)",
		Sensitive:     false,
	}
}

/**
 * Detect is the same function as DetectTime, but uses time.now() as the default
 * DetectedAt value for all detections that matched.
 */
func Detect(absoluteUri string, url string) ([]CastRegexpDbMatch, error) {
	return DetectTime(absoluteUri, url, time.Now())
}

/**
 * DetectTime runs the full regular expression battery against the provided
 * URLs, returning a slice of matches against rules. An empty or nil list
 * indicates no findings were generated.
 */
func DetectTime(absoluteUri string, requestUrl string, now time.Time) ([]CastRegexpDbMatch, error) {

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

	r := make([]CastRegexpDbMatch, 0, len(RegexDb))

	for key := range RegexDb {
		rule := RegexDb[key]
		matchIndex := rule.regex.FindStringIndex(requestUrl)
		if matchIndex != nil {
			var matchString string

			if !rule.Sensitive {
				matchString = requestUrl[matchIndex[0]:matchIndex[1]]
			}

			r = append(r, CastRegexpDbMatch{
				Rule:        &rule,
				Id:          key,
				MatchText:   matchString,
				DetectedAt:  now,
				AbsoluteUri: uri.String(),
				QueryParams: matches,
			})
		}
	}

	return r, nil
}
