import React from 'react';

import {
  Lightbulb,
  Warning,
  Error,
  CrisisAlert,
  DarkMode,
  CheckCircleOutline,
} from '@mui/icons-material';

import { Severity } from '@/lib/findings';

const Icons: Record<Severity, React.ReactElement> = {
  critical: <CrisisAlert color="error" />,
  high: <Error color="error" />,
  medium: <Warning color="warning" />,
  low: <DarkMode color="warning" />,
  none: <Lightbulb color="info" />,
}

export const SeverityIcon: React.FC<{severity: Severity}> = ({severity}) =>
  Icons[severity] ?? Icons.none

export const Checkmark: React.FC = () => <CheckCircleOutline color='success'/>
