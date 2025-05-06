import { useEffect, useState } from 'react'
import { useCategory } from './useCategories'
import { useDetail } from './useDetails'

export type BreadcrumbItem = {
  label: string
  to?: string
}

/**
 * Hook to get enhanced breadcrumb information based on route parameters
 */
export const useBreadcrumbs = (
  pathname: string,
  params: Record<string, string> = {}
): BreadcrumbItem[] => {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])
  
  // Extract IDs from params
  const categoryId = params.categoryId ? parseInt(params.categoryId) : undefined
  const itemId = params.itemId ? parseInt(params.itemId) : undefined
  
  // Fetch category data if needed
  const { data: category } = useCategory(categoryId || 0)
  
  // Fetch item data if needed
  const { data: item } = useDetail(itemId || 0)
  
  // Generate breadcrumbs based on pathname and data
  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean)
    const result: BreadcrumbItem[] = []
    
    if (segments.length === 0) {
      setBreadcrumbs([])
      return
    }
    
    if (segments[0] === 'categories' && segments.length > 1) {
      // Category page
      result.push({ 
        label: category ? category.name : `Category #${categoryId}`,
        to: `/categories/${categoryId}`
      })
    } else if (segments[0] === 'items' && segments.length > 1) {
      // Item page - include category if available
      if (item && item.categoryName) {
        result.push({
          label: item.categoryName,
          to: `/categories/${item.itemCategoryId}`
        })
      }
      
      result.push({ 
        label: item ? `Item #${item.id}` : `Item #${itemId}`,
        to: `/items/${itemId}`
      })
    } else if (segments[0] === 'add') {
      result.push({ 
        label: 'Add New Donation',
        to: '/add'
      })
    } else if (segments[0] === 'scan') {
      result.push({ 
        label: 'Scan Items',
        to: '/scan'
      })
    } else if (segments[0] === 'import-export') {
      result.push({ 
        label: 'Import/Export',
        to: '/import-export'
      })
    }
    
    setBreadcrumbs(result)
  }, [pathname, category, item, categoryId, itemId])
  
  return breadcrumbs
}