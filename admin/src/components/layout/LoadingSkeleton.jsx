import React from 'react';

// Reusable skeleton placeholders for cards, tables, and page loading states.
const LoadingSkeleton = ({ className = "", rows = 3 }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse bg-gray-200 rounded-lg h-4"
          style={{ animationDelay: `${index * 0.1}s` }}
        />
      ))}
    </div>
  );
};

export const TableSkeleton = ({ columns = 5, rows = 10 }) => {
  return (
    <div className="admin-card overflow-hidden">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-6 py-3">
                <div className="h-4 animate-pulse rounded bg-slate-200" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 animate-pulse rounded bg-slate-100" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const CardSkeleton = ({ count = 1 }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="admin-card p-6">
          <div className="animate-pulse">
            <div className="mb-4 h-4 w-3/4 rounded bg-slate-200" />
            <div className="mb-2 h-8 w-1/2 rounded bg-slate-200" />
            <div className="h-3 w-full rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
