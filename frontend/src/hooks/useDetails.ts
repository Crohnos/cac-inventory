import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { detailService } from '../services'
import { 
  CreateItemDetailRequest, 
  UpdateItemDetailRequest, 
  ItemTransferRequest 
} from '../types/apiTypes'
import { categoryKeys } from './useCategories'

// Query keys
export const detailKeys = {
  all: ['details'] as const,
  lists: () => [...detailKeys.all, 'list'] as const,
  list: (filters: any) => [...detailKeys.lists(), filters] as const,
  details: () => [...detailKeys.all, 'detail'] as const,
  detail: (id: number) => [...detailKeys.details(), id] as const,
  qrCode: (code: string) => [...detailKeys.all, 'qrCode', code] as const,
}

// Hook for retrieving all item details with optional filtering
export const useDetails = (filters?: { 
  categoryId?: number, 
  location?: string, 
  isActive?: boolean 
}) => {
  return useQuery({
    queryKey: detailKeys.list(filters),
    queryFn: () => detailService.getAllDetails(filters)
  })
}

// Hook for retrieving a single item detail
export const useDetail = (id: number) => {
  return useQuery({
    queryKey: detailKeys.detail(id),
    queryFn: () => detailService.getDetailById(id),
    enabled: !!id // Only run if id is provided
  })
}

// Hook for retrieving an item detail by QR code
export const useDetailByQrCode = (qrCodeValue: string, options = {}) => {
  return useQuery({
    queryKey: detailKeys.qrCode(qrCodeValue),
    queryFn: () => detailService.getDetailByQrCode(qrCodeValue),
    enabled: !!qrCodeValue, // Only run if qrCodeValue is provided
    retry: false, // Don't retry if it fails (likely means the QR code doesn't exist)
    ...options
  })
}

// Hook for creating a new item detail
export const useCreateDetail = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateItemDetailRequest) => detailService.createDetail(data),
    onSuccess: (newDetail) => {
      // Invalidate the details list and related category queries
      queryClient.invalidateQueries({
        queryKey: detailKeys.lists(),
      })
      
      // Invalidate the category to update its totalQuantity
      if (newDetail.itemCategoryId) {
        queryClient.invalidateQueries({
          queryKey: categoryKeys.detail(newDetail.itemCategoryId),
        })
        
        queryClient.invalidateQueries({
          queryKey: categoryKeys.lists(),
        })
      }
    },
  })
}

// Hook for updating an item detail
export const useUpdateDetail = (id: number) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: UpdateItemDetailRequest) => detailService.updateDetail(id, data),
    onSuccess: (updatedDetail) => {
      // Update the cache with the new data
      queryClient.setQueryData(
        detailKeys.detail(id), 
        updatedDetail
      )
      
      // Invalidate lists that might include this item
      queryClient.invalidateQueries({
        queryKey: detailKeys.lists(),
      })
      
      // If the category changed, invalidate both the old and new category
      const previousData = queryClient.getQueryData<any>(detailKeys.detail(id))
      if (previousData && previousData.itemCategoryId !== updatedDetail.itemCategoryId) {
        queryClient.invalidateQueries({
          queryKey: categoryKeys.detail(previousData.itemCategoryId),
        })
      }
      
      // Invalidate the current category to update its totalQuantity
      if (updatedDetail.itemCategoryId) {
        queryClient.invalidateQueries({
          queryKey: categoryKeys.detail(updatedDetail.itemCategoryId),
        })
        
        queryClient.invalidateQueries({
          queryKey: categoryKeys.lists(),
        })
      }
    },
  })
}

// Hook for deactivating an item detail
export const useDeactivateDetail = (id: number) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => detailService.deactivateDetail(id),
    onSuccess: () => {
      // Get the item data to know which category to invalidate
      const previousData = queryClient.getQueryData<any>(detailKeys.detail(id))
      
      // Invalidate the detail
      queryClient.invalidateQueries({
        queryKey: detailKeys.detail(id),
      })
      
      // Invalidate lists that might include this item
      queryClient.invalidateQueries({
        queryKey: detailKeys.lists(),
      })
      
      // Invalidate the category to update its totalQuantity
      if (previousData && previousData.itemCategoryId) {
        queryClient.invalidateQueries({
          queryKey: categoryKeys.detail(previousData.itemCategoryId),
        })
        
        queryClient.invalidateQueries({
          queryKey: categoryKeys.lists(),
        })
      }
    },
  })
}

// Hook for transferring an item to a new location
export const useTransferDetail = (id: number) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: ItemTransferRequest) => detailService.transferDetail(id, data),
    onSuccess: () => {
      // Invalidate the detail
      queryClient.invalidateQueries({
        queryKey: detailKeys.detail(id),
      })
      
      // Invalidate lists that might include this item
      queryClient.invalidateQueries({
        queryKey: detailKeys.lists(),
      })
    },
  })
}