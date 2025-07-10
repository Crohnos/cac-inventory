import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryService } from '../services'
import { 
  CreateItemCategoryRequest, 
  UpdateItemCategoryRequest
} from '../types/apiTypes'

// Query keys
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (filters: any) => [...categoryKeys.lists(), filters] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...categoryKeys.details(), id] as const,
  qrCode: (code: string) => [...categoryKeys.all, 'qrCode', code] as const,
  sizes: (categoryId: number) => [...categoryKeys.detail(categoryId), 'sizes'] as const,
}

// Hook for retrieving all categories
export const useCategories = () => {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: categoryService.getAllCategories
  })
}

// Hook for retrieving a single category
export const useCategory = (id: number) => {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => categoryService.getCategoryById(id),
    enabled: !!id // Only run if id is provided
  })
}

// Hook for retrieving a category by QR code
export const useCategoryByQrCode = (qrCodeValue: string, options = {}) => {
  return useQuery({
    queryKey: categoryKeys.qrCode(qrCodeValue),
    queryFn: () => categoryService.getCategoryByQrCode(qrCodeValue),
    enabled: !!qrCodeValue, // Only run if qrCodeValue is provided
    retry: false, // Don't retry if it fails (likely means the QR code doesn't exist)
    ...options
  })
}

// Hook for creating a new category
export const useCreateCategory = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateItemCategoryRequest) => categoryService.createCategory(data),
    onSuccess: () => {
      // Invalidate the categories list query
      queryClient.invalidateQueries({
        queryKey: categoryKeys.lists(),
      })
    },
  })
}

// Hook for updating a category
export const useUpdateCategory = (id: number) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: UpdateItemCategoryRequest) => categoryService.updateCategory(id, data),
    onSuccess: (updatedCategory) => {
      // Update the cache with the new data
      queryClient.setQueryData(
        categoryKeys.detail(id), 
        updatedCategory
      )
      
      // Invalidate the categories list
      queryClient.invalidateQueries({
        queryKey: categoryKeys.lists(),
      })
    },
  })
}

// Hook for deleting a category
export const useDeleteCategory = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => categoryService.deleteCategory(id),
    onSuccess: (_, id) => {
      // Remove the category from the cache
      queryClient.removeQueries({
        queryKey: categoryKeys.detail(id),
      })
      
      // Invalidate the categories list
      queryClient.invalidateQueries({
        queryKey: categoryKeys.lists(),
      })
    },
  })
}

// Hook for retrieving category sizes
export const useCategorySizes = (categoryId: number) => {
  return useQuery({
    queryKey: categoryKeys.sizes(categoryId),
    queryFn: () => categoryService.getCategorySizes(categoryId),
    enabled: !!categoryId && categoryId > 0 // Only run if categoryId is provided and valid
  })
}

// Hook for adding a size to a category
export const useAddSizeToCategory = (categoryId: number) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (sizeId: number) => categoryService.addSizeToCategory(categoryId, { sizeId }),
    onSuccess: () => {
      // Invalidate the category sizes query
      queryClient.invalidateQueries({
        queryKey: categoryKeys.sizes(categoryId),
      })
    },
  })
}

// Hook for removing a size from a category
export const useRemoveSizeFromCategory = (categoryId: number) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (sizeId: number) => categoryService.removeSizeFromCategory(categoryId, sizeId),
    onSuccess: () => {
      // Invalidate the category sizes query
      queryClient.invalidateQueries({
        queryKey: categoryKeys.sizes(categoryId),
      })
    },
  })
}