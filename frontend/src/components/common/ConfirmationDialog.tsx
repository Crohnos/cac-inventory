import React from 'react'

interface ConfirmationDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  confirmButtonClass?: string
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmButtonClass = 'contrast'
}) => {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop">
      <dialog open>
        <article>
          <header>
            <h3>{title}</h3>
          </header>
          <p>{message}</p>
          <footer>
            <div className="flex gap-1 justify-end">
              <button 
                className="secondary" 
                onClick={onCancel}
              >
                {cancelText}
              </button>
              <button 
                className={confirmButtonClass} 
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </div>
          </footer>
        </article>
      </dialog>
    </div>
  )
}

export default ConfirmationDialog