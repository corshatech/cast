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
import clsx from 'clsx';

export type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body1' | 'body2' | 'body3' | 'body4'

export type TypographyProps = {
  component?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | string;
  variant?: TypographyVariant;
  children?: React.ReactNode;
  style?: Partial<CSSStyleDeclaration>;
  className?: string;
};

const classes: Record<TypographyVariant, string> = {
  h1: 'leading-6 text-h1 font-poppins font-bold',
  h2: 'leading-6 text-h2 font-poppins font-bold',
  h3: 'leading-6 text-h3 font-poppins font-bold',
  h4: 'leading-6 text-h4 font-poppins font-semibold',
  body1: 'leading-6 text-body1 font-nunito',
  body2: 'leading-6 text-body2 font-nunito',
  body3: 'leading-6 text-body3 font-nunito',
  body4: 'leading-6 text-body4 font-nunito',
};

const defaultComponents: Record<TypographyVariant, string> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  body1: 'p',
  body2: 'p',
  body3: 'p',
  body4: 'p',
};

export const Typography = ({
  component,
  className,
  children,
  style,
  variant = 'body1',
}: TypographyProps): JSX.Element => {
  // in order, use:
  // - the provided component param;
  // - the associated default component given the variant;
  // - then if both are still null, use a span. (should never happen)
  const useComponent = component ?? defaultComponents[variant] ?? 'span';
  // in order, use:
  // - the classes for this variant;
  // - if still null, default to the body1 classes (should never happen)
  const useClasses = classes[variant] ?? classes.body1;
  return React.createElement(useComponent, {
    className: clsx(useClasses, className),
    style,
  }, children);
};
