import React from 'react';

import clsx from 'clsx';

export type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body1' | 'body2' | 'body3' | 'body4'

export type TypographyProps = {
  component?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | string;
  variant?: TypographyVariant;
  children?: React.ReactNode;
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

export const Typography = ({
  component = 'span',
  className,
  children,
  variant = 'body1',
}: TypographyProps): JSX.Element => {
  return React.createElement(component, { className: clsx(classes[variant] ?? classes.body1, className) }, children);
};
