import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
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
        <div className="h-full w-1/3 bg-gradient-to-r from-zinc-700 via-zinc-500 to-zinc-700 animate-global-progress" />
      </div>
      <div className="absolute top-4 right-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-2 text-white shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs font-medium">Syncing...</span>
        </div>
      </div>
    </div>
  );
}
