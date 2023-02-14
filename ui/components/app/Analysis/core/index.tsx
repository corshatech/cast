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
