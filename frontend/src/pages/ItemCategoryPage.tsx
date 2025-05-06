import { useParams, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { CategoryParams } from '../types/routeTypes'
import { useCategory, useDetails, useToastContext } from '../hooks'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorDisplay from '../components/common/ErrorDisplay'
import CategoryHeader from '../components/category/CategoryHeader'
import CategorySizes from '../components/category/CategorySizes'
import CategoryItemsTable from '../components/category/CategoryItemsTable'

const ItemCategoryPage = () => {
  const { categoryId: categoryIdParam } = useParams({ from: '/categories/$categoryId' }) as CategoryParams
  const categoryId = parseInt(categoryIdParam)
  const toast = useToastContext()
  
  // Filter state
  const [locationFilter, setLocationFilter] = useState<string>('')
  
  // Fetch category data
  const { 
    data: category, 
    isLoading: isLoadingCategory, 
    error: categoryError,
    refetch: refetchCategory
  } = useCategory(categoryId)
  
  // Fetch items for this category
  const { 
    data: items = [], 
    isLoading: isLoadingItems, 
    error: itemsError,
    refetch: refetchItems
  } = useDetails({ 
    categoryId,
    location: locationFilter || undefined 
  })
  
  // Fetch items when the filter changes
  useEffect(() => {
    refetchItems()
  }, [locationFilter, refetchItems])
  
  // Handle errors
  useEffect(() => {
    if (categoryError) {
      toast.error('Failed to load category details')
    }
  }, [categoryError, toast])
  
  if (isLoadingCategory) {
    return <LoadingSpinner text="Loading category..." />
  }
  
  if (categoryError) {
    return <ErrorDisplay error={categoryError as Error} retry={refetchCategory} />
  }
  
  return (
    <div className="category-details-page">
      <header className="page-header">
        <h1>Category Details</h1>
      </header>
      
      {/* Category Header - Key Information */}
      <section className="category-info-section">
        <CategoryHeader 
          category={category!} 
          onRefresh={refetchCategory} 
        />
      </section>
      
      {/* Associated Sizes */}
      <section className="category-sizes-section">
        <CategorySizes categoryId={categoryId} />
      </section>
      
      {/* Items Table with Filters */}
      <section className="category-items-section">
        <div className="card">
          <div className="card-header">
            <div className="item-header-controls">
              <h3>Items in this Category</h3>
              
              <div className="header-actions">
                <div className="location-filter">
                  <select 
                    id="locationFilter"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="location-select"
                  >
                    <option value="">All Locations</option>
                    <option value="McKinney">McKinney</option>
                    <option value="Plano">Plano</option>
                  </select>
                  
                  {locationFilter && (
                    <button 
                      onClick={() => setLocationFilter('')}
                      className="clear-filter-btn"
                      aria-label="Clear location filter"
                    >
                      ×
                    </button>
                  )}
                </div>
                
                <Link to="/add" className="add-item-button">
                  <span className="add-icon">+</span> Add Item
                </Link>
              </div>
            </div>
          </div>
          
          <CategoryItemsTable 
            categoryId={categoryId}
            items={items} 
            isLoading={isLoadingItems} 
            error={itemsError as Error | null}
            onRetry={refetchItems}
          />
        </div>
      </section>
    </div>
  )
}

export default ItemCategoryPage