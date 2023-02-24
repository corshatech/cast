import React from 'react';
import {
  Card,
  CardContent,
} from '@mui/material';

import type { Analysis as AnalysisType } from '@/lib/findings';
import { SeverityIcon, Typography } from '@/components/atoms';
import { FormattedDate } from '@/components/atoms/FormattedDate';
import Link from 'next/link';

export type AnalysisProps = {
  children?: React.ReactNode;
  exportButton?: React.ReactNode;
} & Pick<
  AnalysisType,
  'description'
  | 'reportedAt'
  | 'weaknessLink'
  | 'weaknessTitle'
  | 'severity'
  | 'title'
>;

export const AnalysisCard: React.FC<AnalysisProps> = ({
  description,
  reportedAt,
  weaknessLink,
  weaknessTitle,
  severity,
  title,
  children,
  exportButton,
}) => {
  let weaknessFragment = null;
  if (weaknessLink !== undefined) {
    weaknessFragment = <Link className='underline' href={weaknessLink}>{weaknessTitle ?? weaknessLink}</Link>;
  }

  return <Card>
    <CardContent>
      <div className='flex flex-nowrap'>
        <Typography variant='h2' className='grow'><SeverityIcon severity={severity} /> {title}</Typography>
        {exportButton}
      </div>
      <Typography className='max-w-prose my-2' variant='body1'>{description}</Typography>
      <table className='font-light my-2 text-zinc-400 border-separate border-spacing-x-4'>
        <tbody>
          <tr>
            <td>Updated:</td><td><FormattedDate when={reportedAt} /></td>
          </tr>
          <tr>
            <td>Issue Severity:</td><td>{severity}</td>
          </tr>
          {weaknessFragment && <tr>
            <td>Learn more:</td><td>{weaknessFragment}</td>
          </tr>}
        </tbody>
      </table>
      {children}
    </CardContent>
  </Card>
}

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
