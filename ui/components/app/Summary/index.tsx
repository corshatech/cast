import React from 'react';
import { Card, CardContent, useTheme } from '@mui/material';
import { AnalysesSummary } from 'lib/findings';
import { SeverityIcon, Typography } from '@/components/atoms';

type SummaryProps = AnalysesSummary;

export const Summary = ({
  faults,
  findings,
  scansPassed,
  severityCounts,
}: SummaryProps) => {
  const theme = useTheme();
  const summaryTitle = faults
    ? `${faults} Faults (${findings} Findings)`
    : `No problems detected yet. Live scanning will continue in the background.`;
    const liClassName = 'flex items-center text-lg font-semibold'

  return (
    <Card className="w-full h-full">
      <CardContent className="flex flex-col space-y-5 px-4 py-8">
        <Typography variant="h1">
          Ongoing Results
        </Typography>
        <Typography variant="h4">
          {summaryTitle}
        </Typography>
        <Typography style={{ color: theme.palette.text.secondary }}>
          {scansPassed} passed
        </Typography>
        <ul className="max-h-40 overflow-y-scroll space-y-1 flex flex-col justify-center pt-1">
          {severityCounts.critical > 0 && (
            <li
              key="critical"
              className={liClassName}
            >
              <SeverityIcon severity="critical" className="mr-2" />{' '}
              {severityCounts.critical} Critical
            </li>
          )}
          {severityCounts.high > 0 && (
            <li key="high" className={liClassName}>
              <SeverityIcon severity="high" className="mr-2" />{' '}
              {severityCounts.high} High
            </li>
          )}
          {severityCounts.medium > 0 && (
            <li
              key="medium"
              className={liClassName}
            >
              <SeverityIcon severity="medium" className="mr-2" />{' '}
              {severityCounts.medium} Medium
            </li>
          )}
          {severityCounts.low > 0 && (
            <li key="low" className={liClassName}>
              <SeverityIcon severity="low" className="mr-2" />{' '}
              {severityCounts.low} Low
            </li>
          )}
          {severityCounts.none > 0 && (
            <li key="none" className={liClassName}>
              <SeverityIcon severity="none" className="mr-2" />{' '}
              {severityCounts.none} None
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
};

export const SummaryLoading = () => {
  const theme = useTheme();
  const liClassName =
    'w-32 h-2.5 bg-gray-200 rounded-full dark:bg-gray-500 mb-2';

  return (
    <Card className="animate-pulse">
      <CardContent>
        <Typography
          variant="h4"
          component="h3"
          className="h-5 bg-gray-200 rounded-full dark:bg-gray-500 w-48 mb-2"
        ></Typography>
        <Typography className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-500 w-40 mb-2"></Typography>
        <Typography
          className="h-2 bg-gray-200 rounded-full dark:bg-gray-500 w-20 mb-2"
          style={{ color: theme.palette.text.secondary }}
        ></Typography>
        <ul>
          <li className={liClassName} key="critical"></li>
          <li className={liClassName} key="high"></li>
          <li className={liClassName} key="medium"></li>
          <li className={liClassName} key="low"></li>
          <li className={liClassName} key="none"></li>
        </ul>
      </CardContent>
    </Card>
  );
};
