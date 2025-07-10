import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { useCategoryByQrCode } from '../hooks'
import QrScanner from '../components/scanner/QrScanner'
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
  
  // Fetch category data when QR code is scanned
  const { 
    data: scannedCategory, 
    isLoading, 
    error,
    refetch,
  } = useCategoryByQrCode(scannedQrCode || '', {
    enabled: !!scannedQrCode
  })
  
  // Function to handle clearing the scanned category
  const clearScannedCategory = () => {
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
  
  const handleScanAgain = () => {
    setScannedQrCode(null)
    setScanError(null)
    clearScannedCategory()
  }
  
  return (
    <div className="scanner-page-container">
      <h1>QR Scanner</h1>
      <p className="scanner-intro">
        Scan QR codes to quickly view item categories and manage inventory.
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
            <LoadingSpinner text="Loading category details..." />
          ) : error ? (
            <div>
              <ErrorDisplay 
                error={error instanceof Error ? error : new Error('Category not found')} 
                retry={refetch}
              />
              <div className="item-error-actions">
                <span className="error-hint">QR code may be invalid or category may have been removed.</span>
                <button onClick={handleScanAgain} className="secondary">
                  Scan New Category
                </button>
              </div>
            </div>
          ) : scannedCategory ? (
            <div className="card" style={{ borderRadius: '12px' }}>
              <div style={{
                backgroundColor: 'var(--primary-light)',
                padding: '12px',
                marginBottom: '15px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--primary)',
                  marginBottom: '5px'
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                  <h3 style={{ margin: '0' }}>Category Found</h3>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                }}>
                  <span style={{ color: 'var(--primary)' }}>{scannedCategory.name}</span>
                </div>
              </div>
              
              <dl style={{ 
                backgroundColor: 'var(--card-sectionning-background-color, var(--card-background-color))',
                padding: '15px',
                borderRadius: '8px',
                margin: '0 0 15px 0'
              }}>
                <div className="grid" style={{ 
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                  gap: isMobile ? '12px' : '15px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '2px',
                    padding: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    borderRadius: '6px'
                  }}>
                    <dt style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Total Items
                    </dt>
                    <dd style={{ fontSize: '1.5rem', margin: '0', fontWeight: 'bold' }}>
                      {scannedCategory.totalQuantity || 0}
                    </dd>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '2px',
                    padding: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    borderRadius: '6px'
                  }}>
                    <dt style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Low Stock Threshold
                    </dt>
                    <dd style={{ fontSize: '1.5rem', margin: '0', fontWeight: 'bold' }}>
                      {scannedCategory.lowStockThreshold}
                    </dd>
                  </div>
                  
                  {scannedCategory.description && (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '2px',
                      padding: '8px',
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      borderRadius: '6px',
                      gridColumn: isMobile ? '1' : '1 / -1'
                    }}>
                      <dt style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Description
                      </dt>
                      <dd style={{ fontSize: '1rem', margin: '0', fontWeight: '500' }}>
                        {scannedCategory.description}
                      </dd>
                    </div>
                  )}
                </div>
              </dl>
              
              <div className={isMobile ? 'flex-col gap-1' : 'flex gap-1'} style={{ display: 'flex', marginTop: '15px' }}>
                <Link 
                  to={`/categories/${scannedCategory.id}`} 
                  className="button primary"
                  style={{
                    flex: isMobile ? 'unset' : '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  View Category Details
                </Link>
                
                <Link 
                  to={`/items?categoryId=${scannedCategory.id}`} 
                  className="button"
                  style={{
                    flex: isMobile ? 'unset' : '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  View Items in Category
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center no-item-found">
              <p>No category found for this QR code.</p>
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
                View category details and manage items
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