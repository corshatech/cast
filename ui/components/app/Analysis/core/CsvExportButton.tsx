import React, { useCallback } from 'react';
import { unparse } from 'papaparse';
import FileSaver from 'file-saver';

import { IconButton, Tooltip } from '@mui/material';
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
    <IconButton
      color='primary'
      // Not sure why, but the ARIA example has the leading d lowercased in the
      // label. Maybe the distinction is unimportant?
      aria-label='download data as CSV'
      component='button'
      onClick={onClick}
    >
      <FileDownloadOutlined/>
    </IconButton>
  </Tooltip>
}
