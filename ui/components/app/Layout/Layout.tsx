import React from 'react';

export interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="m-0 flex flex-col justify-between items-start w-screen">
      {children}
    </div>
  );
};
