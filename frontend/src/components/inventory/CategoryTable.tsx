import { useState, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import StockLevel from './StockLevel'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table'
import { ItemCategory } from '../../types/apiTypes'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorDisplay from '../common/ErrorDisplay'

type CategoryTableProps = {
  data: ItemCategory[]
  isLoading: boolean
  error: Error | null
  onRetry?: () => void
}

const columnHelper = createColumnHelper<ItemCategory>()

const CategoryTable = ({ data, isLoading, error, onRetry }: CategoryTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([])

  // Define columns
  const columns = useMemo(
    () => [
      // ID column removed as requested
      columnHelper.accessor('name', {
        header: 'Name',
        cell: info => {
          const description = info.row.original.description || 'No description available';
          return (
            <div className="category-name-cell">
              <span className="info-icon" data-tooltip={description}>ℹ️</span>
              <Link to={`/categories/${info.row.original.id}`} className="category-link">
                {info.getValue()}
              </Link>
            </div>
          );
        },
      }),
      columnHelper.accessor('totalQuantity', {
        header: 'Current Stock',
        cell: info => <div className="text-center">{info.getValue() ?? 0}</div>,
      }),
      columnHelper.accessor('lowStockThreshold', {
        header: 'Min. Required',
        cell: info => <div className="text-center">{info.getValue()}</div>,
      }),
      // Stock Status now before Details column
      columnHelper.display({
        id: 'stock-status',
        header: 'Stock Status',
        size: 200, // Set a fixed width for this column
        cell: info => {
          const totalQuantity = info.row.original.totalQuantity ?? 0;
          const threshold = info.row.original.lowStockThreshold;
          return (
            <div className="stock-level-container" style={{ width: '100%' }}>
              <StockLevel current={totalQuantity} threshold={threshold} />
            </div>
          );
        }
      }),
      // Details column now rightmost
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: info => (
          <div className="text-center">
            <Link to={`/categories/${info.row.original.id}`} className="view-details-link">
              <button className="view-button">
                <span className="view-icon">📋</span>
                View/Edit
              </button>
            </Link>
          </div>
        ),
      }),
    ],
    []
  )

  // Create table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  // Show loading state
  if (isLoading) {
    return <LoadingSpinner text="Loading categories..." />
  }

  // Show error state
  if (error) {
    return <ErrorDisplay error={error} retry={onRetry} />
  }

  // Handle empty data
  if (data.length === 0) {
    return (
      <div className="text-center p-1">
        <p>No categories found. Create one to get started!</p>
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-auto">
        <table>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    <div
                      {...{
                        className: header.column.getCanSort() ? 'sortable-header cursor-pointer' : '',
                        onClick: header.column.getToggleSortingHandler(),
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() && (
                        <span>
                          {header.column.getIsSorted() === 'asc' ? ' ↑' : ' ↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr 
                key={row.id}
                className={
                  (row.original.totalQuantity !== undefined && 
                   row.original.lowStockThreshold !== undefined &&
                   parseInt(String(row.original.totalQuantity)) < parseInt(String(row.original.lowStockThreshold)))
                    ? 'low-stock' 
                    : ''
                }
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-1 mt-1">
        <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--danger-light)', borderRadius: '3px' }}></div>
        <p><small><strong>Low stock warning:</strong> Categories with quantity below threshold are highlighted.</small></p>
      </div>
    </div>
  )
}

export default CategoryTable