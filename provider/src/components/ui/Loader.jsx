import React from 'react';
import { AlertCircle, Inbox, Loader2, RefreshCw } from 'lucide-react';

export function Skeleton({ className = '' }) {
  return <div className={['animate-pulse rounded-xl bg-zinc-200/70', className].join(' ')} />;
}

export function InlineLoader({ label = 'Loading...' }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-zinc-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </span>
  );
}

export function PageLoader({ label = 'Loading data...' }) {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
        <InlineLoader label={label} />
      </div>
    </div>
  );
}

export function CardSkeleton({ rows = 3 }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
      <Skeleton className="h-5 w-40" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center shadow-sm">
      <Icon className="mx-auto h-10 w-10 text-zinc-400" />
      <h3 className="mt-4 text-base font-semibold text-zinc-900">{title}</h3>
      <p className="mt-2 text-sm text-zinc-500">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, compact = false }) {
  return (
    <div
      className={[
        'rounded-2xl border border-rose-100 bg-rose-50 text-rose-900 shadow-sm',
        compact ? 'p-4' : 'p-8 text-center',
      ].join(' ')}
    >
      <div className={compact ? 'flex items-center gap-3' : ''}>
        <AlertCircle className="mx-auto h-10 w-10 text-rose-500" />
        <div className={compact ? 'flex-1' : ''}>
          <h3 className="mt-3 text-base font-semibold">{title}</h3>
          {message ? <p className="mt-2 text-sm text-rose-700">{message}</p> : null}
        </div>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 transition-colors duration-300 hover:bg-rose-100"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      ) : null}
    </div>
  );
}
