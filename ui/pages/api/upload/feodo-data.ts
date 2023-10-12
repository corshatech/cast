import type { NextApiRequest } from 'next';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import format from 'pg-format';

import { GeneralOperationResponse, logger, TypedAPIResponse } from '@/lib/internal';
import { conn } from '@/lib/db';
import { FEODOJsonType } from '@/lib/metadata';

const INSERT_FEODO_DATA_QUERY = `DELETE FROM feodo_banlist *;
INSERT INTO feodo_banlist (
  id,
  ip_address,
  country,
  first_seen,
  last_online,
  malware
) VALUES %L;`;

/** Dev-only testing HTML page */
async function testGet(
  req: NextApiRequest,
  res: any,
) {
  res.status(200).send(`
<!DOCTYPE html>
<html>
<head>
  <title>TEST: Upload FEODO banlist data</title>
  <style>
    #out {
      width: 85vw;
      height: 85vh;
    }
  </style>
</head>
<body>
  <form id='form'>
    <input id="file" type="file" name="file" accept=".json" required />
    <button id="submit" type="submit">
      Upload FEODO banlist JSON
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
      fetch('/api/upload/feodo-data', { method: 'DELETE' }).then((x) => x.text().then(done), alert);
    }
    document.getElementById('form').addEventListener('submit', function(event) {
      event.preventDefault();
      const file = document.getElementById('file');
      if (!file.value.length) return;
      document.getElementById('submit').disabled = true;
      const reader = new FileReader();
      reader.onload = (event) => {
        let body = event.target.result;
        fetch('/api/upload/feodo-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': body.length,
          },
          body,
        }).then((x) => x.text().then(done), alert);
      }
      reader.readAsText(file.files[0]);
    });
  </script>
</body>
`);
}

async function handlePost(
  req: NextApiRequest,
  res: TypedAPIResponse<GeneralOperationResponse>,
) {
  const data = z.array(FEODOJsonType).safeParse(req.body);
  if (!data.success) {
    const error = fromZodError(data.error);
    logger.error({ error }, error.message);
    res.status(400).send({
      error: error.message,
    });
    return;
  }
  const pgValues = data.data.map(
    ({
      ip_address,
      country,
      first_seen,
      last_online,
      malware,
    }, i) =>
    ([i, ip_address, country, first_seen, last_online, malware]),
  );
  try {
    await conn.query(format(INSERT_FEODO_DATA_QUERY, pgValues));
    res.status(200).send({ success: true });
  } catch (e) {
    const error = 'An SQL error occurred while inserting feodo_banlist data.';
    logger.error({ error: e }, error);
    res.status(500).send({error});
    return;
  }
}

async function handleDelete(
  req: NextApiRequest,
  res: TypedAPIResponse<GeneralOperationResponse>,
) {
  try {
    await conn.query('DELETE FROM feodo_banlist *;');
    res.status(200).send({ success: true });
    return;
  } catch (e) {
    const error = 'An SQL error occurred while deleting feodo_banlist data.';
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
