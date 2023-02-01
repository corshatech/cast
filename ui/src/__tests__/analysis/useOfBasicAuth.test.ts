/* Copyright 2023 Corsha.
   Licensed under the Apache License, Version 2.0 (the 'License');
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
        http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an 'AS IS' BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License. */
import { runnerPure } from "../../lib/analysis/useOfBasicAuth";
import { Analysis } from "../../lib/findings";

describe("useOfBasicAuth", () => {
  it("should detect basic auth in an Authorization Header", async () => {
    const row = {
      auth_header: "auth-header-1",
      absolute_uri: "/url-1",
      src_ip: "192.0.2.1",
      src_port: "5432",
      timestamp: 1672578721000,
      protocol: "tcp",
      destination_ip: "192.0.2.2",
      destination_port: "5432",
    };

    expect(await runnerPure(async () => [row])).toStrictEqual({
      "description": "HTTP Basic Auth is insecure if used over plain HTTP. Ensure that all uses of Basic Auth " + 
      "are configured to only occur over TLS. Consider using another, more secure kind of authentication if " + 
      "possible, such as tokens.",
       "findings": [
          {
           "data": {
             "inRequest": {
               "URI": "/url-1",
               "at": "2023-01-01T13:12:01.000Z",
               "destIp": "192.0.2.2",
               "destPort": "5432",
               "proto": "tcp",
               "srcIp": "192.0.2.1",
               "srcPort": "5432",
             },
           },
           "detectedAt": "2023-01-17T13:12:00.000Z",
           "name": "Use of HTTP Basic Authentication",
           "occurredAt": {
             "at": "2023-01-01T13:12:01.000Z",
           },
           "severity": "low",
           "type": "use-of-basic-auth",
         },
       ],
       "id": "use-of-basic-auth",
       "reportedAt": "2023-01-17T13:12:00.000Z",
       "severity": "medium",
       "title": "Use of HTTP Basic Authentication",
     } as Analysis
    );
  });
});