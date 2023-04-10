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

import React, { useCallback } from 'react';
import { unparse } from 'papaparse';
import FileSaver from 'file-saver';

import { Tooltip, Button } from '@mui/material';
import { FileDownloadOutlined } from '@mui/icons-material';

export type Props = {
  data: string[][] | Record<string, any>[];
  config?: Parameters<typeof unparse>[1];
  filename: string;

  /**
   * If `data` is a list of objects, setting stripID to true
   * will preprocess `data` _when download is initiated_ by creating a shallow
   * clone of all the data and removing any `id` fields.
   */
  stripID?: true;
}

// List of Windows-disallowed filename chars (in particular ':' might be found
// inside timestamps)
const UnsafeFilenameChars = /[\\\/\:\*\?\"\<\>\|]/g

export const CsvExportButton: React.FC<Props> = ({
  data,
  config,
  filename,
  stripID,
}) => {
  const onClick = useCallback(() => {
    let csvData = data;
    const sanitizedFilename = filename.replace(UnsafeFilenameChars, '_');
    if (stripID && !Array.isArray(csvData[0])) {
      csvData = csvData.map((datum) => {
        const shallowClone = {...datum};
        // there is likely a better way of doing this,
        // but this is the way I know how to do it while
        // satisfying TypeScript types.
        if ('id' in shallowClone) {
          delete shallowClone.id;
        }
        return shallowClone;
      });
    }
    const blob = new Blob([unparse(csvData, config)], {type: 'text/plain;charset=utf-8'});
    FileSaver.saveAs(blob, sanitizedFilename);
  }, [data, config, filename, stripID]);

  return <Tooltip title='Download data as CSV'>
    <Button
      disableRipple
      startIcon={<FileDownloadOutlined />}
      color="primary"
      // Not sure why, but the ARIA example has the leading d lowercased in the
      // label. Maybe the distinction is unimportant?
      aria-label='download data as CSV'
      component='button'
      onClick={onClick}
    >
      Download
    </Button>
  </Tooltip>
}
