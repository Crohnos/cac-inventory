import React from 'react'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  color?: string
  text?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color = 'var(--primary)',
  text = 'Loading...'
}) => {
  // Determine the size in pixels
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60
  }
  
  const pixelSize = sizeMap[size]
  
  return (
    <div className="text-center p-1">
      <div
        style={{
          display: 'inline-block',
          width: `${pixelSize}px`,
          height: `${pixelSize}px`,
          margin: '0 auto',
          border: `${pixelSize / 8}px solid ${color}`,
          borderBottomColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      {text && <p style={{ marginTop: '1rem' }}>{text}</p>}
      
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

export default LoadingSpinner