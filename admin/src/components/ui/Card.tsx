import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`rounded-2xl border border-gray-800/80 bg-gray-900/40 p-6 shadow-xl backdrop-blur-md transition-all duration-300 ${
        hoverEffect ? 'hover:border-violet-500/30 hover:bg-gray-900/60 hover:shadow-violet-600/5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
