import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const PAGE_BUFFER = 1;

const getVisiblePages = (current, total) => {
  if (!total || total < 1) return [];
  const pages = new Set([1, total, current]);

  for (let i = current - PAGE_BUFFER; i <= current + PAGE_BUFFER; i += 1) {
    if (i > 1 && i < total) {
      pages.add(i);
    }
  }

  return [...pages].sort((a, b) => a - b);
};

// Reusable data table with sticky header, debounced search, filters and pagination.
const DataTable = ({
  data,
  columns,
  loading = false,
  error = null,
  pagination = null,
  onPaginationChange,
  onSort,
  onSearch,
  searchPlaceholder = 'Search...',
  showSearch = true,
  showFilters = false,
  filters = null,
  onFilterChange,
  emptyMessage = 'No data available',
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!onSearch) return undefined;

    const timeoutId = window.setTimeout(() => {
      onSearch(searchTerm);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm, onSearch]);

  const handleSort = (column) => {
    if (!column.sortable) return;

    const direction =
      sortConfig.key === column.key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    const nextSort = { key: column.key, direction };

    setSortConfig(nextSort);
    onSort?.(nextSort);
  };

  const handlePageChange = (nextPage) => {
    if (!pagination || !onPaginationChange) return;
    if (nextPage < 1 || nextPage > pagination.totalPages) return;
    onPaginationChange({ ...pagination, page: nextPage });
  };

  const visiblePages = useMemo(
    () => getVisiblePages(pagination?.page || 1, pagination?.totalPages || 1),
    [pagination?.page, pagination?.totalPages]
  );

  return (
    <section className="admin-card overflow-hidden">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {showSearch ? (
            <div className="relative w-full max-w-xl">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={searchPlaceholder}
                className="admin-input pl-9"
              />
            </div>
          ) : (
            <div />
          )}

          {showFilters && filters?.length ? (
            <div className="flex flex-wrap items-center gap-2">
              {filters.map((filter) => (
                <select
                  key={filter.key}
                  value={filter.value}
                  onChange={(event) => onFilterChange?.(filter.key, event.target.value)}
                  className="admin-input min-w-[170px]"
                >
                  {filter.options?.map((option) => (
                    <option key={`${filter.key}_${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
            <tr>
              {columns.map((column) => {
                const isSorted = sortConfig.key === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    onClick={() => handleSort(column)}
                    className={[
                      'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-6',
                      column.sortable ? 'cursor-pointer select-none hover:bg-slate-100' : '',
                    ].join(' ')}
                  >
                    <div className="inline-flex items-center gap-1.5">
                      {column.title}
                      {column.sortable ? (
                        isSorted && sortConfig.direction === 'asc' ? (
                          <ChevronUpIcon className="h-4 w-4 text-blue-700" />
                        ) : (
                          <ChevronDownIcon className={`h-4 w-4 ${isSorted ? 'text-blue-700' : 'text-slate-400'}`} />
                        )
                      ) : null}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                    <ArrowPathIcon className="h-4 w-4 animate-spin text-blue-700" />
                    Loading records...
                  </div>
                </td>
              </tr>
            ) : null}

            {!loading && error ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-14 text-center">
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </td>
              </tr>
            ) : null}

            {!loading && !error && data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-14 text-center text-sm text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : null}

            {!loading && !error
              ? data.map((row, rowIndex) => (
                  <tr key={row._id || row.id || rowIndex} className="transition-colors hover:bg-blue-50/30">
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-4 text-sm text-slate-700 sm:px-6">
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <div className="border-t border-slate-200 px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500 sm:text-sm">
              Showing{' '}
              <span className="font-semibold text-slate-700">
                {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total || 0)}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(pagination.page * pagination.limit, pagination.total || 0)}
              </span>{' '}
              of <span className="font-semibold text-slate-700">{pagination.total || 0}</span> results
            </p>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePageChange((pagination.page || 1) - 1)}
                disabled={pagination.page <= 1}
                className="admin-btn-secondary px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>

              {visiblePages.map((page, idx) => {
                const prevPage = visiblePages[idx - 1];
                const gap = prevPage && page - prevPage > 1;
                return (
                  <React.Fragment key={`page_${page}`}>
                    {gap ? <span className="px-1 text-slate-400">...</span> : null}
                    <button
                      type="button"
                      onClick={() => handlePageChange(page)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        page === pagination.page
                          ? 'bg-blue-700 text-white'
                          : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}

              <button
                type="button"
                onClick={() => handlePageChange((pagination.page || 1) + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="admin-btn-secondary px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default DataTable;
