import { useState } from 'react'
import { ItemCategory } from '../../types/apiTypes'
import { useToastContext } from '../../hooks'
import { 
  useBulkCreateItems, 
  useBulkDeactivateItems, 
  useBulkTransferItems 
} from '../../hooks/useBulkOperations'

interface CategoryBulkOperationsProps {
  category: ItemCategory & { 
    totalQuantity?: number
    sizes?: Array<{ sizeId: number; sizeName: string }>
  }
  onOperationComplete?: () => void
}

type OperationMode = 'increment' | 'decrement' | 'transfer' | null

const CategoryBulkOperations = ({ category, onOperationComplete }: CategoryBulkOperationsProps) => {
  const [operationMode, setOperationMode] = useState<OperationMode>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedLocation, setSelectedLocation] = useState<'McKinney' | 'Plano'>('McKinney')
  const [targetLocation, setTargetLocation] = useState<'McKinney' | 'Plano'>('Plano')
  const [selectedSize, setSelectedSize] = useState<number | null>(null)
  
  const toast = useToastContext()
  
  const bulkCreate = useBulkCreateItems()
  const bulkDeactivate = useBulkDeactivateItems()
  const bulkTransfer = useBulkTransferItems()
  
  const handleOperationSelect = (mode: OperationMode) => {
    setOperationMode(mode)
    setQuantity(1)
    setSelectedSize(null)
  }
  
  const handleCancel = () => {
    setOperationMode(null)
    setQuantity(1)
    setSelectedSize(null)
  }
  
  const handleIncrement = async () => {
    try {
      await bulkCreate.mutateAsync({
        categoryId: category.id,
        quantity,
        location: selectedLocation,
        sizeId: selectedSize
      })
      
      toast.success(`Added ${quantity} item${quantity > 1 ? 's' : ''} to ${category.name}`)
      handleCancel()
      onOperationComplete?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add items')
    }
  }
  
  const handleDecrement = async () => {
    try {
      const result = await bulkDeactivate.mutateAsync({
        categoryId: category.id,
        quantity,
        location: selectedLocation
      })
      
      if (result.deactivatedCount < quantity) {
        toast.info(`Only ${result.deactivatedCount} item${result.deactivatedCount !== 1 ? 's' : ''} were available to remove`)
      } else {
        toast.success(`Removed ${quantity} item${quantity > 1 ? 's' : ''} from ${category.name}`)
      }
      
      handleCancel()
      onOperationComplete?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove items')
    }
  }
  
  const handleTransfer = async () => {
    try {
      const result = await bulkTransfer.mutateAsync({
        categoryId: category.id,
        quantity,
        fromLocation: selectedLocation,
        toLocation: targetLocation
      })
      
      if (result.transferredCount < quantity) {
        toast.info(`Only ${result.transferredCount} item${result.transferredCount !== 1 ? 's' : ''} were available to transfer`)
      } else {
        toast.success(`Transferred ${quantity} item${quantity > 1 ? 's' : ''} from ${selectedLocation} to ${targetLocation}`)
      }
      
      handleCancel()
      onOperationComplete?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to transfer items')
    }
  }
  
  const isLoading = bulkCreate.isPending || bulkDeactivate.isPending || bulkTransfer.isPending
  
  if (!operationMode) {
    return (
      <div style={{
        backgroundColor: 'var(--card-sectionning-background-color)',
        padding: '15px',
        borderRadius: '8px',
        marginTop: '15px',
        borderTop: '2px solid var(--primary)'
      }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '1.1rem' }}>Quick Operations</h4>
        <div className="grid" style={{ gap: '10px' }}>
          <button
            onClick={() => handleOperationSelect('increment')}
            className="secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            Add Items
          </button>
          
          <button
            onClick={() => handleOperationSelect('decrement')}
            className="secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px'
            }}
            disabled={!category.totalQuantity || category.totalQuantity === 0}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            Remove Items
          </button>
          
          <button
            onClick={() => handleOperationSelect('transfer')}
            className="secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px'
            }}
            disabled={!category.totalQuantity || category.totalQuantity === 0}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
            Transfer Items
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div style={{
      backgroundColor: 'var(--card-sectionning-background-color)',
      padding: '15px',
      borderRadius: '8px',
      marginTop: '15px',
      borderLeft: '3px solid var(--primary)'
    }}>
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>
          {operationMode === 'increment' && 'Add Items to Inventory'}
          {operationMode === 'decrement' && 'Remove Items from Inventory'}
          {operationMode === 'transfer' && 'Transfer Items Between Locations'}
        </h4>
        <p style={{ margin: '0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Category: <strong>{category.name}</strong>
          {(operationMode === 'decrement' || operationMode === 'transfer') && 
            ` (${category.totalQuantity || 0} available)`
          }
        </p>
      </div>
      
      <form onSubmit={(e) => {
        e.preventDefault()
        if (operationMode === 'increment') handleIncrement()
        else if (operationMode === 'decrement') handleDecrement()
        else if (operationMode === 'transfer') handleTransfer()
      }}>
        <div className="grid" style={{ gap: '12px' }}>
          <div>
            <label htmlFor="quantity">Quantity (1-3)</label>
            <input
              id="quantity"
              type="number"
              min="1"
              max="3"
              value={quantity}
              onChange={(e) => setQuantity(Math.min(3, Math.max(1, parseInt(e.target.value) || 1)))}
              required
            />
          </div>
          
          {operationMode === 'increment' && (
            <>
              <div>
                <label htmlFor="location">Location</label>
                <select
                  id="location"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value as 'McKinney' | 'Plano')}
                  required
                >
                  <option value="McKinney">McKinney</option>
                  <option value="Plano">Plano</option>
                </select>
              </div>
              
              {category.sizes && category.sizes.length > 0 && (
                <div>
                  <label htmlFor="size">Size (Optional)</label>
                  <select
                    id="size"
                    value={selectedSize || ''}
                    onChange={(e) => setSelectedSize(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">No Size</option>
                    {category.sizes.map(size => (
                      <option key={size.sizeId} value={size.sizeId}>
                        {size.sizeName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
          
          {operationMode === 'decrement' && (
            <div>
              <label htmlFor="remove-location">Remove from Location</label>
              <select
                id="remove-location"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value as 'McKinney' | 'Plano')}
                required
              >
                <option value="McKinney">McKinney</option>
                <option value="Plano">Plano</option>
              </select>
            </div>
          )}
          
          {operationMode === 'transfer' && (
            <>
              <div>
                <label htmlFor="from-location">From Location</label>
                <select
                  id="from-location"
                  value={selectedLocation}
                  onChange={(e) => {
                    const newFrom = e.target.value as 'McKinney' | 'Plano'
                    setSelectedLocation(newFrom)
                    setTargetLocation(newFrom === 'McKinney' ? 'Plano' : 'McKinney')
                  }}
                  required
                >
                  <option value="McKinney">McKinney</option>
                  <option value="Plano">Plano</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="to-location">To Location</label>
                <select
                  id="to-location"
                  value={targetLocation}
                  onChange={(e) => setTargetLocation(e.target.value as 'McKinney' | 'Plano')}
                  required
                  disabled={true}
                >
                  <option value="McKinney">McKinney</option>
                  <option value="Plano">Plano</option>
                </select>
              </div>
            </>
          )}
        </div>
        
        <div className="flex gap-1" style={{ marginTop: '15px' }}>
          <button
            type="submit"
            className="primary"
            disabled={isLoading}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isLoading ? (
              'Processing...'
            ) : (
              <>
                {operationMode === 'increment' && (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="16"></line>
                      <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                    Add {quantity} Item{quantity > 1 ? 's' : ''}
                  </>
                )}
                {operationMode === 'decrement' && (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                    Remove {quantity} Item{quantity > 1 ? 's' : ''}
                  </>
                )}
                {operationMode === 'transfer' && (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                    Transfer {quantity} Item{quantity > 1 ? 's' : ''}
                  </>
                )}
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default CategoryBulkOperations