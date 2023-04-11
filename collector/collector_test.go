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
	"context"
	"crypto/sha256"
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"net/http/httptest"
	"os"
	"os/exec"
	"strings"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gorilla/websocket"
	"github.com/stretchr/testify/assert"

	"github.com/corshatech/cast/collector/internal/test/kubeshark"
)

// kubeshark record with no JWTs
var jwtTest0 = []byte(`{"data":{"id":"192.168.1.3/000000000000000000000095","protocol":{"name":"http","version":"1.1","abbr":"HTTP"},"capture":"pcap","src":{"ip":"10.1.0.1","port":"58826","name":""},"dst":{"ip":"10.1.1.25","port":"8080","name":"httpbin.httpbin"},"namespace":"httpbin","outgoing":false,"timestamp":1673981969360,"startTime":"2023-01-17T18:59:29.360797553Z","request":{"bodySize":0,"cookies":{},"headers":{"Accept":"*/*","Connection":"close","Host":"10.1.1.25:8080","User-Agent":"kube-probe/1.25"},"headersSize":-1,"httpVersion":"HTTP/1.1","method":"GET","path":"/status/200","pathSegments":["status","200"],"queryString":{},"targetUri":"/status/200","url":"/status/200"},"response":{"bodySize":0,"content":{"encoding":"base64","mimeType":"","size":0},"cookies":{},"headers":{"Authorization":"Bearer dummy-token","Access-Control-Allow-Credentials":"true","Access-Control-Allow-Origin":"*","Content-Length":"0","Date":"Tue, 17 Jan 2023 18:59:29 GMT"},"headersSize":-1,"httpVersion":"HTTP/1.1","redirectURL":"","status":200,"statusText":"OK"},"requestSize":111,"responseSize":166,"elapsedTime":3}}`)

// kubeshark record with 1 JWT in Auth header
var jwtTest1 = []byte(`{"data":{"id":"192.168.1.3/000000000000000000000095","protocol":{"name":"http","version":"1.1","abbr":"HTTP"},"capture":"pcap","src":{"ip":"10.1.0.1","port":"58826","name":""},"dst":{"ip":"10.1.1.25","port":"8080","name":"httpbin.httpbin"},"namespace":"httpbin","outgoing":false,"timestamp":1673981969360,"startTime":"2023-01-17T18:59:29.360797553Z","request":{"bodySize":0,"cookies":{},"headers":{"Accept":"*/*","Connection":"close","Host":"10.1.1.25:8080","User-Agent":"kube-probe/1.25", "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"}, "headersSize":-1,"httpVersion":"HTTP/1.1","method":"GET","path":"/status/200","pathSegments":["status","200"],"queryString":{},"targetUri":"/status/200","url":"/status/200"},"response":{"bodySize":0,"content":{"encoding":"base64","mimeType":"","size":0},"cookies":{},"headers":{"Access-Control-Allow-Credentials":"true","Access-Control-Allow-Origin":"*","Content-Length":"0","Date":"Tue, 17 Jan 2023 18:59:29 GMT"},"headersSize":-1,"httpVersion":"HTTP/1.1","redirectURL":"","status":200,"statusText":"OK"},"requestSize":111,"responseSize":166,"elapsedTime":3}}`)

// has 1 JWT in Auth header and 1 in cookies
var jwtTest2 = []byte(`{"data":{"id":"192.168.1.3/000000000000000000000096","protocol":{"name":"http","version":"1.1","abbr":"HTTP"},"capture":"pcap","src":{"ip":"10.1.0.1","port":"58826","name":""},"dst":{"ip":"10.1.1.25","port":"8080","name":"httpbin.httpbin"},"namespace":"httpbin","outgoing":false,"timestamp":1673981969360,"startTime":"2023-01-17T18:59:29.360797553Z","request":{"bodySize":0,"cookies":{token: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"},"headers":{"Accept":"*/*","Connection":"close","Host":"10.1.1.25:8080","User-Agent":"kube-probe/1.25"},"headersSize":-1,"httpVersion":"HTTP/1.1","method":"GET","path":"/status/200","pathSegments":["status","200"],"queryString":{},"targetUri":"/status/200","url":"/status/200"},"response":{"bodySize":0,"content":{"encoding":"base64","mimeType":"","size":0},"cookies":{},"headers":{"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c","Access-Control-Allow-Credentials":"true","Access-Control-Allow-Origin":"*","Content-Length":"0","Date":"Tue, 17 Jan 2023 18:59:29 GMT"},"headersSize":-1,"httpVersion":"HTTP/1.1","redirectURL":"","status":200,"statusText":"OK"},"requestSize":111,"responseSize":166,"elapsedTime":3}}`)

// kubeshark record with 1 JWT with invalid signature in Auth header, 1 in request body, 1 inserted into the method field
var jwtTest3 = []byte(`"data":{"id":"192.168.1.3/000000000000000000000097","protocol":{"name":"http","version":"1.1","abbr":"HTTP"},"capture":"pcap","src":{"ip":"10.1.0.1","port":"58826","name":""},"dst":{"ip":"10.1.1.25","port":"8080","name":"httpbin.httpbin"},"namespace":"httpbin","outgoing":false,"timestamp":1673981969360,"startTime":"2023-01-17T18:59:29.360797553Z","request":{"bodySize":0,"cookies":{},"headers":{"Accept":"*/*","Connection":"close","Host":"10.1.1.25:8080","User-Agent":"kube-probe/1.25"},"headersSize":-1,"httpVersion":"HTTP/1.1","method":"GET eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM2Nzg5MCIsIm5hbWUiOiJKb2huIERvZSIsImlhdCI6MTUxNjIzOTAyMn0.F59k3-qDAqpuURGAT6IK0C2wezu4i63Jn9eLBCg9quA","path":"/status/200","pathSegments":["status","200"],"queryString":{},"targetUri":"/status/200","url":"/status/200"},"response":{"bodySize":0,"content":{"encoding":"base64","mimeType":"","size":0, "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM2ODk3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.UjSiqCcqPMDRA7YTXC1pdrbwQCUE1Eqm7EtoTH5N3xQ"},"cookies":{},"headers":{"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwp36POk6yJV_adQssw5c","Access-Control-Allow-Credentials":"true","Access-Control-Allow-Origin":"*","Content-Length":"0","Date":"Tue, 17 Jan 2023 18:59:29 GMT"},"headersSize":-1,"httpVersion":"HTTP/1.1","redirectURL":"","status":200,"statusText":"OK"},"requestSize":111,"responseSize":166,"elapsedTime":3}}`)

// kubeshark record with 1 Basic Authentication header
var useOfBasicAuthTest = []byte(`{"data":{"id":"192.168.1.3/000000000000000000000095","protocol":{"name":"http","version":"1.1","abbr":"HTTP"},"capture":"pcap","src":{"ip":"10.1.0.1","port":"58826","name":""},"dst":{"ip":"10.1.1.25","port":"8080","name":"httpbin.httpbin"},"namespace":"httpbin","outgoing":false,"timestamp":1673981969360,"startTime":"2023-01-17T18:59:29.360797553Z","request":{"bodySize":0,"cookies":{},"headers":{"Accept":"*/*","Connection":"close","Host":"10.1.1.25:8080","User-Agent":"kube-probe/1.25", "Authorization":"Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ=="}, "headersSize":-1,"httpVersion":"HTTP/1.1","method":"GET","path":"/status/200","pathSegments":["status","200"],"queryString":{},"targetUri":"/status/200","url":"/status/200"},"response":{"bodySize":0,"content":{"encoding":"base64","mimeType":"","size":0},"cookies":{},"headers":{"Access-Control-Allow-Credentials":"true","Access-Control-Allow-Origin":"*","Content-Length":"0","Date":"Tue, 17 Jan 2023 18:59:29 GMT"},"headersSize":-1,"httpVersion":"HTTP/1.1","redirectURL":"","status":200,"statusText":"OK"},"requestSize":111,"responseSize":166,"elapsedTime":3}}`)

func TestDetectJwts(t *testing.T) {
	results := detectJwts(jwtTest0)
	assert.Equal(t,
		results,
		[]string(nil),
	)

	results = detectJwts(jwtTest1)
	assert.Equal(t,
		results,
		[]string{
			"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
		},
	)

	results = detectJwts(jwtTest2)
	assert.Equal(t,
		results,
		[]string{
			"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
			"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
		},
	)

	results = detectJwts(jwtTest3)
	assert.Equal(t,
		results,
		[]string{
			"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM2Nzg5MCIsIm5hbWUiOiJKb2huIERvZSIsImlhdCI6MTUxNjIzOTAyMn0.F59k3-qDAqpuURGAT6IK0C2wezu4i63Jn9eLBCg9quA",
			"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM2ODk3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.UjSiqCcqPMDRA7YTXC1pdrbwQCUE1Eqm7EtoTH5N3xQ",
			"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwp36POk6yJV_adQssw5c",
		},
	)
}

type AnyTime struct{}

func (a AnyTime) Match(v driver.Value) bool {
	_, ok := v.(time.Time)
	return ok
}

func TestWriteRecords(t *testing.T) {

	msgStruct := TrafficItem{}
	handledJwtTest0, handledMetadataJson0, err := handleTrafficItem(jwtTest0, &msgStruct)
	assert.NoError(t, err)

	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()
	// expect mock insert to be successful
	mock.ExpectExec(`INSERT INTO traffic`).WithArgs(AnyTime{}, handledJwtTest0, handledMetadataJson0).WillReturnResult(sqlmock.NewResult(1, 1))

	kubesharkService := kubeshark.New()

	// Create test server with the echo handler.
	s := httptest.NewServer(kubesharkService.Handler)
	defer s.Close()

	// Convert http://127.0.0.1 to ws://127.0.0.1
	u := "ws" + strings.TrimPrefix(s.URL, "http") + "/ws"

	// Connect to the server

	//nolint
	ws, _, err := websocket.DefaultDialer.Dial(u, nil)
	if err != nil {
		t.Fatalf("%v", err)
	}
	defer ws.Close()

	kubesharkService.Send(
		`{"id": "192.168.1.3/000000000000000000000095", "proto": {"name": "http"}}`,
		string(jwtTest0),
	)

	err = writeRecords(db, s.URL, ws)
	assert.NoError(t, err)

	// we make sure that all expectations were met
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestWriteRecordMalformedMessage(t *testing.T) {

	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	kubesharkService := kubeshark.New()

	// Create test server with the echo handler.
	s := httptest.NewServer(kubesharkService.Handler)
	defer s.Close()

	// Convert http://127.0.0.1 to ws://127.0.0.1
	u := "ws" + strings.TrimPrefix(s.URL, "http") + "/ws"

	// Connect to the server

	//nolint
	ws, _, err := websocket.DefaultDialer.Dial(u, nil)
	if err != nil {
		t.Fatalf("%v", err)
	}
	defer ws.Close()

	kubesharkService.Send(
		`{"id": "192.168.1.3/000000000000000000000095",`,
		string(jwtTest0),
	)

	err = writeRecords(db, s.URL, ws)
	assert.ErrorContains(t, err, "failed to unmarshal websocket message:")

	// we make sure that all expectations were met
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestWriteRecordMalformedItem(t *testing.T) {

	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	kubesharkService := kubeshark.New()

	// Create test server with the echo handler.
	s := httptest.NewServer(kubesharkService.Handler)
	defer s.Close()

	// Convert http://127.0.0.1 to ws://127.0.0.1
	u := "ws" + strings.TrimPrefix(s.URL, "http") + "/ws"

	// Connect to the server

	//nolint
	ws, _, err := websocket.DefaultDialer.Dial(u, nil)
	if err != nil {
		t.Fatalf("%v", err)
	}
	defer ws.Close()

	kubesharkService.Send(
		`{"id": "192.168.1.3/000000000000000000000095", "proto": {"name": "http"}}`,
		`{`,
	)

	err = writeRecords(db, s.URL, ws)
	assert.ErrorContains(t, err, "failed to process kubeshark record:")

	// we make sure that all expectations were met
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestWriteRecordNonHTTPTraffic(t *testing.T) {

	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	kubesharkService := kubeshark.New()

	// Create test server with the echo handler.
	s := httptest.NewServer(kubesharkService.Handler)
	defer s.Close()

	// Convert http://127.0.0.1 to ws://127.0.0.1
	u := "ws" + strings.TrimPrefix(s.URL, "http") + "/ws"

	// Connect to the server

	//nolint
	ws, _, err := websocket.DefaultDialer.Dial(u, nil)
	if err != nil {
		t.Fatalf("%v", err)
	}
	defer ws.Close()

	kubesharkService.Send(
		`{"id": "192.168.1.3/000000000000000000000095", "proto": {"name": "dns"}}`,
		`{`,
	)

	err = writeRecords(db, s.URL, ws)
	assert.NoError(t, err)

	// we make sure that all expectations were met
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

var badRequest = []byte(`{"test"`)

func TestExportRecords(t *testing.T) {

	ctx := context.Background()
	ctx, cancel := context.WithCancel(ctx)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	kubesharkService := kubeshark.New()

	// Create test server with the echo handler.
	s := httptest.NewServer(kubesharkService.Handler)
	defer s.Close()

	// Convert http://127.0.0.1 to ws://127.0.0.1
	u := "ws" + strings.TrimPrefix(s.URL, "http") + "/ws"

	// Connect to the server

	//nolint
	ws, _, err := websocket.DefaultDialer.Dial(u, nil)
	assert.NoError(t, err)
	defer ws.Close()

	kubesharkService.Send(`{"id": "192.168.1.3/000", "proto": {"name": "http"}}`, string(badRequest))

	err = exportRecords(db, s.URL, ws, ctx)
	// expect error from handleTrafficItem for invalid json
	assert.ErrorContains(t, err, "failed to process kubeshark record:")

	//nolint
	ws, _, err = websocket.DefaultDialer.Dial(u, nil)
	assert.NoError(t, err)
	defer ws.Close()

	// test graceful exit
	go func(ctx context.Context) {
		err = exportRecords(db, s.URL, ws, ctx)
	}(ctx)

	cancel()

	assert.NoError(t, err)

}

var noProtocolRequest = []byte(`{"data":{"request":{"headers":{}}}}`)

func TestHandleRecord(t *testing.T) {

	// Cast 1: Request with no jwts

	var jwtTest0Map map[string]interface{}

	absoluteURI := "http://10.1.1.25:8080/status/200"

	err := json.Unmarshal(jwtTest0, &jwtTest0Map)
	assert.NoError(t, err)

	jwtTest0Map["data"].(map[string]interface{})["request"].(map[string]interface{})["absoluteURI"] = absoluteURI

	expectedJwtTest0, err := json.Marshal(jwtTest0Map["data"])
	assert.NoError(t, err)

	itemStruct0 := TrafficItem{}
	handledRecord0, handledMetadata0, err := handleTrafficItem(jwtTest0, &itemStruct0)
	assert.NoError(t, err)

	assert.Equal(t, expectedJwtTest0, handledRecord0)
	// empty DetectedJwts should be omitted
	assert.JSONEq(t, `{"UseOfBasicAuth": false}`, string(handledMetadata0))

	// Case 1: Request with auth header bearer token and absoluteURI
	var jwtTest1Map map[string]interface{}

	err = json.Unmarshal(jwtTest1, &jwtTest1Map)
	assert.NoError(t, err)

	expectedHash1 := sha256.Sum256([]byte("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"))
	jwtTest1Map["data"].(map[string]interface{})["request"].(map[string]interface{})["absoluteURI"] = absoluteURI
	jwtTest1Map["data"].(map[string]interface{})["request"].(map[string]interface{})["headers"].(map[string]interface{})["Authorization"] = fmt.Sprintf("%x", expectedHash1)

	expectedJwtTest1, err := json.Marshal(jwtTest1Map["data"])
	assert.NoError(t, err)

	itemStruct1 := TrafficItem{}
	handledRecord1, handledMetadata1, err := handleTrafficItem(jwtTest1, &itemStruct1)
	assert.NoError(t, err)

	assert.Equal(t, expectedJwtTest1, handledRecord1)
	assert.JSONEq(t, `{
	  "DetectedJwts": ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"],
	  "UseOfBasicAuth": false
	}`, string(handledMetadata1))

	// Case 3: Expected to leave empty headers alone
	itemStruct3 := TrafficItem{}
	handledRecord3, handledMetadata3, err := handleTrafficItem(noProtocolRequest, &itemStruct3)
	assert.NoError(t, err)
	assert.JSONEq(t, `{"request":{"headers":{}}}`, string(handledRecord3))
	assert.JSONEq(t, `{"UseOfBasicAuth":false}`, string(handledMetadata3))

	// Case 4: Bad json should return error
	itemStruct4 := TrafficItem{}
	_, _, err = handleTrafficItem(badRequest, &itemStruct4)
	assert.EqualError(t, err, "unexpected end of JSON input")

	// Case 5: Bad json should return error
	itemStruct5 := TrafficItem{}
	_, _, err = handleTrafficItem(nil, &itemStruct5)
	assert.EqualError(t, err, "unexpected end of JSON input")

}

func TestUseOfBasicAuth(t *testing.T) {
	msgStruct := TrafficItem{}
	_, handledMetadata, err := handleTrafficItem(useOfBasicAuthTest, &msgStruct)
	assert.NoError(t, err)
	assert.JSONEq(t, `{"UseOfBasicAuth":true}`, string(handledMetadata))

	msgStruct = TrafficItem{}
	_, handledMetadata, err = handleTrafficItem(noProtocolRequest, &msgStruct)
	assert.NoError(t, err)
	assert.JSONEq(t, `{"UseOfBasicAuth":false}`, string(handledMetadata))
}

func TestRequiredEnv(t *testing.T) {
	os.Setenv("TESTVAR", "test")
	testEnv := requiredEnv("TESTVAR")
	assert.Equal(t, "test", testEnv)

	// source: https://go.dev/talks/2014/testing.slide#23
	if os.Getenv("BE_CRASHER") == "1" {
		requiredEnv("TESTVAR1")
		return
	}

	// #nosec
	cmd := exec.Command(os.Args[0], "-test.run=TestRequiredEnv")
	cmd.Env = append(os.Environ(), "BE_CRASHER=1")
	err := cmd.Run()
	if e, ok := err.(*exec.ExitError); ok && !e.Success() {
		return
	}

	// expect fatal failure since TESTVAR1 env var doesn't exist
	t.Fatalf("process ran with err %v, want exit status 1", err)
}

func TestHubURLToWebsocketURL(t *testing.T) {
	t.Run("happy path", func(t *testing.T) {
		wsURL, err := hubURLToWebsocketURL("http://example.com/")
		assert.Equal(t, wsURL, "ws://example.com/ws")
		assert.NoError(t, err)
	})
	t.Run("bad url", func(t *testing.T) {
		wsURL, err := hubURLToWebsocketURL("\x7f")
		assert.Equal(t, wsURL, "")
		assert.ErrorContains(t, err, "could not parse Kubeshark Hub URL:")
	})
}
