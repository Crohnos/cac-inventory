import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { 
  useDeactivateDetail, 
  useTransferDetail,
  useToastContext
} from '../../hooks'
import { ItemDetail } from '../../types/apiTypes'
import ConfirmationDialog from '../common/ConfirmationDialog'

interface ItemActionsProps {
  item: ItemDetail
  onRefresh: () => void
}

const ItemActions = ({ item, onRefresh }: ItemActionsProps) => {
  const [showTransferForm, setShowTransferForm] = useState(false)
  const [newLocation, setNewLocation] = useState<'McKinney' | 'Plano'>(
    item.location === 'McKinney' ? 'Plano' : 'McKinney'
  )
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  
  const navigate = useNavigate()
  const toast = useToastContext()
  
  // Mutations
  const deactivateDetail = useDeactivateDetail(item.id)
  const transferDetail = useTransferDetail(item.id)
  
  const handleDeactivate = async () => {
    try {
      await deactivateDetail.mutateAsync()
      toast.success('Item removed from inventory')
      setShowDeactivateDialog(false)
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove item')
    }
  }
  
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowTransferDialog(true)
  }
  
  const confirmTransfer = async () => {
    try {
      await transferDetail.mutateAsync({ location: newLocation })
      toast.success(`Item transferred to ${newLocation}`)
      setShowTransferDialog(false)
      setShowTransferForm(false)
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to transfer item')
    }
  }
  
  return (
    <div className="card">
      <h3>Actions</h3>
      
      <div className="flex gap-1 flex-wrap">
        <button 
          onClick={() => navigate({ to: `/categories/${item.itemCategoryId}` })}
          className="secondary"
        >
          View Category
        </button>
        
        {item.isActive && (
          <>
            <button 
              onClick={() => setShowTransferForm(!showTransferForm)}
              className={showTransferForm ? 'secondary' : ''}
            >
              {showTransferForm ? 'Cancel Transfer' : 'Transfer Location'}
            </button>
            
            <button 
              onClick={() => setShowDeactivateDialog(true)}
              className="secondary contrast"
              disabled={deactivateDetail.isPending}
            >
              {deactivateDetail.isPending ? 'Removing...' : 'Remove from Inventory'}
            </button>
          </>
        )}
      </div>
      
      {showTransferForm && (
        <form onSubmit={handleTransfer} className="mt-1">
          <div className="grid">
            <label htmlFor="newLocation">
              New Location
              <select
                id="newLocation"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value as 'McKinney' | 'Plano')}
                required
              >
                <option value="McKinney" disabled={item.location === 'McKinney'}>McKinney</option>
                <option value="Plano" disabled={item.location === 'Plano'}>Plano</option>
              </select>
            </label>
          </div>
          
          <button 
            type="submit" 
            disabled={transferDetail.isPending || newLocation === item.location}
            className="mt-1"
          >
            {transferDetail.isPending ? 'Transferring...' : `Transfer to ${newLocation}`}
          </button>
        </form>
      )}
      
      {!item.isActive && (
        <div className="mt-1">
          <p><em>This item has been removed from inventory and cannot be modified.</em></p>
          <p><small>Removed items are kept for historical records.</small></p>
        </div>
      )}
      
      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={showDeactivateDialog}
        title="Remove Item from Inventory"
        message={`Are you sure you want to remove Item #${item.id} from inventory? This item will be marked as inactive but will remain in the database for historical records.`}
        confirmText="Remove Item"
        cancelText="Cancel"
        onConfirm={handleDeactivate}
        onCancel={() => setShowDeactivateDialog(false)}
        confirmButtonClass="contrast"
      />
      
      <ConfirmationDialog
        isOpen={showTransferDialog}
        title="Transfer Item"
        message={`Are you sure you want to transfer Item #${item.id} from ${item.location} to ${newLocation}?`}
        confirmText="Transfer"
        cancelText="Cancel"
        onConfirm={confirmTransfer}
        onCancel={() => setShowTransferDialog(false)}
      />
    </div>
  )
}

export default ItemActions