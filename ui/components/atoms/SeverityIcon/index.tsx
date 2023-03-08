import React from 'react';

import {
  Lightbulb,
  Warning,
  Error,
  CrisisAlert,
  ArrowDownward,
  CheckCircleOutline,
  SvgIconComponent,
} from '@mui/icons-material';

import { Severity } from '@/lib/findings';

type SVGProps = React.ComponentProps<SvgIconComponent>;

const Icons: Record<Severity, [
  icon: SvgIconComponent,
  color: SVGProps['color'],
]> = {
  critical: [CrisisAlert, 'error'],
  high: [Error, 'error'],
  medium: [Warning, 'warning'],
  low: [ArrowDownward, 'warning'],
  none: [Lightbulb, 'info'],
};

export type Props = {
  severity: Severity
} & SVGProps;

export const SeverityIcon: React.FC<Props> = ({severity, ...otherProps}) => {
  const [Component, color] = Icons[severity] ?? Icons.none;
  return <Component color={color} {...otherProps} />
}

export const Checkmark: React.FC<SVGProps> = ({...otherProps}) => (
  <CheckCircleOutline color='success' {...otherProps}/>
);
