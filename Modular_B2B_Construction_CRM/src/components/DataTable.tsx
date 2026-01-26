import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, Download, Grid3x3, List, Filter } from 'lucide-react';
import { Button } from './Button';
import { SearchInput } from './Input';
import { Badge } from './Badge';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  selectable?: boolean;
  onRowClick?: (row: any) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  selectable = false,
  onRowClick,
}) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const toggleRowSelection = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              {selectable && (
                <th className="w-12 px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-[#D1D5DB] text-[#2563EB] focus:ring-[#2563EB]"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(new Set(data.map((_, i) => i)));
                      } else {
                        setSelectedRows(new Set());
                      }
                    }}
                    checked={selectedRows.size === data.length && data.length > 0}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider"
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-2 hover:text-[#111827] transition-colors"
                    >
                      {column.label}
                      {sortColumn === column.key ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-4 w-4 text-[#9CA3AF]" />
                      )}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#E5E7EB]">
            {data.map((row, index) => {
              const isSelected = selectedRows.has(index);
              return (
                <tr
                  key={index}
                  onClick={() => onRowClick?.(row)}
                  className={`
                    h-14 transition-colors
                    ${onRowClick ? 'cursor-pointer hover:bg-[#F9FAFB]' : ''}
                    ${isSelected ? 'bg-[#DBEAFE] border-l-4 border-l-[#2563EB]' : ''}
                  `}
                >
                  {selectable && (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-[#D1D5DB] text-[#2563EB] focus:ring-[#2563EB]"
                        checked={isSelected}
                        onChange={() => toggleRowSelection(index)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 text-sm text-[#111827]">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const DataTableFilters: React.FC<{
  onSearch?: (value: string) => void;
  onExport?: () => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  filters?: React.ReactNode;
}> = ({ onSearch, onExport, viewMode = 'list', onViewModeChange, filters }) => {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex-1">
        <SearchInput
          placeholder="Search..."
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </div>
      {filters}
      {onViewModeChange && (
        <div className="flex gap-1 border border-[#E5E7EB] rounded-md p-1">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            icon={<Grid3x3 className="h-4 w-4" />}
            onClick={() => onViewModeChange('grid')}
          />
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            icon={<List className="h-4 w-4" />}
            onClick={() => onViewModeChange('list')}
          />
        </div>
      )}
      {onExport && (
        <Button
          variant="secondary"
          size="md"
          icon={<Download className="h-4 w-4" />}
          onClick={onExport}
        >
          Export
        </Button>
      )}
    </div>
  );
};

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {icon && (
        <div className="w-16 h-16 bg-[#F3F4F6] rounded-full flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[#111827] mb-2">{title}</h3>
      <p className="text-sm text-[#6B7280] text-center max-w-md mb-6">{description}</p>
      {action}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => {
  return (
    <div className="w-full space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <div
              key={j}
              className="h-12 bg-[#F3F4F6] rounded animate-pulse"
              style={{ width: j === 0 ? '30%' : '20%' }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
