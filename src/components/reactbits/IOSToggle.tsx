import React from 'react';
import { motion } from 'framer-motion';

interface IOSToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export const IOSToggle: React.FC<IOSToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  description,
}) => {
  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      className={`flex items-center justify-between py-2 cursor-pointer select-none ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {(label || description) && (
        <div className="flex flex-col mr-4">
          {label && <span className="text-sm font-semibold text-slate-800">{label}</span>}
          {description && <span className="text-xs text-slate-500 mt-0.5">{description}</span>}
        </div>
      )}
      <div
        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-ios-green' : 'bg-slate-300'
        }`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          animate={{ x: checked ? 20 : 2 }}
          className="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0"
        />
      </div>
    </div>
  );
};
