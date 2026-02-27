import React from 'react';

// Generic table component with optional search, sort, and filter controls.
const DataTable = ({
  columns,
  data,
  actions,
  searchPlaceholder = 'Search...',
  onSearch,
  sortBy,
  onSort,
  filters,
  onFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortConfig, setSortConfig] = React.useState(sortBy);

  const handleSearch = (value) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  const handleSort = (key) => {
    setSortConfig(key);
    onSort?.(key);
  };

  const handleFilter = (filterKey, value) => {
    onFilterChange?.(filterKey, value);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-card overflow-hidden">
      {/* Header with Search and Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Search */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 bg-input-bg border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary placeholder-gray-500"
            />
          </div>

          {/* Filters */}
          {filters && Object.keys(filters).length > 0 && (
            <div className="flex gap-2">
              {Object.entries(filters).map(([key, options]) => (
                <select
                  key={key}
                  onChange={(e) => handleFilter(key, e.target.value)}
                  className="px-3 py-2 bg-input-bg border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary text-sm"
                >
                  <option value="">All {key}</option>
                  {options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
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
        <table className="w-full">
          <thead className="bg-input-bg border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-4 text-left text-sm font-bold text-text-primary"
                  style={col.width ? { width: col.width } : {}}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      {col.label}
                      {sortConfig === col.key && <span>▼</span>}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
              {actions && <th className="px-6 py-4 text-left text-sm font-bold text-text-primary">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {data.length > 0 ? (
              data.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-200 hover:bg-input-bg transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 text-sm text-text-primary">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        {actions.map((action) => (
                          <button
                            key={action.label}
                            onClick={() => action.onClick(row)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                              action.variant === 'danger'
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : action.variant === 'success'
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-primary text-text-primary hover:bg-primary-hover'
                            }`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with Pagination Info */}
      {data.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-input-bg text-sm text-gray-600">
          Showing {data.length} records
        </div>
      )}
    </div>
  );
};

export default DataTable;
