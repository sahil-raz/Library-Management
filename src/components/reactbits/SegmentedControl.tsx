import React from 'react';
import { motion } from 'framer-motion';

interface Option {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  className = '',
  size = 'md',
}) => {
  return (
    <div
      className={`relative flex items-center bg-slate-200/80 p-1 rounded-2xl select-none backdrop-blur-md ${className}`}
    >
      {options.map((option) => {
        const isSelected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs md:text-sm font-semibold transition-colors duration-150 z-10 ${
              size === 'sm' ? 'py-1.5 px-2 text-xs' : 'py-2 px-3 text-sm'
            } ${isSelected ? 'text-slate-900' : 'text-slate-600 hover:text-slate-800'}`}
          >
            {isSelected && (
              <motion.div
                layoutId="segmented-active"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                className="absolute inset-0 bg-white rounded-xl shadow-sm z-[-1]"
              />
            )}
            {option.icon && <span className="w-4 h-4">{option.icon}</span>}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};
