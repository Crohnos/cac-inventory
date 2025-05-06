import React from 'react'

interface ErrorDisplayProps {
  error: Error | string
  retry?: () => void
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, retry }) => {
  const errorMessage = typeof error === 'string' ? error : error.message
  
  return (
    <div
      style={{
        padding: '1rem',
        border: '1px solid var(--pico-color-danger-background)',
        borderRadius: '0.25rem',
        backgroundColor: 'var(--pico-color-danger-background)',
        color: 'var(--pico-color-danger-text)',
        marginBottom: '1rem',
      }}
    >
      <h4>Error</h4>
      <p>{errorMessage}</p>
      {retry && (
        <button onClick={retry} className="secondary" style={{ marginTop: '0.5rem' }}>
          Try Again
        </button>
      )}
    </div>
  )
}

export default ErrorDisplay