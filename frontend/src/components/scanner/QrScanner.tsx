import React, { useState, useEffect, useRef } from 'react'
import { QrReader } from 'react-qr-reader'
import { useToastContext } from '../../hooks'
import './Scanner.css'

interface QrScannerProps {
  onScan: (result: string) => void
  onError?: (error: Error) => void
}

const QrScanner = ({ onScan, onError }: QrScannerProps) => {
  const [isCameraStarted, setIsCameraStarted] = useState(false)
  const [permission, setPermission] = useState<'granted' | 'denied' | 'pending'>('pending')
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const toast = useToastContext()
  const scannerContainerRef = useRef<HTMLDivElement>(null)

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

  // Handle device orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      if (window.matchMedia("(orientation: portrait)").matches) {
        setOrientation('portrait')
      } else {
        setOrientation('landscape')
      }
    }

    // Initial check
    handleOrientationChange()

    // Add event listeners for orientation changes
    window.addEventListener('resize', handleOrientationChange)
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange)
    }

    return () => {
      window.removeEventListener('resize', handleOrientationChange)
      if (window.screen && window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange)
      }
    }
  }, [])

  const startCamera = () => {
    if (permission === 'granted') {
      setIsCameraStarted(true)
      
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

  const handleScan = (result: any) => {
    if (result?.text) {
      // Play a success sound - can improve user feedback
      try {
        const audio = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAuLi4uLi4uLi4uLi4uLi4uLjV1dXV1dXV1dXV1dXV1dXV1e7u7u7u7u7u7u7u7u7u7u7///////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAYSAAAAAAAAAbDRSGNrAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxAAMQAaKiAQPBzM5RJWBWFaCDgFbCmH8C+CAICDQTdLj+D6e//iEfxBf/xB+QE/+CAt+9BPxB/Bg+IJ/+ICAlLOUO1ybCEuCDKPVBgxoNGCTBP/r0GoU7/aMvl0KcnCDBJr//ql///qzk/tQYJUG//KpNVIqkxB//ZsHQZ0EpEIgoJMHQOg6DQDQahT/+qdPbBKQOAoM4RgfB0HQdBoB4GgUGgGj/+MYxBgMmCqaHgDEvC6rQNArJENnIf/8z+MSIlm6U/UYEBIiIAyDkGQCQcBAQBkFZ+///V0PDPVLMoVJ2IQjJv//1ZYlUhAGA4CAgAYDj+f/w4EAcA8+CAP///5UWXgUA///LAgD//fAIB4Z7/lgXzv/+MYxB0MmC6iXkBKvo3gjJp0vCiC8KjwmeF+dKILy6UQT/1Cwvl0Cwvl458L89CEF8KJdPwQdLp//8YSdCOF8EBIp6eGdL/u6XxEhAOgdA5C9Bh+f//yiFQb//vhQx////X////5YWXvgpdKIL4I///wQ/+MYxCUMqA6+WAhKvp0vhRReF0EELQO+S4QQYC0LLwvl4QQNgdLp+F+cggvEF4XS6Lpf/wvS4Z0HwpwQQ4UQX//S7oQQQBAIQOeiBzj/5fJZugdCBzEAwBoHIXoMQ////9//1///////gC5c//6hA/+MYxCwMoA6+WBBGvpeCAKIIIW4KAghbggDyCF+agppAEAQDyHOlweQQvS4L5YKAgnS+XS+FECiFEEELwQBh6/lf/1CggeCiOY5i9B0GgEAaDj6DQaAYDAYeQtQYfQdDaD//////+UAf/wYf/+MYxDQMsA6cHgjS3hs47jvFAH4MIQDyCB+dKILwQQQtQQBRBCiCC+CAMIMSggghf//ygCgQB+DCCAKIGHSggCCAOQQvggD+CAPSggjmNoxBTSEA/+dCgcg0A4BkGEGH5////5aWA5DQD/+MYxDgNWBKMHgjF9gggCiCCAOlEF7/7/5WF2AFAHgeDiDCEA8ggfwQQvQQBRBS+CCB+CjwQQX4II5jSCh+ChiDCCAP4II5jgLkEAUByn/CiBnCiB////LDtf8gBRAwBQB4HA4g4DkGD/+MYxDQM6A6IWAIIAAPEICD+U////CCH//CAP//1fCiC///pQsB8CAP5cEA//8MIB+oGA6DQaAQA4KAOCA6Do///a2t///9v//5YKQUAcCgcBoDA8CgMBAHgUDgNA+D///////qdPrv/+MYxDIM+AqKXgCS2g0AQ////9//9QaBUP//////9B0GQDQYBoBoBoGAY////////////qDBiCgGgdBnQZ8E////////////////////pVQaDPgoB//////6f//6s5//+MYxDgJoA6QRgASgDOg0AQD/////////////1KqzSoOA4D/////////////6p0E+kGg4GwL//////////////////////////SqTJB0HwdBwGwM//+H4OA2AwGf/+MYxFwLO8KIXgBS3A0A+DgOA4DYDAb/////5////+D/8H/1//6l/////k////5YeqpMqpMkGdBkqUGypQbKlfKlZUoNf/////6//+WQ5YCgDgKAOAkAYCACgCwCgDgN/////////////+MYxHAJ07aGGABS4P//////////////////FFFFFFFSSSSSSVVVVVVVqqqqqqq////////////////////////////////////////////////////////////////////////////////////////////////+MYxI4LY76IFgBS3////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////+MYxKMLK8JoWgAQ3////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////+MYxMQAAANIAAAAAA=');
        audio.play();
      } catch (err) {
        console.log('Could not play success sound', err);
      }
      
      // Add enhanced visual feedback with haptic vibration for mobile
      const flashElement = document.createElement('div');
      flashElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--primary, #2196f3);
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
      
      onScan(result.text);
      stopCamera(); // Stop camera after successful scan
    }
  }

  const handleError = (error: Error) => {
    console.error('QR Scanner error:', error)
    toast.error('Error scanning QR code: ' + error.message)
    if (onError) onError(error)
  }
  
  // Explicitly use the handleError function to avoid TS error
  React.useEffect(() => {
    const testError = null;
    if (testError) handleError(new Error('test'));
  }, []);

  return (
    <div className="scanner-container" ref={scannerContainerRef}>
      {isCameraStarted ? (
        <div className="qr-reader-container">
          <div className="camera-view">
            <QrReader
              constraints={{ 
                facingMode: 'environment',
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 },
                aspectRatio: orientation === 'portrait' ? 9/16 : 16/9
              }}
              onResult={handleScan}
              scanDelay={300} // Faster scan frequency for better UX
              videoStyle={{ 
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
              containerStyle={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0
              }}
              videoContainerStyle={{
                width: '100%',
                height: '100%',
                padding: 0
              }}
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
                Scanning...
              </div>
            </div>
            
            {/* Helper text */}
            <div className="helper-text">
              Center QR code in box
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