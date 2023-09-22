import type { NextApiRequest } from 'next';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises'
import busboy from 'busboy'
import { from as copyFrom } from 'pg-copy-streams'

import { conn } from '@/lib/db';
import { GeneralOperationResponse, logger, TypedAPIResponse } from '@/lib/internal';

const DELETE_GEO_IP_DATA_QUERY = 'DELETE FROM geo_ip_data *';
const INSERT_GEO_IP_DATA_QUERY = `COPY geo_ip_data FROM STDIN DELIMITER ',' CSV HEADER`;

export const config = {
  api: {
    bodyParser: false,
  },
}

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
  <form method='post' action='/api/upload/geoip-data' encType='multipart/form-data' id='form'>
    <input id="file" type="file" name="geoip_file" accept=".csv" required />
    <button id="submit" type="submit">
      Upload GeoIP CSV
    </button>
  </form>
  <button onclick="deleteHandler()">Delete All Data</button>
  <br/>
  <input type="textarea" id="out" disabled value="output..."/>
  <script>
    function done(text) {
      document.getElementById('out').value = text;
      document.getElementById('submit').disabled = false;
    }
    function deleteHandler() {
      fetch('/api/upload/geoip-data', { method: 'DELETE' }).then((x) => x.text().then(done), alert);
    }
  </script>
</body>
`);
}

async function deleteDataInGeoIPTable() {
  await conn.query(DELETE_GEO_IP_DATA_QUERY)
}

async function handlePost(
  req: NextApiRequest,
  res: TypedAPIResponse<GeneralOperationResponse>,
) {
  
  // Remove all previous data before insert
  try {
    await deleteDataInGeoIPTable()
  } catch (e) {
    const error = 'An SQL error occurred while deleting geoip data.';
    logger.error({ error: e }, error);
    res.status(500).send({error});
    return;
  }

  let geoip_file: Readable | undefined;

  // Open file stream with busboy
  try {

    geoip_file = await new Promise((resolve, reject) => {
      const bb = busboy({ 
        headers: req.headers,  
        limits: {
          fields: 2,
          fileSize: 1e9, // 1GB in bytes
          files: 1,
        },
      });
    
      bb.on('file', (name, stream) => {

        if (name === 'geoip_file'){
          resolve(stream)
        }
      })
    
      bb.on('finish', () => {
        reject()
      })
    
      bb.on('error', (e) => {
        reject(e)
      })
      req.pipe(bb)
    });
  } catch (e) {
    const error = 'An error occurred reading the file stream';
    logger.error({ error: e }, error);
    res.status(500).send({error});
    return;
  }

  let client;
  try {
    if (!geoip_file) {
      throw new Error('Could not read geoip file')
    }

    // Open file stream to pipe into STDIN for postgres copy
    client = await conn.connect()
    let postgresStream = client.query(copyFrom(INSERT_GEO_IP_DATA_QUERY));
    await pipeline(geoip_file, postgresStream)

  } catch (e) {

    const error = 'An SQL error occurred while inserting geoip data.';
    logger.error({ error: e }, error);
    res.status(500).send({error});
    
    client?.release();
    
    return;
  } 

  client?.release();
  res.status(200).send({ success: true });
  return;
}

async function handleDelete(
  req: NextApiRequest,
  res: TypedAPIResponse<GeneralOperationResponse>,
) {
  try {
    await deleteDataInGeoIPTable();
    res.status(200).send({ success: true });
    return;
  } catch (e) {
    const error = 'An SQL error occurred while deleting geoip data.';
    logger.error({ error: e }, error);
    res.status(500).send({ error });
    return;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: TypedAPIResponse<GeneralOperationResponse>,
) {
  if (req.method === 'POST') {
    await handlePost(req, res);
    return;
  } else if (req.method === 'DELETE') {
    await handleDelete(req, res);
    return;
  } else if (process.env.NODE_ENV === 'development') {
    await testGet(req, res);
    return;
  }
  res.status(405).send({
    error: 'Method Not Allowed',
  });
}
