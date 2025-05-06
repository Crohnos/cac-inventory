import api from './api'
import { 
  Size, 
  CreateSizeRequest
} from '../types/apiTypes'

// Get all sizes
export const getAllSizes = async (): Promise<Size[]> => {
  const response = await api.get<Size[]>('/sizes')
  return response.data
}

// Get a size by ID
export const getSizeById = async (id: number): Promise<Size> => {
  const response = await api.get<Size>(`/sizes/${id}`)
  return response.data
}

// Create a new size
export const createSize = async (data: CreateSizeRequest): Promise<Size> => {
  const response = await api.post<Size>('/sizes', data)
  return response.data
}

// Update a size
export const updateSize = async (id: number, data: CreateSizeRequest): Promise<Size> => {
  const response = await api.put<Size>(`/sizes/${id}`, data)
  return response.data
}

// Delete a size
export const deleteSize = async (id: number): Promise<void> => {
  await api.delete(`/sizes/${id}`)
}