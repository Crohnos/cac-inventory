import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importExportService } from '../services'
import { categoryKeys } from './useCategories'
import { detailKeys } from './useDetails'

// Hook for importing data from a CSV file
export const useImportData = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (file: File) => importExportService.importData(file),
    onSuccess: () => {
      // Invalidate all relevant queries since the import could affect multiple entities
      queryClient.invalidateQueries({
        queryKey: categoryKeys.lists(),
      })
      
      queryClient.invalidateQueries({
        queryKey: detailKeys.lists(),
      })
    },
  })
}

// Export data functions
export const exportAsCsv = () => importExportService.exportData('csv')
export const exportAsExcel = () => importExportService.exportData('xlsx')
export const exportAsTxt = () => importExportService.exportData('txt')