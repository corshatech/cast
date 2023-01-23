export const Button = ({
  children,
  ...args
}: JSX.IntrinsicElements["button"]) => {
  return <button {...args}>{children}</button>;
};
