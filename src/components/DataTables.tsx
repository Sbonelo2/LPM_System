import React from "react";


export interface Column<T> {
    key: keyof T;
    label: string;
    render?: (value: T[keyof T], row: T) => React.ReactNode;
    sortable?: boolean;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    emptyMessage?: string;
    className?: string;
}

function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "No data available.",
  className = "",
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className={`data-table data-table--loading ${className}`}>
        <div className="data-table__loading">Loading...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`data-table data-table--empty ${className}`}>
        <div className="data-table__empty">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={`data-table ${className}`}>
      <table className="data-table__table">
        <thead className="data-table__head">
          <tr className="data-table__row">
            {columns.map((column) => (
              <th key={String(column.key)} className="data-table__header">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="data-table__body">
          {data.map((row, index) => (
            <tr key={index} className="data-table__row">
              {columns.map((column) => (
                <td key={String(column.key)} className="data-table__cell">
                  {column.render
                    ? column.render(row[column.key], row)
                    : String(row[column.key] || "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;