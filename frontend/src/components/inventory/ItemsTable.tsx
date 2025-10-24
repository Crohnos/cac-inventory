import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { Package, AlertTriangle, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import type { Item } from '../../stores/inventoryStore';

interface ItemsTableProps {
  items: Item[];
  isLoading?: boolean;
}

const columnHelper = createColumnHelper<Item>();

export const ItemsTable: React.FC<ItemsTableProps> = ({ items, isLoading = false }) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  const columns = React.useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Item',
      cell: (info) => (
        <Link
          to={`/items/${info.row.original.item_id}`}
          className="flex items-center space-x-3 text-caccc-green hover:text-caccc-green-dark group"
        >
          <Package className="h-5 w-5 group-hover:scale-110 transition-transform" />
          <div>
            <div className="font-medium">{info.getValue()}</div>
            {info.row.original.description && (
              <div className="text-sm text-caccc-grey/70">
                {info.row.original.description}
              </div>
            )}
          </div>
        </Link>
      ),
    }),
    columnHelper.accessor('size_count', {
      header: 'Sizes',
      cell: (info) => (
        <span className="text-sm text-brand">
          {info.getValue() || 1} size{(info.getValue() || 1) !== 1 ? 's' : ''}
        </span>
      ),
    }),
    columnHelper.accessor('total_quantity', {
      header: 'Total Qty',
      cell: (info) => {
        const quantity = info.getValue() || 0;
        const minStock = info.row.original.min_stock_level || 5;
        const isLowStock = quantity <= minStock;
        
        return (
          <div className="flex items-center space-x-2">
            {isLowStock && quantity > 0 && (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
            {quantity === 0 && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
            <span className={`font-medium ${
              quantity === 0 
                ? 'text-red-600' 
                : isLowStock 
                  ? 'text-yellow-600' 
                  : 'text-green-600'
            }`}>
              {quantity}
            </span>
            <span className="text-xs text-caccc-grey/60">
              {info.row.original.unit_type || 'each'}
            </span>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Quick Actions',
      cell: (info) => (
        <div className="flex space-x-2">
          <Link
            to={`/items/${info.row.original.item_id}`}
            className="inline-flex items-center space-x-1 px-3 py-2 text-xs bg-gray-100 hover:bg-caccc-grey/10 text-brand rounded-lg transition-colors"
          >
            <Eye className="h-3 w-3" />
            <span>Details</span>
          </Link>
        </div>
      ),
    }),
  ], []);

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-3 md:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search items..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full px-4 py-3 md:py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-caccc-green focus:border-transparent text-sm md:text-base text-brand min-h-[48px]"
            />
          </div>

          <div className="text-xs md:text-sm text-caccc-grey/70 text-center sm:text-right">
            {table.getFilteredRowModel().rows.length} of {items.length} items
          </div>
        </div>
      </div>

      {/* Mobile Card View (visible only on small screens) */}
      <div className="md:hidden space-y-3">
        {table.getRowModel().rows.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Package className="h-12 w-12 text-caccc-grey/40 mx-auto mb-4" />
            <h3 className="text-base font-medium text-brand mb-2">No items found</h3>
            <p className="text-sm text-caccc-grey/70">
              {globalFilter
                ? `No items match "${globalFilter}"`
                : "No inventory items have been added yet"
              }
            </p>
          </div>
        ) : (
          table.getRowModel().rows.map(row => {
            const item = row.original;
            const quantity = item.total_quantity || 0;
            const minStock = item.min_stock_level || 5;
            const isLowStock = quantity <= minStock;

            return (
              <Link
                key={row.id}
                to={`/items/${item.item_id}`}
                className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <Package className="h-6 w-6 text-caccc-green flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-brand text-base truncate">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-caccc-grey/70 line-clamp-2 mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <div className="flex items-center space-x-1 mb-1">
                      {isLowStock && quantity > 0 && (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      {quantity === 0 && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`font-semibold text-lg ${
                        quantity === 0
                          ? 'text-red-600'
                          : isLowStock
                            ? 'text-yellow-600'
                            : 'text-green-600'
                      }`}>
                        {quantity}
                      </span>
                    </div>
                    <p className="text-xs text-caccc-grey/60">{item.unit_type || 'each'}</p>
                    <p className="text-xs text-brand mt-1">{item.size_count || 1} size{(item.size_count || 1) !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center justify-end pt-2 border-t border-gray-100">
                  <span className="text-xs text-caccc-green font-medium flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Desktop Table View (hidden on small screens) */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-caccc-grey/5">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-medium text-caccc-grey uppercase tracking-wider"
                    >
                      <div
                        className={`flex items-center space-x-1 ${
                          header.column.getCanSort() ? 'cursor-pointer hover:text-caccc-green' : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        {header.column.getCanSort() && (
                          <span className="flex flex-col">
                            <ChevronUp
                              className={`h-3 w-3 ${
                                header.column.getIsSorted() === 'asc'
                                  ? 'text-caccc-green'
                                  : 'text-caccc-grey/40'
                              }`}
                            />
                            <ChevronDown
                              className={`h-3 w-3 -mt-1 ${
                                header.column.getIsSorted() === 'desc'
                                  ? 'text-caccc-green'
                                  : 'text-caccc-grey/40'
                              }`}
                            />
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center">
                    <Package className="h-12 w-12 text-caccc-grey/40 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-brand mb-2">No items found</h3>
                    <p className="text-caccc-grey/70">
                      {globalFilter
                        ? `No items match "${globalFilter}"`
                        : "No inventory items have been added yet"
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-caccc-green/5 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};