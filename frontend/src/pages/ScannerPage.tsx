import { useState, useEffect } from 'react'
import { useDetailByQrCode } from '../hooks'
import QrScanner from '../components/scanner/QrScanner'
import ScannedItemResult from '../components/scanner/ScannedItemResult'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorDisplay from '../components/common/ErrorDisplay'
import '../components/scanner/Scanner.css'

const ScannerPage = () => {
  const [scannedQrCode, setScannedQrCode] = useState<string | null>(null)
  const [scanError, setScanError] = useState<Error | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  
  // Detect if user is on mobile
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      setIsMobile(mobileRegex.test(userAgent))
    }
    
    checkMobile()
    
    // Re-check on resize (orientation change)
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
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
    <div className="scanner-page-container">
      <h1>QR Scanner</h1>
      <p className="scanner-intro">
        Scan QR codes to quickly view and manage inventory items.
      </p>
      
      <article className="scanner-card">
        {!scannedQrCode ? (
          <QrScanner onScan={handleScan} onError={handleError} />
        ) : (
          <div className="text-center">
            <div className="scanned-result">
              <h3>QR Code Scanned Successfully</h3>
              <p className="qr-value">
                {scannedQrCode}
              </p>
            </div>
            <button 
              onClick={handleScanAgain} 
              className="primary camera-button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
              Scan Another Code
            </button>
          </div>
        )}
      </article>
      
      {scanError && (
        <article className="error-card">
          <ErrorDisplay error={scanError} />
          <button 
            onClick={handleScanAgain}
            className="camera-button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7l3 2.7"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7l-3-2.7"></path>
            </svg>
            Try Again
          </button>
        </article>
      )}
      
      {scannedQrCode && (
        <article className="scanner-card item-result-card">
          {isLoading ? (
            <LoadingSpinner text="Loading item details..." />
          ) : error ? (
            <div>
              <ErrorDisplay 
                error={error instanceof Error ? error : new Error('Item not found')} 
                retry={refetch}
              />
              <div className="item-error-actions">
                <span className="error-hint">QR code may be invalid or item may have been removed.</span>
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
            <div className="text-center no-item-found">
              <p>No item found for this QR code.</p>
              <button onClick={handleScanAgain} className="primary camera-button">
                Scan Another Code
              </button>
            </div>
          )}
        </article>
      )}
      
      {!scannedQrCode && !scanError && (
        <article className="instructions-card">
          <header>
            <h3>How to Use the Scanner</h3>
          </header>
          
          <div className="instructions-grid">
            <div className="instruction-step">
              <div className="step-number">1</div>
              <p className="step-text">
                Tap "Start Camera" to activate the scanner
              </p>
            </div>
            
            <div className="instruction-step">
              <div className="step-number">2</div>
              <p className="step-text">
                Position QR code in the highlighted box
              </p>
            </div>
            
            <div className="instruction-step">
              <div className="step-number">3</div>
              <p className="step-text">
                Hold steady until code is recognized
              </p>
            </div>
            
            <div className="instruction-step">
              <div className="step-number">4</div>
              <p className="step-text">
                View details and manage the item
              </p>
            </div>
          </div>
          
          <footer className="scanner-tips-footer">
            <div className="tips-heading">Tips for Mobile Scanning:</div>
            <ul className="tips-list">
              <li>Allow camera permissions when prompted</li>
              <li>Ensure good lighting conditions</li>
              <li>Hold your device steady for best results</li>
              <li>QR code should be clearly visible and undamaged</li>
              {isMobile && <li>For better viewing, rotate to landscape mode after scanning</li>}
            </ul>
          </footer>
        </article>
      )}
    </div>
  )
}

export default ScannerPage