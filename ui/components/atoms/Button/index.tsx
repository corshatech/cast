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

import clsx from 'clsx';

const classes = {
  size: (val: ButtonProps['size']) =>
    val === 'sm'
      ? 'px-10 py-2'
      : val === 'md'
      ? 'px-[70px] py-3'
      : 'px-[75px] py-3.5',
  variant: (val: ButtonProps['variant']) =>
    val === 'primary'
      ? 'bg-corsha-brand-blue text-white border-2 border-corsha-brand-blue hover:bg-corsha-brand-mid-blue hover:border-[#104457] focus:bg-corsha-brand-blue focus:border-2 focus:border-corsha-brand-green disabled:bg-[#A1A9B4] disabled:border-[#A1A9B4] disabled:cursor-not-allowed'
      : val === 'secondary'
      ? 'bg-white text-primary border-2 border-corsha-brand-blue hover:bg-highlight-blue focus:border-2 focus:border-corsha-brand-green disabled:border-[#A1A9B4] disabled:text-[#A1A9B4] disabled:hover:bg-white disabled:cursor-not-allowed'
      : 'bg-transparent',
};

export type ButtonProps = JSX.IntrinsicElements['button'] & {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
};

export const Button = ({ children, variant, size, ...props }: ButtonProps) => {
  return (
    <button
      className={clsx(
        'rounded-md space-x-3 leading-none inline-block',
        classes.variant(variant),
        classes.size(size),
      )}
      {...props}
    >
      {children}
    </button>
  );
};
