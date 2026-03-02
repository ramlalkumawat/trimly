import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function RouteLoader() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <ArrowPathIcon className="w-5 h-5 text-primary animate-spin" />
        <span className="text-sm font-medium text-gray-700">Loading page...</span>
      </div>
    </div>
  );
}
