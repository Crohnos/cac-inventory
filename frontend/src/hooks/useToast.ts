import { useState, useCallback, useEffect } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

// Simple toast notification hook
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([])
  
  // Add a new toast with deduplication
  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now()
    
    // Check if this message already exists to prevent duplicates
    setToasts(prev => {
      // If we already have this exact message and type, don't add it again
      const isDuplicate = prev.some(toast => 
        toast.message === message && 
        toast.type === type
      );
      
      if (isDuplicate) {
        return prev;
      }
      
      return [...prev, { id, message, type }];
    })
    
    return id
  }, [])
  
  // Remove a toast by id
  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])
  
  // Shorthand functions
  const success = useCallback((message: string) => addToast(message, 'success'), [addToast])
  const error = useCallback((message: string) => addToast(message, 'error'), [addToast])
  const info = useCallback((message: string) => addToast(message, 'info'), [addToast])
  
  // Auto-remove toasts after a delay
  useEffect(() => {
    if (toasts.length === 0) return
    
    const timeoutId = setTimeout(() => {
      setToasts(prev => {
        if (prev.length === 0) return prev
        return prev.slice(1)
      })
    }, 5000)
    
    return () => clearTimeout(timeoutId)
  }, [toasts])
  
  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info
  }
}

export default useToast