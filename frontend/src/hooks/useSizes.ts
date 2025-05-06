import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sizeService } from '../services'
import { CreateSizeRequest } from '../types/apiTypes'

// Query keys
export const sizeKeys = {
  all: ['sizes'] as const,
  lists: () => [...sizeKeys.all, 'list'] as const,
  list: (filters: any) => [...sizeKeys.lists(), filters] as const,
  details: () => [...sizeKeys.all, 'detail'] as const,
  detail: (id: number) => [...sizeKeys.details(), id] as const,
}

// Hook for retrieving all sizes
export const useSizes = () => {
  return useQuery({
    queryKey: sizeKeys.lists(),
    queryFn: sizeService.getAllSizes
  })
}

// Hook for retrieving a single size
export const useSize = (id: number) => {
  return useQuery({
    queryKey: sizeKeys.detail(id),
    queryFn: () => sizeService.getSizeById(id),
    enabled: !!id // Only run if id is provided
  })
}

// Hook for creating a new size
export const useCreateSize = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateSizeRequest) => sizeService.createSize(data),
    onSuccess: () => {
      // Invalidate the sizes list query
      queryClient.invalidateQueries({
        queryKey: sizeKeys.lists(),
      })
    },
  })
}

// Hook for updating a size
export const useUpdateSize = (id: number) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateSizeRequest) => sizeService.updateSize(id, data),
    onSuccess: (updatedSize) => {
      // Update the cache with the new data
      queryClient.setQueryData(
        sizeKeys.detail(id), 
        updatedSize
      )
      
      // Invalidate the sizes list
      queryClient.invalidateQueries({
        queryKey: sizeKeys.lists(),
      })
    },
  })
}

// Hook for deleting a size
export const useDeleteSize = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => sizeService.deleteSize(id),
    onSuccess: (_, id) => {
      // Remove the size from the cache
      queryClient.removeQueries({
        queryKey: sizeKeys.detail(id),
      })
      
      // Invalidate the sizes list
      queryClient.invalidateQueries({
        queryKey: sizeKeys.lists(),
      })
    },
  })
}