import api from './api'
import { 
  ItemDetail, 
  CreateItemDetailRequest,
  UpdateItemDetailRequest,
  ItemTransferRequest
} from '../types/apiTypes'

// Get all item details with optional filtering
export const getAllDetails = async (
  filters?: { 
    categoryId?: number, 
    location?: string, 
    isActive?: boolean 
  }
): Promise<ItemDetail[]> => {
  const response = await api.get<ItemDetail[]>('/item-details', { params: filters })
  return response.data
}

// Get an item detail by ID
export const getDetailById = async (id: number): Promise<ItemDetail> => {
  const response = await api.get<ItemDetail>(`/item-details/${id}`)
  return response.data
}


// Create a new item detail
export const createDetail = async (data: CreateItemDetailRequest): Promise<ItemDetail> => {
  const response = await api.post<ItemDetail>('/item-details', data)
  return response.data
}

// Update an item detail
export const updateDetail = async (id: number, data: UpdateItemDetailRequest): Promise<ItemDetail> => {
  const response = await api.put<ItemDetail>(`/item-details/${id}`, data)
  return response.data
}

// Deactivate an item detail
export const deactivateDetail = async (id: number): Promise<{ message: string }> => {
  const response = await api.patch<{ message: string }>(`/item-details/${id}/deactivate`, {})
  return response.data
}

// Transfer an item to a new location
export const transferDetail = async (id: number, data: ItemTransferRequest): Promise<{ 
  message: string, 
  previousLocation: string, 
  newLocation: string 
}> => {
  const response = await api.patch<{ 
    message: string, 
    previousLocation: string, 
    newLocation: string 
  }>(`/item-details/${id}/transfer`, data)
  return response.data
}

// Bulk operations
export const bulkCreateDetails = async (data: {
  categoryId: number
  quantity: number
  location: 'McKinney' | 'Plano'
  sizeId?: number | null
}): Promise<{
  success: boolean
  message: string
  createdCount: number
  items: ItemDetail[]
}> => {
  const response = await api.post('/item-details/bulk-create', data)
  return response.data
}

export const bulkDeactivateDetails = async (data: {
  categoryId: number
  quantity: number
  location: 'McKinney' | 'Plano'
}): Promise<{
  success: boolean
  message: string
  deactivatedCount: number
}> => {
  const response = await api.post('/item-details/bulk-deactivate', data)
  return response.data
}

export const bulkTransferDetails = async (data: {
  categoryId: number
  quantity: number
  fromLocation: 'McKinney' | 'Plano'
  toLocation: 'McKinney' | 'Plano'
}): Promise<{
  success: boolean
  message: string
  transferredCount: number
}> => {
  const response = await api.post('/item-details/bulk-transfer', data)
  return response.data
}