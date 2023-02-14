import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { AnalysesSummary } from 'lib/findings';
import { SeverityIcon } from '@/components/atoms';

type SummaryProps = AnalysesSummary;

export const Summary = ({ faults, findings, scansPassed, severityCounts }: SummaryProps) => {
  const summaryTitle = faults
    ? `${faults} Faults (${findings} Findings)`
    : `No problems detected`;

  return (<Card>
    <CardContent>
      <Typography variant="h5" component="h3">Ongoing Results</Typography>
      <Typography>{summaryTitle}</Typography>
      <Typography color="text.secondary">{scansPassed} passed</Typography>
      <ul>
        {(severityCounts.critical > 0) && <li key="critical"><SeverityIcon severity='critical'/> {severityCounts.critical} Critical</li>}
        {(severityCounts.high > 0) && <li key="high"><SeverityIcon severity='high'/> {severityCounts.high} High</li>}
        {(severityCounts.medium > 0) && <li key="medium"><SeverityIcon severity='medium'/> {severityCounts.medium} Medium</li>}
        {(severityCounts.low > 0) && <li key="low"><SeverityIcon severity='low'/> {severityCounts.low} Low</li>}
        {(severityCounts.none > 0) && <li key="none"><SeverityIcon severity='none'/> {severityCounts.none} None</li>}
      </ul>
    </CardContent>
  </Card>);
}
