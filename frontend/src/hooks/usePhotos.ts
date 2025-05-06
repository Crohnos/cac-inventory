import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { photoService } from '../services'

// Query keys
export const photoKeys = {
  all: ['photos'] as const,
  lists: () => [...photoKeys.all, 'list'] as const,
  list: (itemDetailId: number) => [...photoKeys.lists(), itemDetailId] as const,
}

// Hook for retrieving all photos for an item
export const useItemPhotos = (itemDetailId: number) => {
  return useQuery({
    queryKey: photoKeys.list(itemDetailId),
    queryFn: () => photoService.getPhotosForItem(itemDetailId),
    enabled: !!itemDetailId // Only run if itemDetailId is provided
  })
}

// Hook for uploading a photo for an item
export const useUploadPhoto = (itemDetailId: number) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      file, 
      description 
    }: { 
      file: File, 
      description?: string 
    }) => photoService.uploadPhoto(itemDetailId, file, description),
    onSuccess: () => {
      // Invalidate the photos list for this item
      queryClient.invalidateQueries({
        queryKey: photoKeys.list(itemDetailId),
      })
    },
  })
}

// Hook for deleting a photo
export const useDeletePhoto = (itemDetailId: number) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (photoId: number) => photoService.deletePhoto(photoId),
    onSuccess: () => {
      // Invalidate the photos list for this item
      queryClient.invalidateQueries({
        queryKey: photoKeys.list(itemDetailId),
      })
    },
  })
}