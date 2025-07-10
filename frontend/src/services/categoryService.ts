import api from './api'
import { 
  ItemCategory, 
  CreateItemCategoryRequest,
  UpdateItemCategoryRequest,
  CategorySizeRequest,
  Size
} from '../types/apiTypes'

// Get all categories
export const getAllCategories = async (): Promise<ItemCategory[]> => {
  const response = await api.get<ItemCategory[]>('/item-categories')
  return response.data
}

// Get a category by ID
export const getCategoryById = async (id: number): Promise<ItemCategory> => {
  const response = await api.get<ItemCategory>(`/item-categories/${id}`)
  return response.data
}

// Get a category by QR code
export const getCategoryByQrCode = async (qrCodeValue: string): Promise<ItemCategory> => {
  const response = await api.get<ItemCategory>(`/item-categories/qr/${qrCodeValue}`)
  return response.data
}

// Create a new category
export const createCategory = async (data: CreateItemCategoryRequest): Promise<ItemCategory> => {
  const response = await api.post<ItemCategory>('/item-categories', data)
  return response.data
}

// Update a category
export const updateCategory = async (id: number, data: UpdateItemCategoryRequest): Promise<ItemCategory> => {
  const response = await api.put<ItemCategory>(`/item-categories/${id}`, data)
  return response.data
}

// Delete a category
export const deleteCategory = async (id: number): Promise<void> => {
  await api.delete(`/item-categories/${id}`)
}

// Get all sizes for a category
export const getCategorySizes = async (categoryId: number): Promise<Size[]> => {
  const response = await api.get<Size[]>(`/item-categories/${categoryId}/sizes`)
  return response.data
}

// Add a size to a category
export const addSizeToCategory = async (categoryId: number, data: CategorySizeRequest): Promise<Size> => {
  const response = await api.post<Size>(`/item-categories/${categoryId}/sizes`, data)
  return response.data
}

// Remove a size from a category
export const removeSizeFromCategory = async (categoryId: number, sizeId: number): Promise<void> => {
  await api.delete(`/item-categories/${categoryId}/sizes/${sizeId}`)
}