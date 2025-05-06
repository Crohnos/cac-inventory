import api from './api'

// Export inventory data
export const exportData = (format: 'csv' | 'xlsx' | 'txt'): void => {
  // Create a download link and click it
  const link = document.createElement('a')
  link.href = `/api/export?format=${format}`
  link.download = `inventory-export.${format}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Import inventory data from a CSV file
export const importData = async (file: File): Promise<{ 
  successCount: number, 
  errorCount: number, 
  errors: string[] 
}> => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await api.post<{ 
    successCount: number, 
    errorCount: number, 
    errors: string[] 
  }>('/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  
  return response.data
}