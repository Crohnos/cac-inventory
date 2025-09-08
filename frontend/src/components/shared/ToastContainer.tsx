import React from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useUIStore, type Toast } from '../../stores/uiStore';

const ToastIcon: React.FC<{ type: Toast['type'] }> = ({ type }) => {
  const className = "h-5 w-5";
  
  switch (type) {
    case 'success':
      return <CheckCircle className={`${className} text-green-500`} />;
    case 'error':
      return <XCircle className={`${className} text-red-500`} />;
    case 'warning':
      return <AlertTriangle className={`${className} text-yellow-500`} />;
    case 'info':
    default:
      return <Info className={`${className} text-blue-500`} />;
  }
};

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const { removeToast } = useUIStore();
  
  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  }[toast.type];
  
  return (
    <div className={`${bgColor} border rounded-lg p-4 shadow-sm max-w-sm w-full`}>
      <div className="flex items-start">
        <ToastIcon type={toast.type} />
        <div className="ml-3 flex-1">
          <h4 className="font-medium text-gray-900">{toast.title}</h4>
          {toast.message && (
            <p className="mt-1 text-sm text-gray-600">{toast.message}</p>
          )}
        </div>
        <button
          onClick={() => removeToast(toast.id)}
          className="ml-4 rounded-lg p-1 hover:bg-white hover:bg-opacity-50"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts } = useUIStore();
  
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};