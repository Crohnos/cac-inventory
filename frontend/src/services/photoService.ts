import api from './api'
import { ItemPhoto } from '../types/apiTypes'

// Get all photos for an item
export const getPhotosForItem = async (itemDetailId: number): Promise<ItemPhoto[]> => {
  const response = await api.get<ItemPhoto[]>(`/item-details/${itemDetailId}/photos`)
  return response.data
}

// Upload a photo for an item
export const uploadPhoto = async (
  itemDetailId: number, 
  photoFile: File, 
  description?: string
): Promise<ItemPhoto> => {
  const formData = new FormData()
  formData.append('photo', photoFile)
  
  if (description) {
    formData.append('description', description)
  }
  
  const response = await api.post<ItemPhoto>(
    `/item-details/${itemDetailId}/photos`, 
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  
  return response.data
}

// Delete a photo
export const deletePhoto = async (photoId: number): Promise<void> => {
  await api.delete(`/photos/${photoId}`)
}