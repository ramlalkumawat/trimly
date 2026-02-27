import React from 'react';

// Shared max-width wrapper so pages stay aligned across breakpoints.
export default function ResponsiveContainer({ children, className = "" }) {
  return (
    <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
