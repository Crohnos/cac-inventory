import { useState, useRef } from 'react'
import { useImportData, useToastContext } from '../../hooks'
import CsvTemplateInfo from './CsvTemplateInfo'

interface ImportFormProps {
  onImportComplete?: () => void
}

interface ImportResult {
  successCount: number
  errorCount: number
  errors: string[]
}

const ImportForm = ({ onImportComplete }: ImportFormProps) => {
  const [file, setFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const importData = useImportData()
  const toast = useToastContext()
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      // Reset any previous import result
      setImportResult(null)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      toast.error('Please select a CSV file to import')
      return
    }
    
    try {
      const result = await importData.mutateAsync(file)
      setImportResult(result)
      
      if (result.successCount > 0) {
        toast.success(`Successfully imported ${result.successCount} item(s)`)
      }
      
      if (result.errorCount > 0) {
        toast.error(`Failed to import ${result.errorCount} item(s)`)
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setFile(null)
      
      // Call onImportComplete callback if provided
      if (onImportComplete) {
        onImportComplete()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to import data')
    }
  }
  
  const downloadTemplateCSV = () => {
    const headers = 'categoryName,sizeName,condition,location,receivedDate,donorInfo,approxPrice,isActive\n'
    const sampleData = 'Clothing,M,New,McKinney,2023-01-15,John Doe,10.50,Yes\nToys,,Gently Used,Plano,2023-01-20,Jane Smith,,Yes'
    const csvContent = headers + sampleData
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'inventory-import-template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="importFile">
          Select CSV File
          <input
            type="file"
            id="importFile"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleFileChange}
            required
          />
        </label>
        
        <div className="flex gap-1 mt-1">
          <button
            type="submit"
            disabled={!file || importData.isPending}
            className="primary"
          >
            {importData.isPending ? 'Importing...' : 'Upload and Import'}
          </button>
          
          <button
            type="button"
            onClick={downloadTemplateCSV}
            className="secondary"
          >
            Download Template
          </button>
        </div>
      </form>
      
      {importResult && (
        <div className="mt-1">
          <h3>Import Results</h3>
          <p>
            Successfully imported <strong>{importResult.successCount}</strong> item(s).
            {importResult.errorCount > 0 && (
              <span> Failed to import <strong>{importResult.errorCount}</strong> item(s).</span>
            )}
          </p>
          
          {importResult.errors.length > 0 && (
            <div className="mt-1">
              <h4>Errors</h4>
              <ul className="import-errors" style={{ color: 'var(--form-element-invalid-active-border-color)' }}>
                {importResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-1">
        <details>
          <summary>CSV Format Instructions</summary>
          <div className="p-1">
            <CsvTemplateInfo />
          </div>
        </details>
      </div>
    </div>
  )
}

export default ImportForm