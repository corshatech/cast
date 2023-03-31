import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';

function sha256(data) {
  return createHash('sha256').update(`${data}`).digest('hex');
}

const keys = [
  'password',
  'pass',
  'pwd',
  'auth',
  'apikey',
  'api-key',
  'session',
  'sessionkey',
  'session-key',
];

const jwtRegex = /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/]*/g;

function detectPassInURL(absoluteURI) {
  const uri = new URL(absoluteURI);
  const uriSearchParams = [...uri.searchParams.keys()].map(x => x.toLowerCase());
  const matches = keys.filter((x) => uriSearchParams.find(j => j === x));
  if (matches.length === 0) {
    return null;
  }

  // strip the search part from the URI
  uri.search = "";

  // return object containing matched
  // query params, as well as cleansed URI string
  return {
    AbsoluteUri: uri.toString(),
    QueryParams: matches,
  }
}

function detectJWTs(str) {
  const matches = [...`${str}`.matchAll(jwtRegex)].map(x => x[0]);
  if (matches.length > 0) {
    return matches;
  }
  return undefined;
}

export async function handleTraffic(/** @type {import('pg').PoolClient}*/ pg, _tr) {
  // analysis result metadata
  let metadata = {};

  assert(typeof _tr === 'object' && _tr !== null, 'traffic should be an object');
  // operate on a shallow-clone of the passed-in traffic data:
  const traffic = {..._tr};

  const proto = traffic?.data?.protocol?.name;
  assert(typeof proto === 'string' && proto !== '', 'traffic->proto should be a string');
  const headers = traffic?.data?.request?.headers;
  assert(typeof headers === 'object' && headers !== null, 'traffic->headers should be an object');
  const host = headers?.Host;
  assert(typeof host === 'string' && host !== '', 'traffic->host should be a string');
  const url = traffic?.data?.request?.url;
  assert(typeof url ==='string' && url !== '', 'traffic->url should be a string');

  const absoluteURI = `${proto}://${host}${url}`;
  traffic.data.request.absoluteURI = absoluteURI;

  const DetectedJwts = detectJWTs(JSON.stringify(traffic.data));
  if (DetectedJwts) {
    metadata.DetectedJwts = DetectedJwts
  }

  const authz = traffic?.data?.request?.headers?.Authorization;
  if (typeof authz === 'string' && authz !== '') {
    if (authz.startsWith("Basic ")) {
      metadata.UseOfBasicAuth = true;
    }
    const hashedAuth = sha256(authz);
    traffic.data.request.headers.Authorization = hashedAuth;
  }

  const PassInUrl = detectPassInURL(absoluteURI);
  if (PassInUrl) {
    metadata.PassInUrl = PassInUrl;
    traffic.data.request.absoluteURI = metadata.PassInUrl.absoluteURI;
  }

  await pg.query({
    text: 'INSERT INTO traffic (occurred_at, data, meta) VALUES ($1, $2, $3)',
    values: [new Date(), traffic.data, metadata],
  });
  console.log(`Wrote ${absoluteURI}`);
}
