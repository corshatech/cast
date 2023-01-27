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

INSERT INTO traffic (data) VALUES
('{
	"protocol": {
		"name": "http"
	},
	"request": {
		"absoluteURI": "http://httpbin.httpbin.svc.cluster.local/headers",
		"headers": {
			"Authorization": "$argon2i$v=19$m=16,t=2,p=1$fGxJWjolVURhX2xbUGlWRVBtN3xGJldxW01URiMzNmg$oKXSg9IvLop//YzTkFL7Xw"
		}
	},
  "src":{
    "ip":"10.22.8.8"
  },
	"id": "000000000000000000000090",
	"timestamp": 1669237256611
}'),
('{
	"protocol": {
		"name": "http"
	},
	"request": {
		"absoluteURI": "http://httpbin.httpbin.svc.cluster.local/headers",
		"headers": {
			"Authorization": "$argon2i$v=19$m=16,t=2,p=1$fGxJWjolVURhX2xbUGlWRVBtN3xGJldxW01URiMzNmg$oKXSg9IvLop//YzTkFL7Xw"
		}
	},
  "src":{
    "ip":"10.22.8.8"
  },
	"id": "000000000000000000000091",
	"timestamp": 1669237256612
}'),

('{
	"protocol": {
		"name": "http"
	},
	"request": {
		"absoluteURI": "http://httpbin.httpbin.svc.cluster.local/headers",
		"headers": {
			"Authorization": "$argon2i$v=19$m=16,t=2,p=1$fGxJWjolVURhX2xbUGlWRVBtN3xGJldxW01URiMzNmg$oKXSg9IvLop//YzTkFL7Xw"
		}
	},
  "src":{
    "ip":"10.22.8.9"
  },
	"id": "000000000000000000000092",
	"timestamp": 1669237256613
}'),

('{
	"protocol": {
		"name": "http"
	},
	"request": {
		"absoluteURI": "http://httpbin.httpbin.svc.cluster.local/headers",
		"headers": {
			"Authorization": "$argon2i$v=19$m=16,t=2,p=1$fGxJWjolVURhX2xbUGlWRVBtN3xGJldxW01URiMzNmg$oKXSg9IvLop//YzTkFL7Xw"
		}
	},
  "src":{
    "ip":"10.22.8.10"
  },
	"id": "000000000000000000000093",
	"timestamp": 1669237256614
}'),

('{
	"protocol": {
		"name": "http"
	},
	"request": {
		"absoluteURI": "http://httpbin.httpbin.svc.cluster.local/headers",
		"headers": {
			"Authorization": "$argon2i$v=19$m=16,t=2,p=1$fGxJWjolVURhX2xbUGlWRVBtN3xGJldxW01URiMzNmg$oKXSg9IvLop//XyzzY"
		}
	},
  "src":{
    "ip":"10.22.8.11"
  },
	"id": "000000000000000000000090",
	"timestamp": 1669237256611
}'),
-- request with 1 JWT in Auth header
('{
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
('{
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
('{
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
('{
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
         "Authorization":"Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==",
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
;
