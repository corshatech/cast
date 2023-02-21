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
}) => {
  let weaknessFragment = null;
  if (weaknessLink !== undefined) {
    weaknessFragment = <Link className='underline' href={weaknessLink}>{weaknessTitle ?? weaknessLink}</Link>;
  }

  return <Card>
    <CardContent>
      <Typography variant='h2'><SeverityIcon severity={severity}/> {title}</Typography>
      <Typography className='max-w-prose my-2' variant='body1'>{description}</Typography>
      <table className='font-light my-2 text-zinc-400 border-separate border-spacing-x-4'>
        <tbody>
          <tr>
            <td>Updated:</td><td><FormattedDate when={reportedAt}/></td>
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
      <CardContent>
        <Typography variant='h2' className='h-6 bg-gray-200 rounded-full dark:bg-gray-500 w-48 mb-2'></Typography>
        <Typography className='max-w-prose my-2 h-2.5 bg-gray-200 rounded-full dark:bg-gray-500 w-40 mb-2' variant='body1'></Typography>
        <table className='font-light my-2 text-zinc-400 border-separate border-spacing-x-4'>
          <tbody>
            <tr>
              <td><div className='max-w-prose my-2 h-4 bg-gray-200 rounded-full dark:bg-gray-500 w-20 mb-2'></div></td>
              <td><div className='max-w-prose my-2 h-4 bg-gray-200 rounded-full dark:bg-gray-500 w-32 mb-2'></div></td>
            </tr>
            <tr>
              <td><div className='max-w-prose my-2 h-4 bg-gray-200 rounded-full dark:bg-gray-500 w-20 mb-2'></div></td>
              <td><div className='max-w-prose my-2 h-4 bg-gray-200 rounded-full dark:bg-gray-500 w-12 mb-2'></div></td>
            </tr>
          </tbody>
        </table>
        <div className='w-full bg-gray-200 dark:bg-gray-500 h-[400px] rounded-lg'> </div>
      </CardContent>
    </Card>
  );
}
