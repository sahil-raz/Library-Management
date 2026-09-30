import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'circle' | 'rect';
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({ className = '', variant = 'text' }) => {
  const base = 'animate-pulse bg-slate-200/90';

  if (variant === 'circle') {
    return <div className={`${base} rounded-full ${className}`} />;
  }

  if (variant === 'card') {
    return (
      <div className={`p-5 rounded-2xl border border-slate-200 bg-white shadow-ios ${className}`}>
        <div className="h-4 w-1/3 bg-slate-200 rounded-md animate-pulse mb-3" />
        <div className="h-8 w-1/2 bg-slate-200 rounded-lg animate-pulse mb-4" />
        <div className="h-3 w-3/4 bg-slate-200 rounded-md animate-pulse" />
      </div>
    );
  }

  return <div className={`${base} rounded-lg ${className}`} />;
};
