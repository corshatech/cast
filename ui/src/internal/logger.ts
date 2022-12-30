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

import {
  Roarr as Logger,
  MessageContext,
  Message,
  TransformMessageFunction,
} from "roarr";
import { createLogWriter as createBrowserLogWriter } from "@roarr/browser-log-writer";
import { serializeError } from "serialize-error";
import { ulid } from "ulid";

/**
 * Currenty, there are two environment variables that control logging:
 *
 * (1) NEXT_PUBLIC_ROARR_BROWSER_LOG
 *     Controls whether or not logs are emitted to the browser console.
 *
 * (2) ROARR_LOG
 *     Controls whether or not logs are emitted on the server.
 */

type AdditionalLoggerContext = Readonly<{
  [key: string]: Error;
}>;

/**
 * A roarr middleware function that serializes any Error instances embedded in
 * the log message context.
 *
 * This functionality is nearly the same thing as the functionality that is
 * provided via gajus/roarr-middleware-serialize-error, but works with TS.
 *
 * See https://github.com/gajus/roarr-middleware-serialize-error
 *
 * The functionality implemented via gajus/roarr-middleware-serialize-error
 * relies on the `serialize-error` package - so we can avoid installing
 * @roarr/roarr-middleware-serialize-error and instead install the
 * `serialize-error` package and use it directly.
 *
 * @param {Message<MessageContext<AdditionalLoggerContext>>} message:
 *   The log message with any potential Error instances embedded in the context
 *   in their original, unserialized form.
 *
 * @returns {Message<MessageContext>}:
 *   The log message with any potential Error instances embedded in the context
 *   in a serialized form.
 */
const serializedErrorMiddleware: TransformMessageFunction<
  MessageContext<AdditionalLoggerContext>
> = (
  message: Message<MessageContext<AdditionalLoggerContext>>,
): Message<MessageContext> => {
  const entries = Object.entries(message.context);
  return {
    ...message,
    context: entries.reduce(
      (prev: MessageContext, entry: typeof entries[number]) => {
        if (entry[1] instanceof Error) {
          return { ...prev, [entry[0]]: serializeError<Error>(entry[1]) };
        }
        return { ...prev, [entry[0]]: entry[1] };
      },
      {},
    ),
  };
};

// The `instanceId` is used to correlate logs in a high concurrency environment.
const instanceId = ulid();

/* Only log to the browser console if the ENV variable is explicitly true and
   we are not in the server environment.  NEXT_PUBLIC_ROARR_BROWSER_LOG is
	 exposed in both the server and in the browser, so if we do not ensure we
	 are on the server then we will be incidentally overwriting ROARR.write to
	 write to the browser when we are on the server.

	 To ensure we are not on the server, we can simply check if the window is
	 defined.
	 */
if (
  process.env.NEXT_PUBLIC_ROARR_BROWSER_LOG === "true" &&
  typeof window !== "undefined"
) {
  ROARR.write = createBrowserLogWriter();
  /* When using @roarr/browser-log-writer, roarr logging (which is turned off
	   by default) is controlled by the value of `ROARR_LOG` in local storage -
	   not an environment variable. */
  window.localStorage.setItem("ROARR_LOG", "true");
}

export default Logger.child<AdditionalLoggerContext>(
  serializedErrorMiddleware,
).child<AdditionalLoggerContext>((message: Message<MessageContext>) => ({
  ...message,
  context: { ...message.context, application: "console", instanceId },
}));
