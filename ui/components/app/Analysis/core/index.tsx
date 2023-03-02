import React from 'react';
import {
  Card,
  CardContent,
  useTheme,
  Collapse,
  CardActions,
  styled,
  IconButton,
} from '@mui/material';
import Link from 'next/link';

import type { Analysis as AnalysisType } from '@/lib/findings';
import { SeverityIcon, Checkmark, Typography } from '@/components/atoms';
import { FormattedDate } from '@/components/atoms/FormattedDate';
import { GridExpandMoreIcon } from '@mui/x-data-grid';
import { IconButtonProps } from '@mui/material/IconButton';

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
  weaknessLink?: string
  weaknessTitle?: string
}> = ({ weaknessLink, weaknessTitle }) => (
  weaknessLink
  ? (
    <tr>
      <td>Learn&nbsp;more:</td>
      <td>
        <Link className='underline' href={weaknessLink}>{weaknessTitle ?? weaknessLink}</Link>
      </td>
    </tr>
  )
  : null
);

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
        <div className="flex flex-nowrap items-center px-2 py-4">
          <Typography variant="h2" className="grow" aria-label="title">
            <SeverityIcon className="mb-[3px] pb-[1px]" severity={severity} />{' '}
            {title}
          </Typography>
          {exportButton}
        </div>
        <Typography className="max-w-prose pl-2.5 pr-6" variant="body1">
          {description}
        </Typography>
        <table className="font-light my-2 text-zinc-400 border-separate border-spacing-x-4">
          <tbody>
            <tr>
              <td>Updated:</td>
              <td>
                <FormattedDate when={reportedAt} />
              </td>
            </tr>
            <tr>
              <td>Issue Severity:</td>
              <td>{severity}</td>
            </tr>
            <Weakness
              weaknessLink={weaknessLink}
              weaknessTitle={weaknessTitle}
            />
          </tbody>
        </table>
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
