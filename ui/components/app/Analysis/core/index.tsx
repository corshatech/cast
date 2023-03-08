import React from 'react';
import {
  Card,
  CardContent,
  useTheme,
  Collapse,
  styled,
  IconButton,
} from '@mui/material';
import Link from 'next/link';

import type { Analysis as AnalysisType } from '@/lib/findings';
import { SeverityIcon, Checkmark, Typography } from '@/components/atoms';
import { FormattedDate } from '@/components/atoms/FormattedDate';
import { GridExpandMoreIcon } from '@mui/x-data-grid';
import { IconButtonProps } from '@mui/material/IconButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faChain } from '@fortawesome/free-solid-svg-icons';

export type AnalysisProps = {
  children?: React.ReactNode;
  exportButton?: React.ReactNode;
  noResults?: boolean;
} & Pick<
  AnalysisType,
  'description'
  | 'reportedAt'
  | 'weaknessLink'
  | 'weaknessTitle'
  | 'severity'
  | 'title'
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

const NoResults: React.FC<AnalysisProps> = ({
  description,
  reportedAt,
  weaknessLink,
  weaknessTitle,
  title,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = React.useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return <Card className='max-w-prose -my-3'>
    <CardContent className='flex items-center'>
      <Typography
        variant='h2'
        className='font-light grow align-text-bottom'
        style={{color: theme.palette.success.main}}
      >
        <Checkmark/>{' '}
        {title}
        {' - OK'}
      </Typography>
      <ExpandMore
        expand={expanded}
        onClick={handleExpandClick}
        aria-expanded={expanded}
        aria-label="show description"
      >
        <GridExpandMoreIcon/>
      </ExpandMore>
    </CardContent>
    <Collapse in={expanded} timeout="auto" unmountOnExit>
      <CardContent sx={{paddingTop: 0}}>
        <Typography className='max-w-prose mb-4 text-zinc-400' variant='body1'>{description}</Typography>
        <table className='font-light text-zinc-400 border-separate border-spacing-x-4'>
          <tbody>
            <tr>
              <td>Updated:</td>
              <td><FormattedDate when={reportedAt}/></td>
            </tr>
            <Weakness weaknessLink={weaknessLink} weaknessTitle={weaknessTitle}/>
          </tbody>
        </table>
      </CardContent>
    </Collapse>
  </Card>
}

export const AnalysisCard: React.FC<AnalysisProps> = ({
  description,
  reportedAt,
  weaknessLink,
  weaknessTitle,
  severity,
  title,
  noResults,
  children,
  exportButton,
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
      }}
    />
  ) : (
    <Card aria-labelledby="title" className="shadow-md" elevation={2}>
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
              <div className="flex items-center text-sm text-gray-500">
                <FontAwesomeIcon
                  icon={faCalendar}
                  className="mr-1.5 h-3 w-3 flex-shrink-0 text-gray-400"
                  aria-hidden="true"
                />
                <FormattedDate when={reportedAt} />
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <SeverityIcon
                  className="mr-1 h-3 w-3 flex-shrink-0 text-gray-400"
                  severity={severity}
                />
                {severity}
              </div>
              {weaknessLink && (
                <div className="flex items-center text-sm text-gray-500">
                  <FontAwesomeIcon
                    icon={faChain}
                    className="mr-1.5 h-3 w-3 flex-shrink-0 text-gray-400"
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
