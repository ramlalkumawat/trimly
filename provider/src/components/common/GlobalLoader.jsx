import React, { useEffect, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { subscribeLoading } from '../../utils/loadingBus';

// Global API progress indicator for provider dashboard.
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
      <div className="absolute top-0 inset-x-0 h-1 bg-black/5 overflow-hidden">
        <div className="h-full w-1/3 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 animate-global-progress" />
      </div>
      <div className="absolute top-4 right-4">
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-full shadow-lg">
          <ArrowPathIcon className="w-4 h-4 animate-spin" />
          <span className="text-xs font-medium">Syncing...</span>
        </div>
      </div>
    </div>
  );
}
