import React from 'react';

interface ShinyTextProps {
  text: string;
  className?: string;
  speed?: number;
}

export const ShinyText: React.FC<ShinyTextProps> = ({ text, className = '', speed = 3 }) => {
  return (
    <span
      className={`inline-block bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-sky-500 to-slate-900 bg-[length:200%_auto] animate-shimmer font-semibold ${className}`}
      style={{
        animationDuration: `${speed}s`,
      }}
    >
      {text}
    </span>
  );
};
