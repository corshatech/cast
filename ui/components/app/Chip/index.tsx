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

import { cn } from '@/lib/utils';

type Props = {
  children?: React.ReactNode;
  className?: string;
};

export const Chip: React.FC<Props> = ({ className, children }) => (
  <span
    className={cn(
      'px-2 bg-corsha-brand-mid-blue text-white font-semibold rounded-full inline',
      className,
    )}
  >
    {children}
  </span>
);


