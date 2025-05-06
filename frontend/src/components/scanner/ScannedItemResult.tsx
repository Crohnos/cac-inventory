import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ItemDetail } from '../../types/apiTypes'
import { 
  useDeactivateDetail, 
  useTransferDetail,
  useToastContext
} from '../../hooks'

interface ScannedItemResultProps {
  item: ItemDetail
  onActionComplete: () => void
}

const ScannedItemResult = ({ item, onActionComplete }: ScannedItemResultProps) => {
  const [showTransferForm, setShowTransferForm] = useState(false)
  const [newLocation, setNewLocation] = useState<'McKinney' | 'Plano'>(
    item.location === 'McKinney' ? 'Plano' : 'McKinney'
  )
  
  const toast = useToastContext()
  
  // Mutations
  const deactivateDetail = useDeactivateDetail(item.id)
  const transferDetail = useTransferDetail(item.id)
  
  const handleDeactivate = async () => {
    if (!confirm(`Are you sure you want to remove this item (${item.id}) from inventory?`)) {
      return
    }
    
    try {
      await deactivateDetail.mutateAsync()
      toast.success('Item removed from inventory')
      onActionComplete()
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove item')
    }
  }
  
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await transferDetail.mutateAsync({ location: newLocation })
      toast.success(`Item transferred to ${newLocation}`)
      setShowTransferForm(false)
      onActionComplete()
    } catch (error: any) {
      toast.error(error.message || 'Failed to transfer item')
    }
  }
  
  if (!item.isActive) {
    return (
      <div className="card">
        <h3 className="text-center">Item is Inactive</h3>
        <p className="text-center">
          This item (#{item.id}) has been removed from inventory.
        </p>
        <div className="flex justify-center mt-1">
          <Link to={`/items/${item.id}`} className="button">
            View Item Details
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="card">
      <h3>Scanned Item</h3>
      
      <dl>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <dt>Item ID</dt>
            <dd>{item.id}</dd>
          </div>
          
          <div>
            <dt>Category</dt>
            <dd>{item.categoryName}</dd>
          </div>
          
          <div>
            <dt>Size</dt>
            <dd>{item.sizeName || 'None'}</dd>
          </div>
          
          <div>
            <dt>Location</dt>
            <dd>{item.location}</dd>
          </div>
          
          <div>
            <dt>Condition</dt>
            <dd>{item.condition}</dd>
          </div>
          
          <div>
            <dt>Received Date</dt>
            <dd>{new Date(item.receivedDate).toLocaleDateString()}</dd>
          </div>
        </div>
      </dl>
      
      <div className="flex gap-1 mt-1">
        <Link to={`/items/${item.id}`} className="button">
          View Details
        </Link>
        
        <button
          onClick={() => setShowTransferForm(!showTransferForm)}
          className={showTransferForm ? 'secondary' : ''}
        >
          {showTransferForm ? 'Cancel' : 'Transfer Location'}
        </button>
        
        <button 
          onClick={handleDeactivate}
          className="secondary contrast"
          disabled={deactivateDetail.isPending}
        >
          {deactivateDetail.isPending ? 'Removing...' : 'Remove from Inventory'}
        </button>
      </div>
      
      {showTransferForm && (
        <form onSubmit={handleTransfer} className="mt-1">
          <div className="flex gap-1">
            <select
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value as 'McKinney' | 'Plano')}
              style={{ flex: 1 }}
              required
            >
              <option value="McKinney" disabled={item.location === 'McKinney'}>McKinney</option>
              <option value="Plano" disabled={item.location === 'Plano'}>Plano</option>
            </select>
            
            <button 
              type="submit" 
              disabled={transferDetail.isPending || newLocation === item.location}
            >
              {transferDetail.isPending ? 'Transferring...' : 'Transfer'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default ScannedItemResult