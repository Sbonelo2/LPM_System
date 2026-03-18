// src/components/TableComponent.tsx
import React, { useState, useMemo } from 'react';
import './TableComponent.css'; // Import the dedicated CSS file

// Define the shape of a column
export interface TableColumn<T> {
  key?: keyof T | string; 
  header: string | number; 
  render?: (item: T) => React.ReactNode; 
  sortable?: boolean;
  filterable?: boolean;
}

// Define the props for the TableComponent
interface TableComponentProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  caption?: string;
  className?: string; 
  onRowClick?: (item: T, index: number) => void;
  enableSearch?: boolean;
  enableSort?: boolean;
  enableFilter?: boolean;
  searchPlaceholder?: string;
}

function TableComponent<T extends { [key: string]: any }>({
  columns,
  data,
  caption,
  className,
  onRowClick,
  enableSearch = true,
  enableSort = true,
  enableFilter = true,
  searchPlaceholder = "Search...",
}: TableComponentProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterColumn, setFilterColumn] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');

  // Get unique values for filtering
  const getFilterOptions = (columnKey: string) => {
    if (!columnKey) return [];
    const values = data.map(item => item[columnKey]).filter(Boolean);
    return [...new Set(values)].sort();
  };

  // Filter and search data
  const filteredAndSearchedData = useMemo(() => {
    let filtered = data;

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(item =>
        Object.values(item).some(value =>
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply filter
    if (filterColumn && filterValue) {
      filtered = filtered.filter(item =>
        item[filterColumn] === filterValue
      );
    }

    // Apply sort
    if (sortColumn && enableSort) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else {
          comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, filterColumn, filterValue, sortColumn, sortDirection, enableSort]);

  const handleSort = (columnKey: string) => {
    if (!enableSort) return;
    
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterColumn('');
    setFilterValue('');
    setSortColumn(null);
    setSortDirection('asc');
  };

  return (
    <div className={`table-container ${className || ''}`}>
      {/* Search, Sort, and Filter Controls */}
      {(enableSearch || enableFilter) && (
        <div className="table-controls">
          {enableSearch && (
            <div className="search-control">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          )}
          
          {enableFilter && (
            <div className="filter-controls">
              <select
                value={filterColumn}
                onChange={(e) => {
                  setFilterColumn(e.target.value);
                  setFilterValue('');
                }}
                className="filter-column-select"
              >
                <option value="">Filter by column...</option>
                {columns
                  .filter(col => col.filterable !== false && col.key)
                  .map(col => (
                    <option key={String(col.key)} value={String(col.key)}>
                      {col.header}
                    </option>
                  ))}
              </select>
              
              {filterColumn && (
                <select
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="filter-value-select"
                >
                  <option value="">All values...</option>
                  {getFilterOptions(filterColumn).map(value => (
                    <option key={String(value)} value={String(value)}>
                      {value}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
          
          {(searchTerm || filterColumn || filterValue || sortColumn) && (
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
          )}
        </div>
      )}

      <table className="table-component">
        {caption && <caption className="table-caption">{caption}</caption>}
        <thead>
          <tr className="table-header">
            {columns.map((column, index) => (
              <th 
                key={String(column.key) + index}
                className={enableSort && column.sortable !== false ? 'sortable-header' : ''}
                onClick={() => column.key && handleSort(String(column.key))}
              >
                {column.header}
                {enableSort && sortColumn === String(column.key) && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredAndSearchedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-empty-state">
                {searchTerm || filterColumn || filterValue 
                  ? 'No data found matching your criteria.' 
                  : 'No data available.'}
              </td>
            </tr>
          ) : (
            filteredAndSearchedData.map((item, rowIndex) => (
              <tr
                key={rowIndex}
                className={`table-row ${onRowClick ? 'table-row-clickable' : ''}`}
                onClick={() => onRowClick && onRowClick(item, rowIndex)}
              >
                {columns.map((column, colIndex) => (
                  <td key={String(column.key) + colIndex}>
                    {column.render ? column.render(item) : (column.key ? (item as any)[column.key] : null)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      {/* Results count */}
      {(searchTerm || filterColumn || filterValue || sortColumn) && (
        <div className="table-results-info">
          Showing {filteredAndSearchedData.length} of {data.length} results
        </div>
      )}
    </div>
  );
}

export default TableComponent;