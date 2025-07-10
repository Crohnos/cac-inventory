import { useState, useEffect, useRef } from 'react'
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner'
import { useToastContext } from '../../hooks'
import './Scanner.css'

interface QrScannerProps {
  onScan: (result: string) => void
  onError?: (error: Error) => void
}

const QrScanner = ({ onScan, onError }: QrScannerProps) => {
  const [isCameraStarted, setIsCameraStarted] = useState(false)
  const [permission, setPermission] = useState<'granted' | 'denied' | 'pending'>('pending')
  const [isPaused, setIsPaused] = useState(false)
  const [sessionId] = useState(() => `scanner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  const toast = useToastContext()
  const scannerContainerRef = useRef<HTMLDivElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  // Flag to track if this is the first mount - defined outside useEffect
  const isFirstMount = useRef(true);
  
  // Check for camera permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Check if the browser supports mediaDevices
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setPermission('denied')
          // Only show toast on first mount
          if (isFirstMount.current) {
            toast.error('Camera access not supported in this browser')
            isFirstMount.current = false;
          }
          return
        }

        // Try to access the camera
        await navigator.mediaDevices.getUserMedia({ video: true })
        setPermission('granted')
      } catch (error) {
        console.error('Camera permission error:', error)
        setPermission('denied')
        // Only show toast on first mount
        if (isFirstMount.current) {
          toast.error('Camera access denied. Please enable camera permissions.')
          isFirstMount.current = false;
        }
      }
    }

    checkPermissions()
    
    // Cleanup function
    return () => {
      isFirstMount.current = false;
    }
  }, [toast])

  // Cleanup media streams on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          track.stop()
        })
      }
    }
  }, [])

  // Add session tracking for debugging
  useEffect(() => {
    console.log(`QR Scanner session started: ${sessionId}`)
    return () => {
      console.log(`QR Scanner session ended: ${sessionId}`)
    }
  }, [sessionId])

  const startCamera = () => {
    if (permission === 'granted') {
      setIsCameraStarted(true)
      setIsPaused(false)
      
      // Request fullscreen on mobile devices for better experience
      if (isMobileDevice() && scannerContainerRef.current && scannerContainerRef.current.requestFullscreen) {
        try {
          scannerContainerRef.current.requestFullscreen().catch(err => {
            console.log('Could not enter fullscreen mode:', err)
          })
        } catch (err) {
          console.log('Fullscreen request error:', err)
        }
      }
    } else {
      toast.error('Cannot start camera. Permission denied.')
    }
  }

  const stopCamera = () => {
    setIsCameraStarted(false)
    setIsPaused(false)
    
    // Cleanup media streams
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop()
      })
      mediaStreamRef.current = null
    }
    
    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => {
        console.log('Error exiting fullscreen:', err)
      })
    }
  }

  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  const handleScan = (detectedCodes: IDetectedBarcode[]) => {
    if (detectedCodes.length > 0) {
      const result = detectedCodes[0].rawValue
      
      // Temporarily pause scanning to prevent duplicate scans
      setIsPaused(true)
      
      console.log(`QR code scanned by session ${sessionId}:`, result)
      
      // Add enhanced visual feedback with haptic vibration for mobile
      const flashElement = document.createElement('div');
      flashElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--primary);
        opacity: 0.7;
        z-index: 9999;
        pointer-events: none;
        animation: flash 0.5s ease-out;
      `;
      
      // Add animation keyframes
      const styleSheet = document.createElement('style');
      styleSheet.textContent = `
        @keyframes flash {
          0% { opacity: 0.7; }
          100% { opacity: 0; }
        }
      `;
      document.head.appendChild(styleSheet);
      document.body.appendChild(flashElement);
      
      // Add haptic feedback (vibration) for mobile devices
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
      
      // Remove the flash effect after animation completes
      setTimeout(() => {
        document.body.removeChild(flashElement);
        document.head.removeChild(styleSheet);
      }, 500);
      
      onScan(result);
      stopCamera(); // Stop camera after successful scan
    }
  }

  const handleError = (error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`QR Scanner error in session ${sessionId}:`, error)
    toast.error('Error scanning QR code: ' + errorMessage)
    if (onError && error instanceof Error) onError(error)
  }

  return (
    <div className="scanner-container" ref={scannerContainerRef}>
      {isCameraStarted ? (
        <div className="qr-reader-container">
          <div className="camera-view">
            <Scanner
              onScan={handleScan}
              onError={handleError}
              paused={isPaused}
              constraints={{
                facingMode: 'environment',
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 }
              }}
              styles={{
                container: {
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0
                },
                video: {
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }
              }}
              scanDelay={300}
              allowMultiple={false}
            />
            {/* Improved scanner targeting UI with animated border */}
            <div className="targeting-box">
              {/* Corner markers for better targeting */}
              <div className="corner-marker corner-top-left" />
              <div className="corner-marker corner-top-right" />
              <div className="corner-marker corner-bottom-left" />
              <div className="corner-marker corner-bottom-right" />
            </div>
            
            {/* Scanning indicator */}
            <div className="scanning-indicator">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span className="indicator-dot"></span>
                {isPaused ? 'Processing...' : 'Scanning...'}
              </div>
            </div>
            
            {/* Helper text */}
            <div className="helper-text">
              Center QR code in box
            </div>
            
            {/* Session info for debugging */}
            <div className="session-info" style={{ 
              position: 'absolute', 
              bottom: '10px', 
              left: '10px', 
              fontSize: '10px', 
              color: 'rgba(255,255,255,0.7)', 
              backgroundColor: 'rgba(0,0,0,0.5)', 
              padding: '2px 6px', 
              borderRadius: '4px' 
            }}>
              Session: {sessionId.slice(-6)}
            </div>
          </div>
          
          <div className="flex gap-1">
            <button 
              onClick={stopCamera} 
              className="mt-1 primary camera-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="12" cy="12" r="5"></circle>
              </svg>
              Stop Camera
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div
            style={{
              width: '100%',
              height: '300px',
              backgroundColor: 'var(--card-sectionning-background-color)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--border-color)',
              borderRadius: '12px',
              padding: '20px',
              color: 'var(--color)'
            }}
          >
            {permission === 'pending' ? (
              <div className="text-center">
                <svg width="40" height="40" viewBox="0 0 24 24" style={{ margin: '0 auto 15px auto' }}>
                  <circle cx="12" cy="12" r="10" fill="none" stroke="var(--text-secondary)" strokeWidth="2" />
                  <circle cx="12" cy="12" r="4" fill="var(--text-secondary)" />
                </svg>
                <p>Checking camera permissions...</p>
              </div>
            ) : permission === 'denied' ? (
              <div className="text-center">
                <svg width="40" height="40" viewBox="0 0 24 24" style={{ margin: '0 auto 15px auto' }}>
                  <circle cx="12" cy="12" r="10" fill="none" stroke="var(--danger, #dd3333)" strokeWidth="2" />
                  <line x1="8" y1="8" x2="16" y2="16" stroke="var(--danger, #dd3333)" strokeWidth="2" />
                  <line x1="16" y1="8" x2="8" y2="16" stroke="var(--danger, #dd3333)" strokeWidth="2" />
                </svg>
                <p style={{ fontWeight: 'bold', color: 'var(--danger, #dd3333)' }}>Camera access denied</p>
                <p style={{ fontSize: '0.9em', marginTop: '10px' }}>Please enable camera access in your browser settings and reload this page.</p>
              </div>
            ) : (
              <div className="text-center">
                <svg width="50" height="50" viewBox="0 0 24 24" style={{ margin: '0 auto 15px auto' }}>
                  <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="var(--text-secondary)" strokeWidth="2" />
                  <circle cx="12" cy="12" r="3" fill="var(--text-secondary)" />
                  <line x1="12" y1="2" x2="12" y2="4" stroke="var(--text-secondary)" strokeWidth="2" />
                  <line x1="12" y1="20" x2="12" y2="22" stroke="var(--text-secondary)" strokeWidth="2" />
                  <line x1="2" y1="12" x2="4" y2="12" stroke="var(--text-secondary)" strokeWidth="2" />
                  <line x1="20" y1="12" x2="22" y2="12" stroke="var(--text-secondary)" strokeWidth="2" />
                </svg>
                <p style={{ fontWeight: 'bold' }}>Camera is ready</p>
                <p style={{ fontSize: '0.9em', marginTop: '10px' }}>Click "Start Camera" below to begin scanning</p>
              </div>
            )}
          </div>
          
          <div className="scanner-tips">
            <h4 className="tips-title">Tips for Best Scanning Results:</h4>
            <ul className="tips-list">
              <li>Hold your device steady</li>
              <li>Ensure QR code is well-lit</li>
              <li>Position code within the scanning frame</li>
              <li>For best results, hold phone in portrait mode</li>
            </ul>
          </div>
          
          <button
            onClick={startCamera}
            disabled={permission !== 'granted'}
            className="mt-1 primary camera-button"
          >
            {permission === 'granted' ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                Start Camera
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                </svg>
                Camera Not Available
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default QrScanner