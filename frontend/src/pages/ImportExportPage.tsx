import { useState } from 'react'
import { useCategories, useDetails } from '../hooks'
import ExportOptions from '../components/importexport/ExportOptions'
import ImportForm from '../components/importexport/ImportForm'

const ImportExportPage = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Fetch data to invalidate cache after import
  useCategories()
  useDetails()
  
  const handleImportComplete = () => {
    // Trigger a refresh of data
    setRefreshTrigger(prev => prev + 1)
  }
  
  return (
    <div className="import-export-page">
      <h1>Import/Export</h1>
      <p>Export your inventory in various formats or import items from CSV files.</p>
      
      {/* Export Data Section - Now on top */}
      <div className="card mb-2">
        <h2>Export Data</h2>
        <ExportOptions />
      </div>
      
      {/* Import Data Section - Now below Export */}
      <div className="card">
        <h2>Import Data</h2>
        <ImportForm onImportComplete={handleImportComplete} />
      </div>
    </div>
  )
}

export default ImportExportPage