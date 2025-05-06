import { useState, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table'
import { ItemDetail } from '../../types/apiTypes'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorDisplay from '../common/ErrorDisplay'

interface CategoryItemsTableProps {
  categoryId: number
  items: ItemDetail[]
  isLoading: boolean
  error: Error | null
  onRetry?: () => void
}

const columnHelper = createColumnHelper<ItemDetail>()

const CategoryItemsTable = ({ 
  items, 
  isLoading, 
  error, 
  onRetry 
}: CategoryItemsTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  
  // Define columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('sizeName', {
        header: () => <div className="text-left">Size</div>,
        cell: info => <div className="text-left">{info.getValue() || '-'}</div>,
        size: 80,
      }),
      columnHelper.accessor('condition', {
        header: () => <div className="text-left">Condition</div>,
        cell: info => <div className="text-left">{info.getValue()}</div>,
        size: 100,
      }),
      columnHelper.accessor('location', {
        header: () => <div className="text-left">Location</div>,
        cell: info => <div className="text-left">{info.getValue()}</div>,
        size: 90,
      }),
      columnHelper.accessor('receivedDate', {
        header: () => <div className="text-center">Received</div>,
        cell: info => {
          const dateValue = info.getValue();
          if (!dateValue) return <div className="text-center">-</div>;
          
          const date = new Date(dateValue);
          return (
            <div className="text-center date-cell">
              <span className="date-part">{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span className="time-part">{date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          );
        },
        size: 150,
      }),
      columnHelper.accessor('isActive', {
        header: () => <div className="text-center">Status</div>,
        cell: info => (
          <div className="text-center">
            <span className={info.getValue() ? 'status-active' : 'status-inactive'}>
              {info.getValue() ? 'Active' : 'Inactive'}
            </span>
          </div>
        ),
        size: 80,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="text-center">Actions</div>,
        cell: info => (
          <div className="text-center">
            <Link to={`/items/${info.row.original.id}`} className="item-details-link">
              <button className="compact-view-button view-edit-button">
                View/Edit
              </button>
            </Link>
          </div>
        ),
        size: 100,
      }),
    ],
    []
  )
  
  // Create table instance
  const table = useReactTable({
    data: items,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })
  
  // Show loading state
  if (isLoading) {
    return <LoadingSpinner text="Loading items..." />
  }
  
  // Show error state
  if (error) {
    return <ErrorDisplay error={error} retry={onRetry} />
  }
  
  // Handle empty data
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📦</div>
        <h4>No Items Found</h4>
        <p className="empty-state-message">
          {globalFilter 
            ? "No items match your search criteria. Try adjusting your filters."
            : "This category doesn't have any items yet."}
        </p>
        <div className="empty-state-actions">
          <Link to="/add" className="button compact-view-button">
            <span>+</span> Add New Item
          </Link>
          {globalFilter && (
            <button 
              onClick={() => setGlobalFilter('')} 
              className="button secondary"
            >
              Clear Search
            </button>
          )}
        </div>
      </div>
    )
  }
  
  return (
    <div className="items-table">
      <div className="table-controls">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Search items..."
            className="search-input"
          />
          {globalFilter && (
            <button 
              className="clear-search-btn" 
              onClick={() => setGlobalFilter('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>
      
      <div className="compact-table-container">
        <table className="compact-table">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} style={{ width: header.column.getSize() }}>
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
                        <span className="sort-indicator">
                          {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
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
                className={row.original.isActive ? '' : 'inactive-row'}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} style={{ width: cell.column.getSize() }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <div className="item-count">
          <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
          {globalFilter && (
            <span className="filter-info"> (filtered from {table.getPreFilteredRowModel().rows.length})</span>
          )}
        </div>
        <div className="swipe-hint">
          {items.length > 3 && window.innerWidth < 768 && (
            <small className="text-secondary">← Swipe to see more →</small>
          )}
        </div>
      </div>
    </div>
  )
}

export default CategoryItemsTable