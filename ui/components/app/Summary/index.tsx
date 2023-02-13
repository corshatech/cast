import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CrisisAlertIcon from '@mui/icons-material/CrisisAlert';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { AnalysesSummary } from 'lib/findings';

type SummaryProps = AnalysesSummary;
const CriticalIcon = CrisisAlertIcon;
const HighIcon = ErrorIcon;
const MediumIcon = WarningIcon;
const LowIcon = DarkModeIcon;
const NoneIcon = LightbulbIcon;

export const Summary = ({ faults, findings, scansPassed, severityCounts }: SummaryProps) => {
  const summaryTitle = faults
    ? `${faults} Faults (${findings} Findings)`
    : `No problems detected`;

  return (<Card>
    <CardContent>
      <Typography variant="h3">Ongoing Results</Typography>
      <Typography>{summaryTitle}</Typography>
      <Typography color="text.secondary">{scansPassed} passed</Typography>
      <ul>
        {(severityCounts.critical > 0) && <li key="critical"><CriticalIcon color="error" /> {severityCounts.critical} Critical</li>}
        {(severityCounts.high > 0) && <li key="high"><HighIcon color="error" /> {severityCounts.high} High</li>}
        {(severityCounts.medium > 0) && <li key="medium"><MediumIcon color="warning" /> {severityCounts.medium} Medium</li>}
        {(severityCounts.low > 0) && <li key="low"><LowIcon color="warning" /> {severityCounts.low} Low</li>}
        {(severityCounts.none > 0) && <li key="none"><NoneIcon color="info" /> {severityCounts.none} None</li>}
      </ul>
    </CardContent>
  </Card>);
}
