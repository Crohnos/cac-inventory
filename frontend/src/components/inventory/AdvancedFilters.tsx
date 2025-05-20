import { useState, useEffect } from 'react'

interface FilterState {
  name: string
  description: string
  quantityMin: string
  quantityMax: string
  lowStockOnly: boolean
}

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterState) => void
  initialFilters?: Partial<FilterState>
}

const AdvancedFilters = ({ onFilterChange, initialFilters = {} }: AdvancedFiltersProps) => {
  const [expanded, setExpanded] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    name: initialFilters.name || '',
    description: initialFilters.description || '',
    quantityMin: initialFilters.quantityMin || '',
    quantityMax: initialFilters.quantityMax || '',
    lowStockOnly: initialFilters.lowStockOnly || false
  })
  
  // Apply filters whenever they change
  useEffect(() => {
    onFilterChange(filters)
  }, [filters, onFilterChange])
  
  const handleReset = () => {
    setFilters({
      name: '',
      description: '',
      quantityMin: '',
      quantityMax: '',
      lowStockOnly: false
    })
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }
  
  const hasActiveFilters = () => {
    return (
      filters.name !== '' ||
      filters.description !== '' ||
      filters.quantityMin !== '' ||
      filters.quantityMax !== '' ||
      filters.lowStockOnly
    )
  }
  
  return (
    <div className="advanced-filters mb-1">
      <div className="flex justify-between items-center">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="secondary"
          aria-expanded={expanded}
          type="button"
        >
          {expanded ? 'Hide Filters' : 'Show Filters'}
          {hasActiveFilters() && ' (Active)'}
        </button>
        
        {hasActiveFilters() && (
          <button 
            onClick={handleReset}
            className="secondary outline"
            type="button"
          >
            Reset Filters
          </button>
        )}
      </div>
      
      {expanded && (
        <div className="filter-controls mt-1 card">
          <div className="grid grid-responsive" style={{ '--grid-template-columns': 'repeat(auto-fill, minmax(150px, 1fr))' } as React.CSSProperties}>
            <div className="form-group">
              <label htmlFor="name">
                Category Name
                <div className="search-input-wrapper" style={{ position: 'relative' }}>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={filters.name}
                    onChange={handleInputChange}
                    placeholder="Search by name..."
                  />
                  {filters.name && (
                    <button 
                      type="button"
                      className="clear-input"
                      onClick={() => setFilters(prev => ({ ...prev, name: '' }))}
                      style={{
                        position: 'absolute',
                        right: '0.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        padding: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        opacity: 0.7
                      }}
                      aria-label="Clear name filter"
                    >
                      ×
                    </button>
                  )}
                </div>
              </label>
            </div>
            
            <div className="form-group">
              <label htmlFor="description">
                Description
                <div className="search-input-wrapper" style={{ position: 'relative' }}>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    value={filters.description}
                    onChange={handleInputChange}
                    placeholder="Search in description..."
                  />
                  {filters.description && (
                    <button 
                      type="button"
                      className="clear-input"
                      onClick={() => setFilters(prev => ({ ...prev, description: '' }))}
                      style={{
                        position: 'absolute',
                        right: '0.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        padding: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        opacity: 0.7
                      }}
                      aria-label="Clear description filter"
                    >
                      ×
                    </button>
                  )}
                </div>
              </label>
            </div>
            
            <div className="form-group">
              <label htmlFor="quantityMin">
                Min Quantity
                <input
                  type="number"
                  id="quantityMin"
                  name="quantityMin"
                  value={filters.quantityMin}
                  onChange={handleInputChange}
                  placeholder="Minimum"
                  min="0"
                />
              </label>
            </div>
            
            <div className="form-group">
              <label htmlFor="quantityMax">
                Max Quantity
                <input
                  type="number"
                  id="quantityMax"
                  name="quantityMax"
                  value={filters.quantityMax}
                  onChange={handleInputChange}
                  placeholder="Maximum"
                  min="0"
                />
              </label>
            </div>
          </div>
          
          <div className="mt-1">
            <label className="flex items-center gap-1" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                id="lowStockOnly"
                name="lowStockOnly"
                checked={filters.lowStockOnly}
                onChange={handleInputChange}
              />
              <span className={filters.lowStockOnly ? 'low-stock p-1' : ''}>
                Show low stock items only
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedFilters