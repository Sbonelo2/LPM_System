// src/components/TableComponent.tsx
import React from 'react';
import './TableComponent.css'; // Import the dedicated CSS file

// Define the shape of a column
export interface TableColumn<T> {
  key?: keyof T | string; 
  header: string | number; 
  render?: (item: T) => React.ReactNode; 
}

// Define the props for the TableComponent
interface TableComponentProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  caption?: string;
  className?: string; 
  onRowClick?: (item: T, index: number) => void;
}

function TableComponent<T extends { [key: string]: any }>({
  columns,
  data,
  caption,
  className,
  onRowClick,
}: TableComponentProps<T>) {
  return (
    <div className={`table-container ${className || ''}`}>
      <table className="table-component">
        {caption && <caption className="table-caption">{caption}</caption>}
        <thead>
          <tr className="table-header">
            {columns.map((column, index) => (
              <th key={String(column.key) + index}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-empty-state">
                No data available.
              </td>
            </tr>
          ) : (
            data.map((item, rowIndex) => (
              <tr
                key={rowIndex} // Using index as key, consider unique ID if available
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
    </div>
  );
}

export default TableComponent;