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
	"testing"
)

// kubeshark record with no Basic Auth header
var basicAuthTest0 = []byte(`{"messageType":"fullEntry","data":{"id":"000000000000000000000095","protocol":{"name":"http","version":"1.1","abbr":"HTTP"},"capture":"pcap","src":{"ip":"10.1.0.1","port":"58826","name":""},"dst":{"ip":"10.1.1.25","port":"8080","name":"httpbin.httpbin"},"namespace":"httpbin","outgoing":false,"timestamp":1673981969360,"startTime":"2023-01-17T18:59:29.360797553Z","request":{"bodySize":0,"cookies":{},"headers":{"Accept":"*/*","Connection":"close","Host":"10.1.1.25:8080","User-Agent":"kube-probe/1.25"},"headersSize":-1,"httpVersion":"HTTP/1.1","method":"GET","path":"/status/200","pathSegments":["status","200"],"queryString":{},"targetUri":"/status/200","url":"/status/200"},"response":{"bodySize":0,"content":{"encoding":"base64","mimeType":"","size":0},"cookies":{},"headers":{"Authorization":"Bearer dummy-token","Access-Control-Allow-Credentials":"true","Access-Control-Allow-Origin":"*","Content-Length":"0","Date":"Tue, 17 Jan 2023 18:59:29 GMT"},"headersSize":-1,"httpVersion":"HTTP/1.1","redirectURL":"","status":200,"statusText":"OK"},"requestSize":111,"responseSize":166,"elapsedTime":3}}`)

// kubeshark record with Basic Auth header
var basicAuthTest1 = []byte(`{"messageType":"fullEntry","data":{"id":"000000000000000000000095","protocol":{"name":"http","version":"1.1","abbr":"HTTP"},"capture":"pcap","src":{"ip":"10.1.0.1","port":"58826","name":""},"dst":{"ip":"10.1.1.25","port":"8080","name":"httpbin.httpbin"},"namespace":"httpbin","outgoing":false,"timestamp":1673981969360,"startTime":"2023-01-17T18:59:29.360797553Z","request":{"bodySize":0,"cookies":{},"headers":{"Accept":"*/*","Connection":"close","Host":"10.1.1.25:8080","User-Agent":"kube-probe/1.25", "Authorization":"Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ=="},"headersSize":-1,"httpVersion":"HTTP/1.1","method":"GET","path":"/status/200","pathSegments":["status","200"],"queryString":{},"targetUri":"/status/200","url":"/status/200"},"response":{"bodySize":0,"content":{"encoding":"base64","mimeType":"","size":0},"cookies":{},"headers":{"Authorization":"Bearer dummy-token","Access-Control-Allow-Credentials":"true","Access-Control-Allow-Origin":"*","Content-Length":"0","Date":"Tue, 17 Jan 2023 18:59:29 GMT"},"headersSize":-1,"httpVersion":"HTTP/1.1","redirectURL":"","status":200,"statusText":"OK"},"requestSize":111,"responseSize":166,"elapsedTime":3}}`)
func TestDetectBasicAuth(t *testing.T) {
	results := detectBasicAuth(basicAuthTest0)
	if len(results) != 0 {
		t.Fatalf("Incorrect number of basicAuth Headers detected. Expected: 0, found: %v", len(results))
	}

	results = detectBasicAuth(basicAuthTest1)
	if len(results) != 1 {
		t.Fatalf("Incorrect number of basicAuth Headers detected detected. Expected: 1, found: %v", len(results))
	}

	}
}
