import React from 'react';
import { Loader2 } from 'lucide-react';

// Route-level fallback shown while lazy-loaded pages are downloading.
export default function RouteLoader() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="flex items-center gap-3 rounded-2xl bg-white border border-gray-100 px-5 py-4 shadow-soft">
        <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
        <span className="text-sm font-medium text-gray-700">Loading page...</span>
      </div>
    </div>
  );
}
