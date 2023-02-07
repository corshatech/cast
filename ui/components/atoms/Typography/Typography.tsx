import clsx from 'clsx';
import React from 'react';

export type TypographyProps = {
  component?: 'h1' | 'h2' | 'h3' | 'h4' | 'p';
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body1' | 'body2' | 'body3' | 'body4';
  children: React.ReactNode[] | string;
};

const classes = {
  variant: (val: TypographyProps['variant']) => {
    switch (val) {
      case 'h1':
        return 'text-h1 font-poppins font-bold';
      case 'h2':
        return 'text-h2 font-poppins font-bold';
      case 'h3':
        return 'text-h3 font-poppins font-bold';
      case 'h4':
        return 'text-h4 font-poppins font-semibold';
      case 'body1':
        return 'text-body1 font-nunito';
      case 'body2':
        return 'text-body2 font-nunito';
      case 'body3':
        return 'text-body3 font-nunito';
      case 'body4':
        return 'text-body4 font-nunito';
      default:
        return 'text-body1 font-nunito';
    }
  },
};

const FontRender = ({
  component,
  children,
  variant,
}: TypographyProps): JSX.Element => {
  switch (component) {
    case 'h1':
      return (
        <h1 className={clsx('leading-6', classes.variant(variant))}>
          {children}
        </h1>
      );
    case 'h2':
      return (
        <h2 className={clsx('leading-6', classes.variant(variant))}>
          {children}
        </h2>
      );
    case 'h3':
      return (
        <h3 className={clsx('leading-6', classes.variant(variant))}>
          {children}
        </h3>
      );
    case 'h4':
      return (
        <h4 className={clsx('leading-6', classes.variant(variant))}>
          {children}
        </h4>
      );
    case 'p':
      return (
        <p className={clsx('leading-6', classes.variant(variant))}>
          {children}
        </p>
      );
    default:
      return (
        <span className={clsx('leading-6', classes.variant(variant))}>
          {children}
        </span>
      );
  }
};

export const Typography = ({ variant, component, children }: TypographyProps) =>
  !!component ? (
    <FontRender variant={variant} component={component}>
      {children}
    </FontRender>
  ) : (
    <span className={clsx('leading-6', classes.variant(variant))}>
      {children}
    </span>
  );
