import { useState } from 'react'
import { useDetailByQrCode } from '../hooks'
import QrScanner from '../components/scanner/QrScanner'
import ScannedItemResult from '../components/scanner/ScannedItemResult'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorDisplay from '../components/common/ErrorDisplay'

const ScannerPage = () => {
  const [scannedQrCode, setScannedQrCode] = useState<string | null>(null)
  const [scanError, setScanError] = useState<Error | null>(null)
  
  // Fetch item data when QR code is scanned
  const { 
    data: scannedItem, 
    isLoading, 
    error,
    refetch,
    // Use an alternative approach to clear the query cache
    // since 'remove' is not available in the current version
    // of React Query
  } = useDetailByQrCode(scannedQrCode || '', {
    enabled: !!scannedQrCode
  })
  
  // Function to handle clearing the scanned item
  const clearScannedItem = () => {
    // Just clearing the state is sufficient as the query will
    // not be enabled without a valid QR code
    setScannedQrCode(null)
  }
  
  const handleScan = (qrCode: string) => {
    setScannedQrCode(qrCode)
    setScanError(null)
  }
  
  const handleError = (error: Error) => {
    setScanError(error)
  }
  
  const handleActionComplete = () => {
    refetch()
  }
  
  const handleScanAgain = () => {
    setScannedQrCode(null)
    setScanError(null)
    clearScannedItem()
  }
  
  return (
    <div>
      <h1>QR Scanner</h1>
      <p>Scan item QR codes to view details and perform actions.</p>
      
      <div className="card">
        {!scannedQrCode ? (
          <QrScanner onScan={handleScan} onError={handleError} />
        ) : (
          <div className="text-center">
            <h3>QR Code Scanned</h3>
            <p className="qr-value" style={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
              {scannedQrCode}
            </p>
            <button onClick={handleScanAgain} className="mt-1">
              Scan Another Code
            </button>
          </div>
        )}
      </div>
      
      {scanError && (
        <div className="card mt-1">
          <ErrorDisplay error={scanError} />
          <button onClick={handleScanAgain} className="mt-1">
            Try Again
          </button>
        </div>
      )}
      
      {scannedQrCode && (
        <div className="card mt-1">
          {isLoading ? (
            <LoadingSpinner text="Loading item details..." />
          ) : error ? (
            <div>
              <ErrorDisplay 
                error={error instanceof Error ? error : new Error('Item not found')} 
                retry={refetch}
              />
              <div className="flex justify-between mt-1">
                <span>QR code may be invalid or item may have been removed.</span>
                <button onClick={handleScanAgain} className="secondary">
                  Scan New Item
                </button>
              </div>
            </div>
          ) : scannedItem ? (
            <ScannedItemResult 
              item={scannedItem} 
              onActionComplete={handleActionComplete} 
            />
          ) : (
            <div className="text-center p-1">
              <p>No item found for this QR code.</p>
              <button onClick={handleScanAgain} className="mt-1">
                Scan Another Code
              </button>
            </div>
          )}
        </div>
      )}
      
      {!scannedQrCode && !scanError && (
        <div className="card mt-1">
          <h3>Scan Instructions</h3>
          <ol>
            <li>Click "Start Camera" to activate the QR code scanner</li>
            <li>Position the QR code within the camera view</li>
            <li>Hold steady until the code is recognized</li>
            <li>Once scanned, you can view details or perform actions on the item</li>
          </ol>
          <p><small>For best results, ensure good lighting and a clear view of the QR code.</small></p>
        </div>
      )}
    </div>
  )
}

export default ScannerPage