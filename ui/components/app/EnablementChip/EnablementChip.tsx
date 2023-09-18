import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type Props = {
  label: string;
  tooltipEnabled: string;
  tooltipDisabled: string;
  enabled?: boolean;
}
export const EnablementChip: React.FC<Props> = ({
  label,
  tooltipEnabled,
  tooltipDisabled,
  enabled,
}) => <Tooltip delayDuration={200}>
  <TooltipTrigger className="unbutton">
    <Badge variant={enabled ? 'outline' : 'secondary'}>
      <span className={cn(
        'before:inline-block before:rounded-full before:w-2 before:h-2 before:mr-1 before:bg-slate-500',
        enabled && 'before:bg-corsha-dark-green',
      )}>
        {label} - {enabled ? 'Enabled' : 'Disabled'}
      </span>
    </Badge>
  </TooltipTrigger>
  <TooltipContent>{enabled ? tooltipEnabled : tooltipDisabled}</TooltipContent>
</Tooltip>
