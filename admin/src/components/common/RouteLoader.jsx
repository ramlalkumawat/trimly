import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function RouteLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
        <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-700" />
        <span className="text-sm font-medium text-slate-700">Loading page...</span>
      </div>
    </div>
  );
}
