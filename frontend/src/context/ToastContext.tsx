import { createContext, useContext, ReactNode } from 'react'
import useToast from '../hooks/useToast'
import ToastContainer from '../components/ToastContainer'

interface ToastContextType {
  success: (message: string) => number
  error: (message: string) => number
  info: (message: string) => number
  removeToast: (id: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const toast = useToast()
  
  return (
    <ToastContext.Provider
      value={{
        success: toast.success,
        error: toast.error,
        info: toast.info,
        removeToast: toast.removeToast,
      }}
    >
      {children}
      <ToastContainer
        toasts={toast.toasts}
        onClose={toast.removeToast}
      />
    </ToastContext.Provider>
  )
}

export const useToastContext = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}