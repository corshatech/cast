import pg from 'pg';
import { handleTraffic } from './analysis.js';
import { doKeepaliveQuery, setupConnection, totalStreams, retry } from './ks-socket-manager.js';
// n.b. pg is a commonJS module, therefore
// Pool has to be imported like this.
const { Pool } = pg;

function envNonempty(processKey) {
  const s = process.env[processKey]
  if (typeof s === 'string' && s !== '') {
    return s;
  }

  throw new TypeError(`Failed to load required environment variable ${processKey}`);
}

const postgresHostEnv = envNonempty('PGHOST');
const postgresPortEnv = envNonempty('PGPORT');
const postgresUserEnv = envNonempty('PGUSER');
const postgresPassEnv = envNonempty('PGPASSWORD');
const postgresDbEnv = envNonempty('PGDATABASE');
const kubesharkHubURLEnv = envNonempty('KUBESHARK_HUB_URL');

const pgConnection = new Pool({
  user: postgresUserEnv,
  password: postgresPassEnv,
  host: postgresHostEnv,
  port: +(postgresPortEnv),
  database: postgresDbEnv,
  connectionTimeoutMillis: 60 * 1000, // one minute
});

/** Used as a handler for any fatal event, such as ws.on('error' ...) */
function fatalHandler(any) {
  console.error('Fatal error!');
  console.error(any);
  process.exit(1);
}

async function handleMessage(/** @type {pg.PoolClient} */ pg, data) {
  try {
    const message = JSON.parse(data);
    if (message?.proto?.name !== 'http') {
      // console.log(`Ignoring non-http traffic ${message?.proto?.name}`);
      return;
    }

    const result = await fetch(`${kubesharkHubURLEnv}/item/${message.id}?q=`);
    if (!result.ok) {
      throw new Error('Unable to fetch kubeshark item.');
    }
    const traffic = await result.json()
    await handleTraffic(pg, traffic);
  } catch (e) {
    console.error("Error processing message:");
    console.error(e);
  }
}

async function main() {
  console.log('Connecting to postgres backend...');
  const conn = await retry(
    async () => await pgConnection.connect(),
    {
      delay: 5 * 1000, // five seconds
      tries: 5,
      message: 'Error connecting to Postgres backend',
    }
  );
  console.log('Connecting to Kubeshark Hub...');

  // No idea why this is necessary, but it seems to help
  // with socket connection reliability.
  await totalStreams(kubesharkHubURLEnv);

  const ws = await setupConnection(kubesharkHubURLEnv);
  ws.on('message', handleMessage.bind(null, conn));
  ws.on('error', fatalHandler);
  ws.on('close', fatalHandler);

  // start the keepalive timer:
  // (also writes the initial query on await)
  await doKeepaliveQuery(ws);

  console.log('Starting export of records.');
}

main().catch(fatalHandler);
