export type ButtonProps = JSX.IntrinsicElements["button"] & {
  variant?: string;
  size?: string;
};

export const Button = ({ children, ...args }: ButtonProps) => {
  return <button {...args}>{children}</button>;
};
