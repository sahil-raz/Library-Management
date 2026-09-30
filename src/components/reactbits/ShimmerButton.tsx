import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ShimmerButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const ShimmerButton: React.FC<ShimmerButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-xl font-medium',
    md: 'px-4 py-2.5 text-sm rounded-2xl font-semibold',
    lg: 'px-5 py-3.5 text-base rounded-2xl font-bold',
  };

  const variantStyles = {
    primary: 'bg-ios-blue text-white shadow-glow hover:bg-blue-600',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200',
    danger: 'bg-ios-red text-white hover:bg-red-600 shadow-sm',
    success: 'bg-ios-green text-white hover:bg-emerald-600 shadow-sm',
  };

  return (
    <motion.button
      whileTap={{ scale: disabled || isLoading ? 1 : 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      disabled={disabled || isLoading}
      className={`relative inline-flex items-center justify-center overflow-hidden transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : null}
        {children}
      </span>
      {variant === 'primary' && !disabled && !isLoading && (
        <span className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}
    </motion.button>
  );
};
