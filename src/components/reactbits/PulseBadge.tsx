import React from 'react';

export interface PulseBadgeProps {
  status?: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'SUSPENDED' | 'AVAILABLE' | 'ASSIGNED' | 'BLOCKED' | string;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'active' | 'pending' | 'expired' | 'suspended' | string;
  label?: string;
  size?: 'sm' | 'md';
  children?: React.ReactNode;
}

export const PulseBadge: React.FC<PulseBadgeProps> = ({
  status = 'ACTIVE',
  variant,
  label,
  size = 'sm',
  children,
}) => {
  // Normalize key from variant or status
  let resolvedKey = (status || 'ACTIVE').toUpperCase();
  if (variant) {
    const v = variant.toLowerCase();
    if (v === 'success' || v === 'active') resolvedKey = 'ACTIVE';
    else if (v === 'danger' || v === 'expired' || v === 'suspended') resolvedKey = 'SUSPENDED';
    else if (v === 'warning' || v === 'pending') resolvedKey = 'PENDING';
    else if (v === 'info' || v === 'assigned') resolvedKey = 'ASSIGNED';
  }

  const config = {
    ACTIVE: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', ping: true },
    AVAILABLE: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', ping: true },
    PENDING: { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', ping: true },
    ASSIGNED: { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', ping: false },
    EXPIRED: { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', ping: false },
    SUSPENDED: { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', ping: false },
    BLOCKED: { bg: 'bg-slate-100 text-slate-700 border-slate-300', dot: 'bg-slate-500', ping: false },
  }[resolvedKey] || { bg: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-400', ping: false };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      } ${config.bg}`}
    >
      <span className="relative flex h-2 w-2">
        {config.ping && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${config.dot}`}
          />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${config.dot}`} />
      </span>
      {children || label || status}
    </span>
  );
};

