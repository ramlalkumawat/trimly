import React, { useState, useCallback } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

// Feature-rich table for admin pages with sorting, search, filters, and pagination.
const DataTable = ({ 
  data, 
  columns, 
  loading = false, 
  error = null,
  pagination = null,
  onPaginationChange,
  onSort,
  onSearch,
  searchPlaceholder = "Search...",
  showSearch = true,
  showFilters = false,
  filters = null,
  onFilterChange,
  emptyMessage = "No data available"
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');

  // Debounced search
  const debouncedSearch = useCallback(
    (value) => {
      const timer = setTimeout(() => {
        onSearch?.(value);
      }, 500);
      return () => clearTimeout(timer);
    },
    [onSearch]
  );

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleSort = (column) => {
    if (!column.sortable) return;
    
    const direction = sortConfig.key === column.key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key: column.key, direction });
    onSort?.({ key: column.key, direction });
  };

  const renderSortIcon = (column) => {
    if (!column.sortable) return null;
    
    const isActive = sortConfig.key === column.key;
    const Icon = isActive && sortConfig.direction === 'asc' ? ChevronUpIcon : ChevronDownIcon;
    
    return (
      <Icon 
        className={`ml-1 h-4 w-4 ${isActive ? 'text-amber-600' : 'text-gray-400'}`} 
      />
    );
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6 text-center">
          <div className="text-red-500 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {showSearch && (
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder={searchPlaceholder}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
              />
            </div>
          )}
          
          {showFilters && filters && (
            <div className="flex gap-2">
              {filters.map((filter) => (
                <select
                  key={filter.key}
                  value={filter.value}
                  onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                  className="block px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">{filter.placeholder}</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center">
                    {column.title}
                    {renderSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={row.id || index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-4 py-3 sm:px-6 border-t border-gray-200 sm:items-center sm:justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPaginationChange?.({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPaginationChange?.({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page >= pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => onPaginationChange?.({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                {[...Array(pagination.totalPages)].map((_, i) => {
                  const page = i + 1;
                  const isActive = page === pagination.page;
                  const isNearCurrent = Math.abs(page - pagination.page) <= 2 || page === 1 || page === pagination.totalPages;
                  
                  if (!isNearCurrent && i > 0 && i < pagination.totalPages - 1) {
                    if (Math.abs(page - pagination.page) === 3) {
                      return (
                        <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => onPaginationChange?.({ ...pagination, page })}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        isActive
                          ? 'z-10 bg-amber-50 border-amber-500 text-amber-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => onPaginationChange?.({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
