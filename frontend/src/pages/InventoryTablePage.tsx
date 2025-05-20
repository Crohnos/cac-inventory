import { useState, useEffect, useMemo } from 'react'
import { useCategories } from '../hooks'
import CategoryTable from '../components/inventory/CategoryTable'
import AddCategoryForm from '../components/inventory/AddCategoryForm'
import AdvancedFilters from '../components/inventory/AdvancedFilters'
import { ItemCategory } from '../types/apiTypes'

const InventoryTablePage = () => {
  const [showAddForm, setShowAddForm] = useState(false)
  const { data = [], isLoading, error, refetch } = useCategories()
  
  // Advanced filter state
  const [filters, setFilters] = useState({
    name: '',
    description: '',
    quantityMin: '',
    quantityMax: '',
    lowStockOnly: false,
  })
  
  // Apply filters to data
  const filteredData = useMemo(() => {
    return data.filter((category: ItemCategory) => {
      // Filter by name
      if (filters.name && !category.name.toLowerCase().includes(filters.name.toLowerCase())) {
        return false
      }
      
      // Filter by description
      if (filters.description && 
          (!category.description || 
           !category.description.toLowerCase().includes(filters.description.toLowerCase()))) {
        return false
      }
      
      // Filter by minimum quantity
      if (filters.quantityMin && 
          (typeof category.totalQuantity === 'undefined' || 
           category.totalQuantity < parseInt(filters.quantityMin))) {
        return false
      }
      
      // Filter by maximum quantity
      if (filters.quantityMax && 
          (typeof category.totalQuantity === 'undefined' || 
           category.totalQuantity > parseInt(filters.quantityMax))) {
        return false
      }
      
      // Filter by low stock
      if (filters.lowStockOnly && 
          (typeof category.totalQuantity === 'undefined' || 
           category.totalQuantity >= category.lowStockThreshold)) {
        return false
      }
      
      return true
    })
  }, [data, filters])
  
  const handleAddSuccess = () => {
    setShowAddForm(false)
    refetch()
  }
  
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
  }
  
  // Check if we're on mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Update on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="inventory-page">
      <header className="inventory-header">
        <h1>{isMobile ? 'Inventory' : 'Inventory Management'}</h1>
        {!isMobile && <p>Manage your inventory categories and track stock levels.</p>}
      </header>
      
      <div className="inventory-content mb-1">
        <div className="inventory-actions mb-1">
          <div className="flex flex-wrap gap-1 justify-between items-center">
            <h2 className="categories-title" style={{ margin: 0 }}>Categories</h2>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: isMobile ? '0.4rem 0.6rem' : '0.5rem 1rem'
              }}
            >
              <span>{showAddForm ? '✕' : '+'}</span>
              <span>{showAddForm ? 'Cancel' : (isMobile ? 'Add' : 'Add Category')}</span>
            </button>
          </div>
        </div>
        
        {showAddForm && (
          <div className="card mb-1" style={{ padding: isMobile ? '0.75rem' : '1rem' }}>
            <AddCategoryForm onSuccess={handleAddSuccess} />
          </div>
        )}
        
        {/* Advanced Filters */}
        <AdvancedFilters onFilterChange={handleFilterChange} />
        
        <div className="inventory-table-container card" style={{ padding: isMobile ? '0.5rem' : '1rem' }}>
          <CategoryTable 
            data={filteredData} 
            isLoading={isLoading} 
            error={error as Error | null} 
            onRetry={refetch}
          />
          
          {filteredData.length !== data.length && (
            <div className="text-center mt-1">
              <small>Showing {filteredData.length} of {data.length} categories</small>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InventoryTablePage