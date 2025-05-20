import { useState, useEffect, useMemo } from 'react'
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

  // We'll use a different column setup for mobile versus desktop
  const isMobile = window.innerWidth < 768;

  // Define columns
  const columns = useMemo(
    () => [
      // Name + actionable button on mobile screens
      columnHelper.accessor('name', {
        header: 'Category',
        cell: info => {
          const description = info.row.original.description || 'No description available';
          const totalQuantity = info.row.original.totalQuantity ?? 0;
          const threshold = info.row.original.lowStockThreshold;
          const isLowStock = totalQuantity < threshold;
          
          return (
            <div className="category-mobile-cell">
              <div className="category-name-cell">
                <Link to={`/categories/${info.row.original.id}`} className="category-link">
                  {info.getValue()}
                </Link>
                {isMobile && (
                  totalQuantity === 0 ? (
                    <span className="mobile-stock-badge out-of-stock">Out of Stock</span>
                  ) : totalQuantity < threshold * 0.5 ? (
                    <span className="mobile-stock-badge critical">Critical</span>
                  ) : totalQuantity < threshold ? (
                    <span className="mobile-stock-badge low">Low</span>
                  ) : null
                )}
              </div>
              
              {isMobile && (
                <div className="mobile-category-details">
                  <div className="mobile-stock-level" style={{ flex: 1, maxWidth: '70%' }}>
                    <StockLevel current={totalQuantity} threshold={threshold} />
                  </div>
                  <Link to={`/categories/${info.row.original.id}`} className="view-details-link">
                    <button className="mobile-view-button">
                      View
                    </button>
                  </Link>
                </div>
              )}
            </div>
          );
        },
      }),

      // Only show these columns on desktop
      ...(!isMobile ? [
        columnHelper.accessor('totalQuantity', {
          header: 'Current Stock',
          cell: info => <div className="text-center">{info.getValue() ?? 0}</div>,
        }),
        columnHelper.accessor('lowStockThreshold', {
          header: 'Min. Required',
          cell: info => <div className="text-center">{info.getValue()}</div>,
        }),
        // Stock Status
        columnHelper.display({
          id: 'stock-status',
          header: 'Stock Status',
          size: 200,
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
        // Actions column
        columnHelper.display({
          id: 'actions',
          header: 'Actions',
          cell: info => (
            <div className="text-center">
              <Link to={`/categories/${info.row.original.id}`} className="view-details-link">
                <button className="view-button">
                  <span className="view-icon">📋</span>
                  View
                </button>
              </Link>
            </div>
          ),
        }),
      ] : []),
    ],
    [isMobile]
  )

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Handle window resize to adjust table view
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
                  row.original.totalQuantity === 0 
                    ? 'out-of-stock' 
                    : row.original.totalQuantity < row.original.lowStockThreshold * 0.5
                    ? 'critical-stock'
                    : row.original.totalQuantity < row.original.lowStockThreshold
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
      <div className="stock-legend mt-1">
        <div className="stock-legend-item">
          <div className="legend-dot out-of-stock"></div>
          <p><small><strong>Out of Stock:</strong> No items available</small></p>
        </div>
        <div className="stock-legend-item">
          <div className="legend-dot critical-stock"></div>
          <p><small><strong>Critical:</strong> Below 50% of minimum required</small></p>
        </div>
        <div className="stock-legend-item">
          <div className="legend-dot low-stock"></div>
          <p><small><strong>Low Stock:</strong> Below minimum required</small></p>
        </div>
      </div>
    </div>
  )
}

export default CategoryTable