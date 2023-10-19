/* Copyright 2023 Corsha.
   Licensed under the Apache License, Version 2.0 (the 'License');
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
   http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an 'AS IS' BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License. */

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
