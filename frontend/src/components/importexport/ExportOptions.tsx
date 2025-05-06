import { useToastContext } from '../../hooks'
import { exportAsCsv, exportAsExcel, exportAsTxt } from '../../hooks/useImportExport'

const ExportOptions = () => {
  const toast = useToastContext()

  const handleExport = (format: 'csv' | 'xlsx' | 'txt') => {
    try {
      switch (format) {
        case 'csv':
          exportAsCsv()
          break
        case 'xlsx':
          exportAsExcel()
          break
        case 'txt':
          exportAsTxt()
          break
      }
      toast.success(`Export as ${format.toUpperCase()} started`)
    } catch (error: any) {
      toast.error(`Failed to export as ${format.toUpperCase()}: ${error.message}`)
    }
  }

  return (
    <div>
      <p>Select a format to export your inventory data.</p>
      
      <div className="flex gap-1 flex-wrap mt-1">
        <button onClick={() => handleExport('csv')} className="export-button">
          Export as CSV
        </button>
        <button onClick={() => handleExport('xlsx')} className="export-button">
          Export as Excel
        </button>
        <button onClick={() => handleExport('txt')} className="export-button">
          Export as TXT
        </button>
      </div>
      
      <div className="mt-1">
        <h4>File Format Information</h4>
        <ul>
          <li><strong>CSV</strong> - Comma Separated Values, suitable for importing into spreadsheet programs.</li>
          <li><strong>Excel</strong> - Microsoft Excel format with separate sheets for items and categories.</li>
          <li><strong>TXT</strong> - Tab-delimited text file, compatible with most text editors and spreadsheet programs.</li>
        </ul>
      </div>
    </div>
  )
}

export default ExportOptions