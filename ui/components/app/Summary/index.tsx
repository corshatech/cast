import React from 'react';
import { Card, CardContent, useTheme } from '@mui/material';
import { AnalysesSummary } from 'lib/findings';
import { SeverityIcon, Typography } from '@/components/atoms';
import clsx from 'clsx';

type SummaryProps = AnalysesSummary;

export const Summary = ({ faults, findings, scansPassed, severityCounts }: SummaryProps) => {
  const theme = useTheme();
  const summaryTitle = faults
    ? `${faults} Faults (${findings} Findings)`
    : `No problems detected yet. Live scanning will continue in the background.`;
<<<<<<< Updated upstream

  return (<Card>
    <CardContent>
      <Typography variant="h4" component="h3">Ongoing Results</Typography>
      <Typography>{summaryTitle}</Typography>
      <Typography style={{color: theme.palette.text.secondary}}>{scansPassed} passed</Typography>
      <ul>
        {(severityCounts.critical > 0) && <li key="critical"><SeverityIcon severity='critical' /> {severityCounts.critical} Critical</li>}
        {(severityCounts.high > 0) && <li key="high"><SeverityIcon severity='high' /> {severityCounts.high} High</li>}
        {(severityCounts.medium > 0) && <li key="medium"><SeverityIcon severity='medium' /> {severityCounts.medium} Medium</li>}
        {(severityCounts.low > 0) && <li key="low"><SeverityIcon severity='low' /> {severityCounts.low} Low</li>}
        {(severityCounts.none > 0) && <li key="none"><SeverityIcon severity='none' /> {severityCounts.none} None</li>}
      </ul>
    </CardContent>
  </Card>);
}

export const SummaryLoading = () => {
  const theme = useTheme();
  const liClassName = 'w-32 h-2.5 bg-gray-200 rounded-full dark:bg-gray-500 mb-2';

  return (<Card className="animate-pulse">
    <CardContent>
      <Typography variant="h4" component="h3" className="h-5 bg-gray-200 rounded-full dark:bg-gray-500 w-48 mb-2"></Typography>
      <Typography className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-500 w-40 mb-2"></Typography>
      <Typography className="h-2 bg-gray-200 rounded-full dark:bg-gray-500 w-20 mb-2" style={{color: theme.palette.text.secondary}}></Typography>
      <ul>
        <li className={liClassName} key="critical"></li>
        <li className={liClassName} key="high"></li>
        <li className={liClassName} key="medium"></li>
        <li className={liClassName} key="low"></li>
        <li className={liClassName} key="none"></li>
      </ul>
    </CardContent>
  </Card>);
}
=======
    const liClassName = 'flex items-center text-lg md:text-2xl xl:text-4xl font-semibold'
    const severityIconClassName = 'mr-2 md:text-xl xl:text-3xl'

  return (
    <Card className="w-full h-full">
      <CardContent className="flex flex-col space-y-5 px-4 py-8 md:py-12 md:px-8">
        <Typography variant="h1" className='md:text-5xl xl:text-7xl'>
          Ongoing Results
        </Typography>
        <div className='flex flex-col md:flex-row space-y-5 md:space-y-0 md:items-center md:space-x-3 md:ml-1 md:pt-6 xl:pt-8'>
        <Typography variant="h4" className='md:text-2xl xl:text-3xl'>
          {summaryTitle}
        </Typography>
        <Typography style={{ color: theme.palette.text.secondary }} className='xl:text-xl font-semibold'>
          {scansPassed} passed
        </Typography>
        </div>

        <ul className="max-h-40 max-w-full xl:max-w-6xl overflow-y-scroll space-y-1 md:space-y-0 flex flex-col md:flex-row justify-center md:justify-between pt-1 md:py-12 xl:py-24">
          {severityCounts.critical > 0 && (
            <li
              key="critical"
              className={liClassName}
            >
              <SeverityIcon severity="critical" className="mr-2" />
              {severityCounts.critical} Critical
            </li>
          )}
          {severityCounts.high > 0 && (
            <li key="high" className={liClassName}>
              <SeverityIcon severity="high" className={severityIconClassName} />
              {severityCounts.high} High
            </li>
          )}
          {severityCounts.medium > 0 && (
            <li
              key="medium"
              className={liClassName}
            >
              <SeverityIcon severity="medium" className={severityIconClassName} />
              {severityCounts.medium} Medium
            </li>
          )}
          {severityCounts.low > 0 && (
            <li key="low" className={liClassName}>
              <SeverityIcon severity="low" className={severityIconClassName} />
              {severityCounts.low} Low
            </li>
          )}
          {severityCounts.none > 0 && (
            <li key="none" className={liClassName}>
              <SeverityIcon severity="none" className={severityIconClassName} />
              {severityCounts.none} None
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
};

export const SummaryLoading = () => {
  const bubbleClass = 'bg-gray-200 rounded-full dark:bg-gray-500';

  return (
    <Card className="animate-pulse">
      <CardContent className="flex flex-col space-y-5 px-4 py-8 md:py-12 md:px-8">
        <div className={clsx(bubbleClass, 'h-12 w-60 md:h-16 md:w-[38%] xl:h-20 xl:w-[45%] xl:mb-6')} />
        <div className="flex flex-col md:flex-row space-y-5 md:space-y-0 md:items-center md:space-x-3 md:ml-1">
        <div className={clsx(bubbleClass, 'h-6 w-48 xl:h-12 xl:w-80')} />
        <div className={clsx(bubbleClass, 'h-4 w-20 md:ml-4 xl:h-8 xl:w-28')} />
        </div>

        <div className="max-h-40 overflow-y-scroll space-y-2 md:space-y-0 flex flex-col md:flex-row justify-center md:justify-between md:py-16">
          <div className="flex items-center space-x-2">
            <div className={clsx(bubbleClass, 'h-4 xl:h-8 w-4 xl:w-8')} />
            <div className={clsx(bubbleClass, 'h-4 xl:h-8 w-24')} />
          </div>
          <div className="flex items-center space-x-2">
            <div className={clsx(bubbleClass, 'h-4 xl:h-8 w-4 xl:w-8')} />
            <div className={clsx(bubbleClass, 'h-4 xl:h-8 w-32')} />
          </div>
          <div className="flex items-center space-x-2">
            <div className={clsx(bubbleClass, 'h-4 xl:h-8 w-4 xl:w-8')} />
            <div className={clsx(bubbleClass, 'h-4 xl:h-8 w-20')} />
          </div>
          <div className="hidden md:flex items-center space-x-2">
            <div className={clsx(bubbleClass, 'h-4 xl:h-8 w-4 xl:w-8')} />
            <div className={clsx(bubbleClass, 'h-4 xl:h-8 w-24')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
>>>>>>> Stashed changes
