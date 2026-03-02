import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { subscribeLoading } from '../../utils/loadingBus';

// Global API activity indicator tied to Axios interceptors.
export default function GlobalLoader() {
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeLoading(setActiveCount);
    return unsubscribe;
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[80] pointer-events-none transition-opacity duration-300 ${
        activeCount > 0 ? 'opacity-100' : 'opacity-0'
      }`}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="absolute top-0 inset-x-0 h-1 bg-black/5 overflow-hidden">
        <div className="h-full w-1/3 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 animate-global-progress" />
      </div>

      <div className="absolute top-4 right-4 sm:right-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-gray-900 text-white px-3 py-2 shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs font-medium">Syncing...</span>
        </div>
      </div>
    </div>
  );
}
