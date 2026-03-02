import React, { memo } from 'react';

const variantClasses = {
  default: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  info: 'bg-blue-50 text-blue-700 border-blue-100',
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  accepted: 'bg-sky-50 text-sky-700 border-sky-100',
  in_progress: 'bg-violet-50 text-violet-700 border-violet-100',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rejected: 'bg-rose-50 text-rose-700 border-rose-100',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  error: 'bg-rose-50 text-rose-700 border-rose-100',
};

const normalizeVariant = (variant) => {
  if (!variant) return 'default';
  const key = String(variant).toLowerCase();
  return variantClasses[key] ? key : 'default';
};

// Lightweight status badge with shared visual variants.
const Badge = memo(function Badge({ children, variant = 'default', className = '' }) {
  const resolvedVariant = normalizeVariant(variant);

  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize',
        variantClasses[resolvedVariant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
});

export default Badge;
