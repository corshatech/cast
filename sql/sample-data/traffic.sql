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
		"absoluteUri": "http://httpbin.httpbin.svc.cluster.local/headers",
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
		"absoluteUri": "http://httpbin.httpbin.svc.cluster.local/headers",
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
		"absoluteUri": "http://httpbin.httpbin.svc.cluster.local/headers",
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
		"absoluteUri": "http://httpbin.httpbin.svc.cluster.local/headers",
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
		"absoluteUri": "http://httpbin.httpbin.svc.cluster.local/headers",
		"headers": {
			"Authorization": "$argon2i$v=19$m=16,t=2,p=1$fGxJWjolVURhX2xbUGlWRVBtN3xGJldxW01URiMzNmg$oKXSg9IvLop//XyzzY"
		}
	},
  "src":{
    "ip":"10.22.8.11"
  },
	"id": "000000000000000000000094",
	"timestamp": 1669237256615
}');
