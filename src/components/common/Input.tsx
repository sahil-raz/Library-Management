import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1 w-full text-left">
      {label && <label className="text-xs font-semibold text-slate-700">{label}</label>}
      <div className="relative flex items-center">
        {icon && <div className="absolute left-3.5 text-slate-400 pointer-events-none">{icon}</div>}
        <input
          className={`w-full rounded-2xl border bg-slate-50/70 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ios-blue/30 focus:border-ios-blue transition-all ${
            icon ? 'pl-10' : ''
          } ${error ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-[11px] font-medium text-rose-500 pl-1">{error}</span>}
    </div>
  );
};
