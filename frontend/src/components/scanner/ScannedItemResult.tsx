import { useState, useEffect } from 'react'
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
  const [isMobile, setIsMobile] = useState(false)
  
  const toast = useToastContext()
  
  // Detect if user is on mobile
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      setIsMobile(mobileRegex.test(userAgent))
    }
    
    checkMobile()
    
    // Re-check on resize (orientation change)
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
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
      <div className="card" style={{ 
        borderRadius: '12px',
        borderLeft: '4px solid var(--text-secondary)'
      }}>
        <div style={{
          backgroundColor: 'var(--card-sectionning-background-color)',
          padding: '12px',
          marginBottom: '15px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h3 className="text-center" style={{ margin: '0' }}>Item is Inactive</h3>
        </div>
        <p className="text-center">
          This item (#{item.id}) has been removed from inventory.
        </p>
        <div className="flex justify-center mt-1">
          <Link 
            to={`/items/${item.id}`} 
            className="button primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 20px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            View Item Details
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="card" style={{ borderRadius: '12px' }}>
      <div style={{
        backgroundColor: 'var(--primary-light)',
        padding: '12px',
        marginBottom: '15px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--primary)',
          marginBottom: '5px'
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <h3 style={{ margin: '0' }}>Scanned Item Details</h3>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '0.9rem'
        }}>
          <span style={{ fontWeight: 'bold' }}>Item ID:</span>
          <span>{item.id}</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '0.9rem',
          fontWeight: 'bold'
        }}>
          <span style={{ color: 'var(--primary)' }}>{item.categoryName}</span>
          {item.sizeName && <span>• {item.sizeName}</span>}
        </div>
      </div>
      
      <dl style={{ 
        backgroundColor: 'var(--card-sectionning-background-color, var(--card-background-color))',
        padding: '15px',
        borderRadius: '8px',
        margin: '0 0 15px 0'
      }}>
        <div className="grid" style={{ 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '12px' : '15px'
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '2px',
            padding: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderRadius: '6px'
          }}>
            <dt style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Category
            </dt>
            <dd style={{ fontSize: '1rem', margin: '0', fontWeight: '500' }}>
              {item.categoryName}
            </dd>
          </div>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '2px',
            padding: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderRadius: '6px'
          }}>
            <dt style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Size
            </dt>
            <dd style={{ fontSize: '1rem', margin: '0', fontWeight: '500' }}>
              {item.sizeName || 'None'}
            </dd>
          </div>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '2px',
            padding: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderRadius: '6px'
          }}>
            <dt style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Location
            </dt>
            <dd style={{ fontSize: '1rem', margin: '0', fontWeight: '500' }}>
              <span style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {item.location}
              </span>
            </dd>
          </div>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '2px',
            padding: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderRadius: '6px'
          }}>
            <dt style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Condition
            </dt>
            <dd style={{ fontSize: '1rem', margin: '0', fontWeight: '500' }}>
              <span style={{ 
                display: 'inline-block',
                padding: '3px 8px',
                backgroundColor: item.condition === 'New' ? 'rgba(76, 175, 80, 0.1)' : 
                                item.condition === 'Gently Used' ? 'rgba(255, 193, 7, 0.1)' : 
                                'rgba(244, 67, 54, 0.1)',
                color: item.condition === 'New' ? '#2e7d32' :
                      item.condition === 'Gently Used' ? '#f57f17' :
                      '#d32f2f',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}>
                {item.condition}
              </span>
            </dd>
          </div>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '2px',
            padding: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderRadius: '6px'
          }}>
            <dt style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Received Date
            </dt>
            <dd style={{ fontSize: '1rem', margin: '0', fontWeight: '500' }}>
              {new Date(item.receivedDate).toLocaleDateString()}
            </dd>
          </div>
          
          {item.donorInfo && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '2px',
              padding: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
              borderRadius: '6px'
            }}>
              <dt style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Donor
              </dt>
              <dd style={{ fontSize: '1rem', margin: '0', fontWeight: '500' }}>
                {item.donorInfo}
              </dd>
            </div>
          )}
        </div>
      </dl>
      
      <div className={isMobile ? 'flex-col gap-1' : 'flex gap-1'} style={{ display: 'flex', marginTop: '15px' }}>
        <Link 
          to={`/items/${item.id}`} 
          className="button primary"
          style={{
            flex: isMobile ? 'unset' : '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          View Full Details
        </Link>
        
        <button
          onClick={() => setShowTransferForm(!showTransferForm)}
          className={showTransferForm ? 'secondary' : ''}
          style={{
            flex: isMobile ? 'unset' : '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="16 12 8 8 8 16 16 12"></polygon>
          </svg>
          {showTransferForm ? 'Cancel Transfer' : 'Transfer Location'}
        </button>
        
        <button 
          onClick={handleDeactivate}
          className="secondary contrast"
          disabled={deactivateDetail.isPending}
          style={{
            flex: isMobile ? 'unset' : '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          {deactivateDetail.isPending ? 'Removing...' : 'Remove from Inventory'}
        </button>
      </div>
      
      {showTransferForm && (
        <form onSubmit={handleTransfer} className="mt-1" style={{
          backgroundColor: 'var(--card-sectionning-background-color, var(--card-background-color))',
          padding: '15px',
          borderRadius: '8px',
          borderLeft: '3px solid var(--primary)'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Transfer Item to New Location</h4>
            <p style={{ margin: '0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Current location: <strong>{item.location}</strong>
            </p>
          </div>
          <div className="flex gap-1" style={{ flexDirection: isMobile ? 'column' : 'row' }}>
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
              className="primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              {transferDetail.isPending ? 'Transferring...' : `Transfer to ${newLocation}`}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default ScannedItemResult