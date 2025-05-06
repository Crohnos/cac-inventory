import { useState, useMemo } from 'react'
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
  
  return (
    <div>
      <h1>Inventory</h1>
      <p>Manage your inventory categories and track stock levels.</p>
      
      <div className="mb-1">
        <div className="flex justify-between items-center mb-1">
          <h2>Categories</h2>
          <button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : 'Add New Category'}
          </button>
        </div>
        
        {showAddForm && (
          <div className="card mb-1">
            <AddCategoryForm onSuccess={handleAddSuccess} />
          </div>
        )}
        
        {/* Advanced Filters */}
        <AdvancedFilters onFilterChange={handleFilterChange} />
        
        <div className="card">
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