-- Copyright 2022 Corsha.
-- Licensed under the Apache License, Version 2.0 (the 'License');
-- you may not use this file except in compliance with the License.
-- You may obtain a copy of the License at
--       http://www.apache.org/licenses/LICENSE-2.0
-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an 'AS IS' BASIS,
-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
-- See the License for the specific language governing permissions and
-- limitations under the License.

INSERT INTO traffic (occurred_at, data) VALUES
--
-- reused-auth
--

-- client 1 (192.2.0.1) which made requests to two urls with the same auth as client 2
('2023-01-18 13:12:00.000', '{
	"protocol": {
		"name": "http"
	},
	"request": {
    "absoluteURI": "http://example.com/url-1",
		"headers": {
			"Authorization": "fGxJWjolVURhX2xbUGlWRVBtN3xGJldxW01URiMzNmg$oKXSg9IvLop//YzTkFL7Xw"
		}
	},
  "dst": {
    "ip": "10.1.0.96",
    "name": "",
    "port": "8181"
  },
  "src": {
    "ip": "192.2.0.1",
    "name": "",
    "port": "57944"
  },
	"id": "000000000000000000000090",
	"timestamp": 1674047520000
}'),
('2023-01-18 13:12:01.000', '{
	"protocol": {
		"name": "http"
	},
	"request": {
    "absoluteURI": "http://example.com/url-2",
		"headers": {
			"Authorization": "fGxJWjolVURhX2xbUGlWRVBtN3xGJldxW01URiMzNmg$oKXSg9IvLop//YzTkFL7Xw"
		}
	},
  "dst": {
    "ip": "10.1.0.96",
    "name": "",
    "port": "8181"
  },
  "src": {
    "ip": "192.2.0.1",
    "name": "",
    "port": "57945"
  },
	"id": "000000000000000000000091",
	"timestamp": 1674047521000
}'),
-- client 2 (192.2.0.2) which made a request to one url with the same auth as client 1
('2023-01-18 13:12:02.000', '{
	"protocol": {
		"name": "http"
	},
	"request": {
    "absoluteURI": "http://example.com/url-1",
		"headers": {
			"Authorization": "fGxJWjolVURhX2xbUGlWRVBtN3xGJldxW01URiMzNmg$oKXSg9IvLop//YzTkFL7Xw"
		}
	},
  "dst": {
    "ip": "10.1.0.96",
    "name": "",
    "port": "8181"
  },
  "src": {
    "ip": "192.2.0.2",
    "name": "",
    "port": "57944"
  },
	"id": "000000000000000000000092",
	"timestamp": 1674047522000
}'),
-- client 3 (192.2.0.3) which made a request with a unique auth header, this request should not show up in the reused-auth result
('2023-01-18 13:12:03.000', '{
	"protocol": {
		"name": "http"
	},
	"request": {
    "absoluteURI": "http://example.com/url-1",
		"headers": {
			"Authorization": "fGxJWjolVURhX2xbUGlWRVBtN3xGJldxW01URiMzNmg$oKXSg9IvLop//xyzzy"
		}
	},
  "dst": {
    "ip": "10.1.0.96",
    "name": "",
    "port": "8181"
  },
  "src": {
    "ip": "192.2.0.3",
    "name": "",
    "port": "57944"
  },
	"id": "000000000000000000000093",
	"timestamp": 1674047523000
}'),

-- request with 1 JWT in Auth header
('2023-01-17 18:59:29.360797553', '{
   "protocol":{
      "name":"http",
      "version":"1.1",
      "abbr":"HTTP"
   },
   "capture":"pcap",
   "src":{
      "ip":"10.1.0.1",
      "port":"58826",
      "name":""
   },
   "dst":{
      "ip":"10.1.1.25",
      "port":"8080",
      "name":"httpbin.httpbin"
   },
   "namespace":"httpbin",
   "outgoing":false,
   "timestamp":1673981969360,
   "startTime":"2023-01-17T18:59:29.360797553Z",
   "request":{
      "bodySize":0,
      "cookies":{
         
      },
      "headers":{
         "Accept":"*/*",
         "Connection":"close",
         "Host":"10.1.1.25:8080",
         "User-Agent":"kube-probe/1.25"
      },
      "headersSize":-1,
      "httpVersion":"HTTP/1.1",
      "method":"GET",
      "path":"/status/200",
      "pathSegments":[
         "status",
         "200"
      ],
      "queryString":{
         
      },
      "targetUri":"/status/200",
      "url":"/status/200"
   },
   "response":{
      "bodySize":0,
      "content":{
         "encoding":"base64",
         "mimeType":"",
         "size":0
      },
      "cookies":{
         
      },
      "headers":{
         "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
         "Access-Control-Allow-Credentials":"true",
         "Access-Control-Allow-Origin":"*",
         "Content-Length":"0",
         "Date":"Tue, 17 Jan 2023 18:59:29 GMT"
      },
      "headersSize":-1,
      "httpVersion":"HTTP/1.1",
      "redirectURL":"",
      "status":200,
      "statusText":"OK"
   },
   "requestSize":111,
   "responseSize":166,
   "elapsedTime":3
}'),
-- request with 1 JWT in Auth header and 1 in cookies
('2023-01-17 18:59:29.360797553', '{
   "protocol":{
      "name":"http",
      "version":"1.1",
      "abbr":"HTTP"
   },
   "capture":"pcap",
   "src":{
      "ip":"10.1.0.1",
      "port":"58826",
      "name":""
   },
   "dst":{
      "ip":"10.1.1.25",
      "port":"8080",
      "name":"httpbin.httpbin"
   },
   "namespace":"httpbin",
   "outgoing":false,
   "timestamp":1673981969360,
   "startTime":"2023-01-17T18:59:29.360797553Z",
   "request":{
      "bodySize":0,
      "cookies":{
         "token":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
      },
      "headers":{
         "Accept":"*/*",
         "Connection":"close",
         "Host":"10.1.1.25:8080",
         "User-Agent":"kube-probe/1.25"
      },
      "headersSize":-1,
      "httpVersion":"HTTP/1.1",
      "method":"GET",
      "path":"/status/200",
      "pathSegments":[
         "status",
         "200"
      ],
      "queryString":{
         
      },
      "targetUri":"/status/200",
      "url":"/status/200"
   },
   "response":{
      "bodySize":0,
      "content":{
         "encoding":"base64",
         "mimeType":"",
         "size":0
      },
      "cookies":{
         
      },
      "headers":{
         "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
         "Access-Control-Allow-Credentials":"true",
         "Access-Control-Allow-Origin":"*",
         "Content-Length":"0",
         "Date":"Tue, 17 Jan 2023 18:59:29 GMT"
      },
      "headersSize":-1,
      "httpVersion":"HTTP/1.1",
      "redirectURL":"",
      "status":200,
      "statusText":"OK"
   },
   "requestSize":111,
   "responseSize":166,
   "elapsedTime":3
}'),
-- request with 1 JWT with invalid signature in Auth header, 1 in request body, 1 inserted into the method field
('2023-01-17 18:59:29.360797553', '{
   "protocol":{
      "name":"http",
      "version":"1.1",
      "abbr":"HTTP"
   },
   "capture":"pcap",
   "src":{
      "ip":"10.1.0.1",
      "port":"58826",
      "name":""
   },
   "dst":{
      "ip":"10.1.1.25",
      "port":"8080",
      "name":"httpbin.httpbin"
   },
   "namespace":"httpbin",
   "outgoing":false,
   "timestamp":1673981969360,
   "startTime":"2023-01-17T18:59:29.360797553Z",
   "request":{
      "bodySize":0,
      "cookies":{
         
      },
      "headers":{
         "Accept":"*/*",
         "Connection":"close",
         "Host":"10.1.1.25:8080",
         "User-Agent":"kube-probe/1.25"
      },
      "headersSize":-1,
      "httpVersion":"HTTP/1.1",
      "method":"GET eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM2Nzg5MCIsIm5hbWUiOiJKb2huIERvZSIsImlhdCI6MTUxNjIzOTAyMn0.F59k3-qDAqpuURGAT6IK0C2wezu4i63Jn9eLBCg9quA",
      "path":"/status/200",
      "pathSegments":[
         "status",
         "200"
      ],
      "queryString":{
         
      },
      "targetUri":"/status/200",
      "url":"/status/200"
   },
   "response":{
      "bodySize":0,
      "content":{
         "encoding":"base64",
         "mimeType":"",
         "size":0,
         "token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM2ODk3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.UjSiqCcqPMDRA7YTXC1pdrbwQCUE1Eqm7EtoTH5N3xQ"
      },
      "cookies":{
         
      },
      "headers":{
         "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwp36POk6yJV_adQssw5c",
         "Access-Control-Allow-Credentials":"true",
         "Access-Control-Allow-Origin":"*",
         "Content-Length":"0",
         "Date":"Tue, 17 Jan 2023 18:59:29 GMT"
      },
      "headersSize":-1,
      "httpVersion":"HTTP/1.1",
      "redirectURL":"",
      "status":200,
      "statusText":"OK"
   },
   "requestSize":111,
   "responseSize":166,
   "elapsedTime":3
}'),
-- request with Basic Authentication
('2023-01-31 13:12:00.000', '{
   "protocol":{
      "name":"http",
      "version":"1.1",
      "abbr":"HTTP"
   },
   "capture":"pcap",
   "src":{
      "ip":"10.1.0.1",
      "port":"58826",
      "name":""
   },
   "dst":{
      "ip":"10.1.1.25",
      "port":"8080",
      "name":"httpbin.httpbin"
   },
   "namespace":"httpbin",
   "outgoing":false,
   "timestamp":1673981969360,
   "startTime":"2023-01-17T18:59:29.360797553Z",
   "request":{
      "bodySize":0,
      "absoluteURI": "http://example.com/url-5",
      "cookies":{},
      "headers":{
         "Accept":"*/*",
         "Authorization":"Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==",
         "Connection":"close",
         "Host":"10.1.1.25:8080",
         "User-Agent":"kube-probe/1.25"
      },
      "headersSize":-1,
      "httpVersion":"HTTP/1.1",
      "method":"GET",
      "path":"/status/200",
      "pathSegments":[
         "status",
         "200"
      ],
      "queryString":{
         
      },
      "targetUri":"/status/200",
      "url":"/status/200"
   },
   "response":{
      "bodySize":0,
      "content":{
         "encoding":"base64",
         "mimeType":"",
         "size":0
      },
      "cookies":{
         
      },
      "headers":{
         "Access-Control-Allow-Credentials":"true",
         "Access-Control-Allow-Origin":"*",
         "Content-Length":"0",
         "Date":"Tue, 17 Jan 2023 18:59:29 GMT"
      },
      "headersSize":-1,
      "httpVersion":"HTTP/1.1",
      "redirectURL":"",
      "status":200,
      "statusText":"OK"
   },
   "requestSize":111,
   "responseSize":166,
   "elapsedTime":3
}')
;

INSERT INTO traffic (id, occurred_at, data)
VALUES
('f11b745f-e0ef-41ac-af95-1f69e5a17c76',
'2023-01-01 13:12:01.000',
'{
   "request": {
     "absoluteURI": "http://example.com/url-1"
   },
  "dst": {
    "ip": "10.1.0.96",
    "name": "",
    "port": "8181"
  },
  "src": {
    "ip": "192.2.0.1",
    "name": "",
    "port": "57944"
  },
   "timestamp": 1672578721000
}'),
('32df382a-cce8-4816-b057-25e4b145e6eb',
'2023-01-01 13:12:03.000',
'{
   "request": {
     "absoluteURI": "http://example.com/url-2"
   },
  "dst": {
    "ip": "10.1.0.96",
    "name": "",
    "port": "8181"
  },
  "src": {
    "ip": "192.2.0.2",
    "name": "",
    "port": "57944"
  },
   "timestamp": 1672578723000
}');

INSERT INTO pass_in_url (traffic_id, field)
VALUES
('f11b745f-e0ef-41ac-af95-1f69e5a17c76', 'password'),
('f11b745f-e0ef-41ac-af95-1f69e5a17c76', 'pass'),
('32df382a-cce8-4816-b057-25e4b145e6eb', 'passwd');
