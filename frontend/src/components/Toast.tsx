import { useState, useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
}

const Toast = ({ message, type, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Allow time for fade-out animation
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [onClose])
  
  // Determine background color based on type
  const getBgColor = () => {
    switch (type) {
      case 'success': return 'var(--pico-color-success-background)'
      case 'error': return 'var(--pico-color-danger-background)'
      case 'info': return 'var(--pico-color-info-background)'
      default: return 'var(--pico-color-info-background)'
    }
  }
  
  // Determine text color based on type
  const getTextColor = () => {
    switch (type) {
      case 'success': return 'var(--pico-color-success-text)'
      case 'error': return 'var(--pico-color-danger-text)'
      case 'info': return 'var(--pico-color-info-text)'
      default: return 'var(--pico-color-info-text)'
    }
  }
  
  return (
    <div 
      role="alert"
      style={{
        position: 'relative',
        padding: '1rem',
        margin: '0.5rem 0',
        borderRadius: '0.25rem',
        backgroundColor: getBgColor(),
        color: getTextColor(),
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 300ms ease-in-out',
        cursor: 'pointer',
      }}
      onClick={onClose}
    >
      {message}
      <button 
        aria-label="Close" 
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.2rem',
          padding: '0',
          margin: '0',
          color: 'inherit',
        }}
      >
        &times;
      </button>
    </div>
  )
}

export default Toast