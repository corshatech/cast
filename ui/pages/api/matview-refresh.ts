import type { NextApiRequest } from 'next';

import { conn } from '@/lib/db';
import { GeneralOperationResponse, logger, TypedAPIResponse } from '@/lib/internal';

const MATVIEW_REFRESH_QUERY = 'REFRESH MATERIALIZED VIEW matview_traffic_ips';

/** Dev-only testing HTML page */
async function testGet(
  req: NextApiRequest,
  res: any,
) {
  res.status(200).send(`
<!DOCTYPE html>
<html>
<head>
  <title>TEST: Upload GeoIP data</title>
  <style>
    #out {
      width: 85vw;
      height: 85vh;
    }
  </style>
</head>
<body>
  <button onclick="refreshHandler()">Refresh Materialized View</button>
  <br/>
  <input type="textarea" id="out" disabled value="output..."/>
  <script>
    function done(text) {
      document.getElementById('out').value = text;
      document.getElementById('submit').disabled = false;
    }
    function refreshHandler() {
      fetch('/api/matview-refresh?refresh=true', { method: 'POST' }).then((x) => x.text().then(done), alert);
    }
  </script>
</body>
`);
}

async function refreshMatview() {
  await conn.query(MATVIEW_REFRESH_QUERY)
}

async function handlePost(
  req: NextApiRequest,
  res: TypedAPIResponse<GeneralOperationResponse>,
) {
  
  // A browser may be able to send multiple POST requests if a query parameter is not set.
  const { refresh } = req.query;
  if (refresh !== 'true') {
    const error = 'A value of true is required for the "refresh" query parameter.';
    logger.error(error);
    res.status(500).send({error});
    return;
  }

  try {
    await refreshMatview()
  } catch (e) {
    const error = 'An SQL error occurred while refreshing the matview.';
    logger.error({ error: e }, error);
    res.status(500).send({error});
    return;
  }

  res.status(200).send({ success: true });
  return;
}

export default async function handler(
  req: NextApiRequest,
  res: TypedAPIResponse<GeneralOperationResponse>,
) {
  if (req.method === 'POST') {
    await handlePost(req, res);
    return;
  } else if (process.env.NODE_ENV === 'development') {
    await testGet(req, res);
    return;
  }
  res.status(405).send({
    error: 'Method Not Allowed',
  });
}
