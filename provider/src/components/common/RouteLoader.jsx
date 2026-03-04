import React from 'react';
import { Loader2 } from 'lucide-react';

// Lightweight fallback while route-level code-split bundles are loading.
export default function RouteLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-3 shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-700" />
        <span className="text-sm font-medium text-zinc-700">Loading page...</span>
      </div>
    </div>
  );
}
