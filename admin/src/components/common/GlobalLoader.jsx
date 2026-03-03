import React, { useEffect, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { subscribeLoading } from '../../utils/loadingBus';

// Global API activity indicator for admin dashboard actions.
export default function GlobalLoader() {
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeLoading(setActiveCount);
    return unsubscribe;
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[90] pointer-events-none transition-opacity duration-300 ${
        activeCount > 0 ? 'opacity-100' : 'opacity-0'
      }`}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-slate-200/50">
        <div className="animate-global-progress h-full w-1/3 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500" />
      </div>
      <div className="absolute top-4 right-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-white shadow-lg">
          <ArrowPathIcon className="h-4 w-4 animate-spin" />
          <span className="text-xs font-medium">Syncing...</span>
        </div>
      </div>
    </div>
  );
}
