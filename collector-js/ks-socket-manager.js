import WebSocket from 'ws';

const defaultKsQuery = 'timestamp >= now()';

/**
 * Wraps a promise in a timeout.
 * If the timeout is exceeded before the first
 * promise resolves, then the whole chain is immediately
 * rejected.
 *
 * @param {number} delay delay time in ms, default one minute
 * @param {any} message the message (or error) to reject with
 */
async function timeout(
  /** @type {Promise<any>} */ f,
  delay = 60 * 1000,
  message = undefined,
) {
  return Promise.race([
    f,
    new Promise((resolve, reject) => setTimeout(() => reject(message), delay)),
  ]);
}

/**
 * Tries promise-returning function `f`
 * up to `tries` times.
 *
 * If the operation fails `tries` times in a row,
 * an error is returned instead.
 */
export async function retry(
  /** @type {() => Promise<any>} */ f,
  {
    delay = 3000,
    tries = 3,
    message = 'Error occurred',
  } = {},
) {
  for (let retryNo = 0; retryNo < tries; retryNo++) {
    try {
      return await f();
    } catch (e) {
      console.error(e);
      console.error(`${message}. Retrying in ${delay/1000}s`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error('Retries on operation exceeded');
}

export async function setupConnection(/** @type {string} */ hubURL) {
  const socketURL = (() => {
    let l = new URL(hubURL);
    l.protocol = 'ws';
    l.pathname = 'ws';
    return l.toString();
  })();

  // use retry() widget to try to create the websocket
  // up to n-many times before giving up.
  const ws = await retry(async () => {
    const _ws = new WebSocket(socketURL);
    try {
      await timeout(
        new Promise((res, rej) => {
          _ws.once('open', () => {
            // clean up error listeners
            _ws.removeAllListeners('error');
            _ws.removeAllListeners('close');
            // report OK
            res();
          });

          // on error, reject this promise, indicating failure
          _ws.once('close', rej);
          _ws.once('error', rej);
        },
        60 * 1000, /* one minute */
        new Error('WebSocket connection did not become ready within a minute'),
      ));
    } catch (e) {
      // catch to close the socket "properly",
      // but then also rethrow to indicate failure:
      _ws.close();
      throw e;
    }

    // ok, return socket, which is now in ready state:
    return _ws;
  });

  // Connection is ready.
  return ws;
}

/**
 * Fetches the /pcaps/total-tcp-streams api call from the Kubeshark Hub
 */
export async function totalStreams(ksHubURL) {
  const response = await fetch(`${ksHubURL}/pcaps/total-tcp-streams`);
  if (!response.ok) {
    throw new Error('Unable to fetch /pcaps/total-tcp-streams from hub');
  }
  return await response.json();
}

/**
 * Writes the default query to the WebSocket on an interval.
 * If the write fails for any reason, reports a fatal error
 * that halts the entire program.
 */
export async function doKeepaliveQuery(/** @type {WebSocket} */ ws) {
  const keepalive = async () => {
    try {
      await timeout(
        new Promise((resolve, reject) => {
          ws.send(defaultKsQuery, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        }),
        45 * 1000 /* 45 seconds */,
        new Error('Exceeded write deadline, assuming connection is broken.'),
      );
    } catch (e) {
      ws.close();
      console.error(e);
      process.exit(1);
    }
  }
  // do keepalive once:
  await keepalive();
  // keep doing keepalive on an interval:
  setInterval(keepalive, 3 * 60 * 1000 /* three minutes */);
}
