import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bulkCreateDetails, bulkDeactivateDetails, bulkTransferDetails } from '../services/detailService'

export interface BulkCreateInput {
  categoryId: number
  quantity: number
  location: 'McKinney' | 'Plano'
  sizeId?: number | null
}

export interface BulkDeactivateInput {
  categoryId: number
  quantity: number
  location: 'McKinney' | 'Plano'
}

export interface BulkTransferInput {
  categoryId: number
  quantity: number
  fromLocation: 'McKinney' | 'Plano'
  toLocation: 'McKinney' | 'Plano'
}

export interface BulkOperationResult {
  success: boolean
  message: string
  createdCount?: number
  deactivatedCount?: number
  transferredCount?: number
}

export const useBulkCreateItems = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: BulkCreateInput) => {
      const response = await bulkCreateDetails(data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-details'] })
      queryClient.invalidateQueries({ queryKey: ['item-categories'] })
    }
  })
}

export const useBulkDeactivateItems = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: BulkDeactivateInput) => {
      const response = await bulkDeactivateDetails(data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-details'] })
      queryClient.invalidateQueries({ queryKey: ['item-categories'] })
    }
  })
}

export const useBulkTransferItems = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: BulkTransferInput) => {
      const response = await bulkTransferDetails(data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-details'] })
      queryClient.invalidateQueries({ queryKey: ['item-categories'] })
    }
  })
}