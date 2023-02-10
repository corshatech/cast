import React from 'react';

import { DateTime } from 'luxon';
import { DateString } from '@/lib/findings';

export const FormattedDate: React.FC<{when: DateString}> = ({when}) => {
  // TODO: change formats when clicked or by user preference
  return <>{DateTime.fromISO(when).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}</>;
}
