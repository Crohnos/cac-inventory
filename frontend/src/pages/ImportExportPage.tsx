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
    <div>
      <h1>Import/Export</h1>
      <p>Import items from CSV files or export your inventory in various formats.</p>
      
      <div className="grid grid-responsive" style={{ 
        '--grid-spacing': '2rem',
        '--grid-template-columns': '1fr 1fr',
        '--grid-template-columns-md': '1fr'
       } as React.CSSProperties}>
        <div className="card">
          <h2>Export Data</h2>
          <ExportOptions />
        </div>
        
        <div className="card">
          <h2>Import Data</h2>
          <ImportForm onImportComplete={handleImportComplete} />
        </div>
      </div>
    </div>
  )
}

export default ImportExportPage