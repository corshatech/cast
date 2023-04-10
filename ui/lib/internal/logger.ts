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

import { Roarr as Logger } from 'roarr';
import { createLogWriter as createBrowserLogWriter } from '@roarr/browser-log-writer';
import createSerializeErrorMiddleware from '@roarr/middleware-serialize-error';
import { ulid } from 'ulid';

let errorSplat = (arg: any) => arg;

/**
 * Currenty, there are two environment variables that control logging:
 *
 * (1) NEXT_PUBLIC_ROARR_BROWSER_LOG
 *     Controls whether or not logs are emitted to the browser console.
 *
 * (2) ROARR_LOG
 *     Controls whether or not logs are emitted on the server.
 */

// The `instanceId` is used to correlate logs in a high concurrency environment.
const instanceId = ulid();

/* Only log to the browser console if the ENV variable is explicitly true and
 * we are not in the server environment.  NEXT_PUBLIC_ROARR_BROWSER_LOG is
 * exposed in both the server and in the browser, so if we do not ensure we
 * are on the server then we will be incidentally overwriting ROARR.write to
 * write to the browser when we are on the server.
 * To ensure we are not on the server, we can simply check if the window is
 * defined.
 */
if (
  process.env.NEXT_PUBLIC_ROARR_BROWSER_LOG === 'true' &&
  typeof window !== 'undefined'
) {
  ROARR.write = createBrowserLogWriter();
  /* When using @roarr/browser-log-writer, roarr logging (which is turned off
         by default) is controlled by the value of `ROARR_LOG` in local storage -
         not an environment variable. */
  window.localStorage.setItem('ROARR_LOG', 'true');
  errorSplat = (message) => {
    if (message?.context?.error) {
      console.error(message?.context?.error);
    }
    return message;
  }
}

export default Logger
  .child({
    application: 'console',
    instanceId,
  })
  .child<{[k: string]: unknown | Error}>(createSerializeErrorMiddleware())
  .child(errorSplat);
