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

import React from 'react';
import {
  Card,
  CardContent,
  useTheme,
  Collapse,
  styled,
  IconButton,
  IconButtonProps,
} from '@mui/material';
import Link from 'next/link';
import { GridExpandMoreIcon } from '@mui/x-data-grid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faChain } from '@fortawesome/free-solid-svg-icons';

import type { Analysis } from '@/lib/findings';
import { SeverityIcon, Checkmark } from '@/components/atoms/SeverityIcon';
import { Typography } from '@/components/atoms/Typography';
import { FormattedDate } from '@/components/atoms/FormattedDate';

export { CsvExportButton } from './CsvExportButton';

export type AnalysisProps = {
  children?: React.ReactNode;
  exportButton?: React.ReactNode;
  noResults?: boolean;
} & Pick<
  Analysis,
  'description'
  | 'reportedAt'
  | 'weaknessLink'
  | 'weaknessTitle'
  | 'severity'
  | 'title'
  | 'id'
>;

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

const Weakness: React.FC<{
  weaknessLink?: string;
  weaknessTitle?: string;
}> = ({ weaknessLink, weaknessTitle }) =>
    weaknessLink ? (
      <Link className="underline truncate block" href={weaknessLink} target="_blank">
        {weaknessTitle ?? weaknessLink}
      </Link>
    ) : null;

const NoResults: React.FC<AnalysisProps & { anchorId?: string}> = ({
  description,
  reportedAt,
  weaknessLink,
  weaknessTitle,
  title,
  id,
  anchorId,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = React.useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <a id={anchorId !== undefined ? anchorId : id}>
      <Card className='max-w-prose'>
        <CardContent className='flex items-center'>
          <Typography
            variant='h2'
            className='font-light grow align-text-bottom'
            style={{ color: theme.palette.success.main }}
          >
            <Checkmark />{' '}
            {title}
            {' - OK'}
          </Typography>
          <ExpandMore
            expand={expanded}
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label="show description"
          >
            <GridExpandMoreIcon />
          </ExpandMore>
        </CardContent>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent sx={{ paddingTop: 0 }}>
            <Typography className='max-w-prose mb-4 text-zinc-400' variant='body1'>{description}</Typography>
            <table className='font-light text-zinc-400 border-separate border-spacing-x-4'>
              <tbody>
                <tr>
                  <td>Updated:</td>
                  <td><FormattedDate when={reportedAt} /></td>
                </tr>
                <tr>
                  <td colSpan={2}><Weakness weaknessLink={weaknessLink} weaknessTitle={weaknessTitle} /></td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Collapse>
      </Card>
    </a>
  )
}

export const AnalysisCard: React.FC<AnalysisProps & { anchorId?: string}> = ({
  description,
  reportedAt,
  weaknessLink,
  weaknessTitle,
  severity,
  title,
  noResults,
  children,
  exportButton,
  id,
  anchorId,
}) =>
  noResults ? (
    <NoResults
      {...{
        description,
        reportedAt,
        weaknessLink,
        weaknessTitle,
        severity,
        title,
        noResults,
        id,
      }}
    />
  ) : (
    <a id={anchorId !== undefined ? anchorId : id}>
      <Card
        aria-labelledby="title"
        sx={{
          /* TODO: Use of `!important` in CSS override.
           *
           * These are written as overrides against the MUITable component's
           * theme using `!important` which is bad form. Some of the color
           * issues might be fixable with better use of the Material Theme
           * component, but it wasn't immediately clear how to do so, especially
           * for the BorderColor even after stepping through the source code
           * for the MuiTable.
           *
           * These overrides should be removed in the future. Currently on the
           * roadmap we're expecting to transition away from Material UI
           * components anyway. It is expected that this hack for the
           * border and header colors will get removed by the removal of
           * Material UI during that work.
           */
          '& .MuiDataGrid-root, & .MuiTableContainer-root': {
            borderRadius: '0',
            border: 'none',
            borderTop: '1px solid !important',
            borderColor: 'rgba(255,255,255,.26) !important',
          },
          '& .MuiDataGrid-root *': {
            borderColor: 'inherit !important',
          },
          '& .MuiDataGrid-columnSeparator': {
            color: 'rgba(255,255,255,.26) !important',
          },
          '& .MuiTableCell-head': {
            background: 'hsl(196 71% 12%)',
          },
        }}
        className='shadow-md'
        elevation={2}
      >
        <CardContent className="p-0 last:pb-0">
          <div className="flex flex-wrap items-start px-2 py-4 md:py-6 md:px-8 justify-between">
            <div className="items-center flex w-full md:mb-0">
              <Typography className="grow mr-2" variant="h2" aria-label="title">
                <SeverityIcon className="mb-[3px] pb-[1px]" severity={severity} />{' '}
                {title}
              </Typography>
              <div className='shrink-0'>
                {exportButton}
              </div>
            </div>

            <div className="pl-1 mt-2 flex flex-col md:mt-0 md:flex-row md:flex-wrap md:space-x-6">
              <div className="flex items-center text-sm text-gray-300">
                <FontAwesomeIcon
                  icon={faCalendar}
                  className="mr-1.5 h-3 w-3 flex-shrink-0 text-gray-200"
                  aria-hidden="true"
                />
                <FormattedDate when={reportedAt} />
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <SeverityIcon
                  className="mr-1 h-3 w-3 flex-shrink-0 text-gray-200"
                  severity={severity}
                />
                {severity}
              </div>
              {weaknessLink && (
                <div className="flex items-center text-sm text-gray-300">
                  <FontAwesomeIcon
                    icon={faChain}
                    className="mr-1.5 h-3 w-3 flex-shrink-0 text-gray-300"
                    aria-hidden="true"
                  />
                  <div className="w-[320px] lg:w-auto inline-block">
                    <Weakness
                      weaknessLink={weaknessLink}
                      weaknessTitle={weaknessTitle}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <Typography
            className="max-w-prose pl-2.5 pr-6 md:pl-9 pb-6"
            variant="body1"
          >
            {description}
          </Typography>
          {children}
        </CardContent>
      </Card>

    </a>
  );

export const AnalysisCardLoading = () => {
  return (
    <Card className="animate-pulse">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex space-x-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full dark:bg-gray-500 " />
            <div className="h-8 bg-gray-200 rounded-full dark:bg-gray-500 w-64" />
          </div>
        </div>

        <span className="sr-only">Loading...</span>
        <div className="max-w-prose my-2 h-2.5 bg-gray-200 rounded-full dark:bg-gray-500 w-40 mb-2" />
        <div className="space-y-2.5 max-w-prose">
          <div className="flex items-center w-full space-x-2">
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-32" />
            <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24" />
            <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full" />
          </div>
          <div className="flex items-center w-full space-x-2 max-w-[480px]">
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-full" />
            <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full" />
            <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24" />
          </div>
          <div className="flex items-center w-full space-x-2 max-w-[400px]">
            <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full" />
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-80" />
            <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full" />
          </div>
          <div className="flex items-center w-full space-x-2 max-w-[480px]">
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-full" />
            <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full" />
            <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24" />
          </div>
          <div className="flex items-center w-full space-x-2 max-w-[440px]">
            <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-32" />
            <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24" />
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-full" />
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-[400px] rounded-lg"></div>
      </CardContent>
    </Card>
  );
};
