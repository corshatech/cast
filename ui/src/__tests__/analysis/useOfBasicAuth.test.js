/* Copyright 2022 Corsha.
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

describe('useOfBasicAuth', () => {
  it('should detect basic auth in an Authorization Header',  async () => {
    const row = { 
      auth_header: "test",
      absolute_uri: "test",
      src_ip: "test",
      timestamp: 1674818624,
    };

    expect(await runnerPure(async () => [row])).toBe(`{"description": "HTTP Basic Auth is insecure if used over plain HTTP. Ensure that all uses of Basic Auth are configured to only occur over TLS. Consider using another, more secure kind of authentication if possible, such as tokens.", "findings": [{"data": {"inRequest": {"URI": "", "at": "1970-01-20T09:13:38.624Z", "destIp": "", "destPort": "", "proto": "unknown", "srcIp": "test", "srcPort": ""}}, "detectedAt": "2023-01-17T13:12:00.000Z", "name": "Use of HTTP Basic Authentication", "occurredAt": {"at": "1970-01-20T09:13:38.624Z"}, "severity": "low", "type": "use-of-basic-auth"}], "id": "reused-auth", "reportedAt": "2023-01-17T13:12:00.000Z", "severity": "medium", "title": "Reused Authentication"}`);
  });
})
