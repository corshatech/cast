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
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"strings"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gorilla/websocket"
	"github.com/stretchr/testify/assert"
)

// kubeshark record with no JWTs
var jwtTest0 = []byte(`{"messageType":"fullEntry","data":{"id":"000000000000000000000095","protocol":{"name":"http","version":"1.1","abbr":"HTTP"},"capture":"pcap","src":{"ip":"10.1.0.1","port":"58826","name":""},"dst":{"ip":"10.1.1.25","port":"8080","name":"httpbin.httpbin"},"namespace":"httpbin","outgoing":false,"timestamp":1673981969360,"startTime":"2023-01-17T18:59:29.360797553Z","request":{"bodySize":0,"cookies":{},"headers":{"Accept":"*/*","Connection":"close","Host":"10.1.1.25:8080","User-Agent":"kube-probe/1.25"},"headersSize":-1,"httpVersion":"HTTP/1.1","method":"GET","path":"/status/200","pathSegments":["status","200"],"queryString":{},"targetUri":"/status/200","url":"/status/200"},"response":{"bodySize":0,"content":{"encoding":"base64","mimeType":"","size":0},"cookies":{},"headers":{"Authorization":"Bearer dummy-token","Access-Control-Allow-Credentials":"true","Access-Control-Allow-Origin":"*","Content-Length":"0","Date":"Tue, 17 Jan 2023 18:59:29 GMT"},"headersSize":-1,"httpVersion":"HTTP/1.1","redirectURL":"","status":200,"statusText":"OK"},"requestSize":111,"responseSize":166,"elapsedTime":3}}`)

// kubeshark record with 1 JWT in Auth header
var jwtTest1 = []byte(`{"messageType":"fullEntry","data":{"id":"000000000000000000000095","protocol":{"name":"http","version":"1.1","abbr":"HTTP"},"capture":"pcap","src":{"ip":"10.1.0.1","port":"58826","name":""},"dst":{"ip":"10.1.1.25","port":"8080","name":"httpbin.httpbin"},"namespace":"httpbin","outgoing":false,"timestamp":1673981969360,"startTime":"2023-01-17T18:59:29.360797553Z","request":{"bodySize":0,"cookies":{},"headers":{"Accept":"*/*","Connection":"close","Host":"10.1.1.25:8080","User-Agent":"kube-probe/1.25", "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"}, "headersSize":-1,"httpVersion":"HTTP/1.1","method":"GET","path":"/status/200","pathSegments":["status","200"],"queryString":{},"targetUri":"/status/200","url":"/status/200"},"response":{"bodySize":0,"content":{"encoding":"base64","mimeType":"","size":0},"cookies":{},"headers":{"Access-Control-Allow-Credentials":"true","Access-Control-Allow-Origin":"*","Content-Length":"0","Date":"Tue, 17 Jan 2023 18:59:29 GMT"},"headersSize":-1,"httpVersion":"HTTP/1.1","redirectURL":"","status":200,"statusText":"OK"},"requestSize":111,"responseSize":166,"elapsedTime":3}}`)

// has 1 JWT in Auth header and 1 in cookies
var jwtTest2 = []byte(`{"messageType":"fullEntry","data":{"id":"000000000000000000000096","protocol":{"name":"http","version":"1.1","abbr":"HTTP"},"capture":"pcap","src":{"ip":"10.1.0.1","port":"58826","name":""},"dst":{"ip":"10.1.1.25","port":"8080","name":"httpbin.httpbin"},"namespace":"httpbin","outgoing":false,"timestamp":1673981969360,"startTime":"2023-01-17T18:59:29.360797553Z","request":{"bodySize":0,"cookies":{token: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"},"headers":{"Accept":"*/*","Connection":"close","Host":"10.1.1.25:8080","User-Agent":"kube-probe/1.25"},"headersSize":-1,"httpVersion":"HTTP/1.1","method":"GET","path":"/status/200","pathSegments":["status","200"],"queryString":{},"targetUri":"/status/200","url":"/status/200"},"response":{"bodySize":0,"content":{"encoding":"base64","mimeType":"","size":0},"cookies":{},"headers":{"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c","Access-Control-Allow-Credentials":"true","Access-Control-Allow-Origin":"*","Content-Length":"0","Date":"Tue, 17 Jan 2023 18:59:29 GMT"},"headersSize":-1,"httpVersion":"HTTP/1.1","redirectURL":"","status":200,"statusText":"OK"},"requestSize":111,"responseSize":166,"elapsedTime":3}}`)

// kubeshark record with 1 JWT with invalid signature in Auth header, 1 in request body, 1 inserted into the method field
var jwtTest3 = []byte(`{"messageType":"fullEntry","data":{"id":"000000000000000000000097","protocol":{"name":"http","version":"1.1","abbr":"HTTP"},"capture":"pcap","src":{"ip":"10.1.0.1","port":"58826","name":""},"dst":{"ip":"10.1.1.25","port":"8080","name":"httpbin.httpbin"},"namespace":"httpbin","outgoing":false,"timestamp":1673981969360,"startTime":"2023-01-17T18:59:29.360797553Z","request":{"bodySize":0,"cookies":{},"headers":{"Accept":"*/*","Connection":"close","Host":"10.1.1.25:8080","User-Agent":"kube-probe/1.25"},"headersSize":-1,"httpVersion":"HTTP/1.1","method":"GET eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM2Nzg5MCIsIm5hbWUiOiJKb2huIERvZSIsImlhdCI6MTUxNjIzOTAyMn0.F59k3-qDAqpuURGAT6IK0C2wezu4i63Jn9eLBCg9quA","path":"/status/200","pathSegments":["status","200"],"queryString":{},"targetUri":"/status/200","url":"/status/200"},"response":{"bodySize":0,"content":{"encoding":"base64","mimeType":"","size":0, "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM2ODk3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.UjSiqCcqPMDRA7YTXC1pdrbwQCUE1Eqm7EtoTH5N3xQ"},"cookies":{},"headers":{"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwp36POk6yJV_adQssw5c","Access-Control-Allow-Credentials":"true","Access-Control-Allow-Origin":"*","Content-Length":"0","Date":"Tue, 17 Jan 2023 18:59:29 GMT"},"headersSize":-1,"httpVersion":"HTTP/1.1","redirectURL":"","status":200,"statusText":"OK"},"requestSize":111,"responseSize":166,"elapsedTime":3}}`)

func TestDetectJwts(t *testing.T) {
	results := detectJwts(jwtTest0)
	if len(results) != 0 {
		t.Fatalf("Incorrect number of jwts detected. Expected: 0, found: %v", len(results))
	}

	results = detectJwts(jwtTest1)
	if len(results) != 1 {
		t.Fatalf("Incorrect number of jwts detected. Expected: 1, found: %v", len(results))
	}

	results = detectJwts(jwtTest2)
	if len(results) != 2 {
		t.Fatalf("Incorrect number of jwts detected. Expected: 2, found: %v", len(results))
	}

	results = detectJwts(jwtTest3)
	if len(results) != 3 {
		t.Fatalf("Incorrect number of jwts detected. Expected: 3, found: %v", len(results))
	}
}

var upgrader = websocket.Upgrader{}

func echo(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer c.Close()
	for {
		mt, message, err := c.ReadMessage()
		if err != nil {
			break
		}
		err = c.WriteMessage(mt, message)
		if err != nil {
			break
		}
	}
}

var notFullEntry = []byte(`{"messageType":""}`)

type AnyTime struct{}

func (a AnyTime) Match(v driver.Value) bool {
	_, ok := v.(time.Time)
	return ok
}

func TestWriteRecords(t *testing.T) {

	msgStruct := Message{}
	handledJwtTest0, handledMetadataJson0, err := handleMessage(jwtTest0, &msgStruct)
	assert.NoError(t, err)

	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()
	// expect mock insert to be successful
	mock.ExpectExec(`INSERT INTO traffic`).WithArgs(AnyTime{}, handledJwtTest0, handledMetadataJson0).WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	// Create test server with the echo handler.
	s := httptest.NewServer(http.HandlerFunc(echo))
	defer s.Close()

	// Convert http://127.0.0.1 to ws://127.0.0.1
	u := "ws" + strings.TrimPrefix(s.URL, "http")

	// Connect to the server

	//nolint
	ws, _, err := websocket.DefaultDialer.Dial(u, nil)
	if err != nil {
		t.Fatalf("%v", err)
	}
	defer ws.Close()

	err = ws.WriteMessage(websocket.TextMessage, jwtTest0)
	assert.NoError(t, err)

	err = writeRecords(db, ws)
	assert.NoError(t, err)

	// expect no sql insert for invalid records
	err = ws.WriteMessage(websocket.TextMessage, notFullEntry)
	assert.NoError(t, err)

	err = writeRecords(db, ws)
	assert.NoError(t, err)

}

var badRequest = []byte(`{"test"`)

func TestExportRecords(t *testing.T) {

	ctx := context.Background()
	ctx, cancel := context.WithCancel(ctx)
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	// Create test server with the echo handler.
	s := httptest.NewServer(http.HandlerFunc(echo))
	defer s.Close()

	// Convert http://127.0.0.1 to ws://127.0.0.
	u := "ws" + strings.TrimPrefix(s.URL, "http")

	// Connect to the server

	//nolint
	ws, _, err := websocket.DefaultDialer.Dial(u, nil)
	assert.NoError(t, err)
	defer ws.Close()

	err = ws.WriteMessage(websocket.TextMessage, badRequest)
	assert.NoError(t, err)

	err = exportRecords(db, ws, ctx)
	// expect error from handleMessage for invalid json
	assert.EqualError(t, err, "unexpected end of JSON input")

	//nolint
	ws, _, err = websocket.DefaultDialer.Dial(u, nil)
	assert.NoError(t, err)
	defer ws.Close()

	// test graceful exit
	go func(ctx context.Context) {
		err = exportRecords(db, ws, ctx)
	}(ctx)

	cancel()

	assert.NoError(t, err)

}

var noProtocolRequest = []byte(`{"messageType":"fullEntry","data":{"request":{"headers":{}}}}`)

func TestHandleRecord(t *testing.T) {

	// Case 1: Request with auth header bearer token and absoluteURI
	var jwtTest1Map map[string]interface{}

	err := json.Unmarshal(jwtTest1, &jwtTest1Map)
	assert.NoError(t, err)

	expectedHash1 := sha256.Sum256([]byte("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"))
	jwtTest1Map["data"].(map[string]interface{})["request"].(map[string]interface{})["absoluteURI"] = "http://10.1.1.25:8080/status/200"
	jwtTest1Map["data"].(map[string]interface{})["request"].(map[string]interface{})["headers"].(map[string]interface{})["Authorization"] = fmt.Sprintf("%x", expectedHash1)

	expectedJwtTest1, err := json.Marshal(jwtTest1Map["data"])
	assert.NoError(t, err)

	msgStruct1 := Message{}
	handledRecord1, handledMetadata1, err := handleMessage(jwtTest1, &msgStruct1)
	assert.NoError(t, err)

	assert.Equal(t, expectedJwtTest1, handledRecord1)
	assert.Equal(t, []byte(`{"UseOfBasicAuth":false}`), handledMetadata1)

	// Case 2: Record that is not 'fullEntry' type should be nil
	msgStruct2 := Message{}
	handledRecord2, handledMetadata2, err := handleMessage(notFullEntry, &msgStruct2)
	assert.NoError(t, err)
	assert.Empty(t, handledRecord2)
	assert.Empty(t, handledMetadata2)

	// Case 3: Expected to leave empty headers alone
	msgStruct3 := Message{}
	handledRecord3, handledMetadata3, err := handleMessage(noProtocolRequest, &msgStruct3)
	assert.NoError(t, err)
	assert.Equal(t, []byte(`{"request":{"headers":{}}}`), handledRecord3)
	assert.Equal(t, []byte(`{"request":{"headers":{}}}`), handledRecord3)
	assert.Equal(t, []byte(`{"UseOfBasicAuth":false}`), handledMetadata3)

	// Case 4: Bad json should return error
	msgStruct4 := Message{}
	_, _, err = handleMessage(badRequest, &msgStruct4)
	assert.EqualError(t, err, "unexpected end of JSON input")

	// Case 4: Bad json should return error
	msgStruct5 := Message{}
	_, _, err = handleMessage(nil, &msgStruct5)
	assert.EqualError(t, err, "unexpected end of JSON input")

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
