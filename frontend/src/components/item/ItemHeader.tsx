import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ItemDetail } from '../../types/apiTypes'
import { useUpdateDetail, useToastContext } from '../../hooks'
import { useCategory, useCategorySizes } from '../../hooks/useCategories'
import LoadingSpinner from '../common/LoadingSpinner'

interface ItemHeaderProps {
  item: ItemDetail
  onRefresh: () => void
}

const ItemHeader = ({ item, onRefresh }: ItemHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [categoryId, setCategoryId] = useState(item.itemCategoryId.toString())
  const [sizeId, setSizeId] = useState(item.sizeId?.toString() || '')
  const [condition, setCondition] = useState(item.condition)
  const [location, setLocation] = useState(item.location)
  const [receivedDate, setReceivedDate] = useState(item.receivedDate.split('T')[0]) // Get just the date part
  const [donorInfo, setDonorInfo] = useState(item.donorInfo || '')
  const [approxPrice, setApproxPrice] = useState(
    item.approxPrice !== null ? item.approxPrice.toString() : ''
  )
  
  const toast = useToastContext()
  const updateDetail = useUpdateDetail(item.id)
  
  // Fetch category data
  const { 
    isLoading: isLoadingCategory
  } = useCategory(item.itemCategoryId)
  
  // Fetch available sizes for this category
  const {
    data: categorySizes = [],
    isLoading: isLoadingSizes
  } = useCategorySizes(item.itemCategoryId)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await updateDetail.mutateAsync({
        itemCategoryId: parseInt(categoryId),
        sizeId: sizeId ? parseInt(sizeId) : null,
        condition,
        location,
        receivedDate,
        donorInfo: donorInfo || null,
        approxPrice: approxPrice ? parseFloat(approxPrice) : null,
      })
      
      toast.success('Item updated successfully')
      setIsEditing(false)
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update item')
    }
  }
  
  const handleCancel = () => {
    // Reset form values
    setCategoryId(item.itemCategoryId.toString())
    setSizeId(item.sizeId?.toString() || '')
    setCondition(item.condition)
    setLocation(item.location)
    setReceivedDate(item.receivedDate.split('T')[0])
    setDonorInfo(item.donorInfo || '')
    setApproxPrice(item.approxPrice !== null ? item.approxPrice.toString() : '')
    setIsEditing(false)
  }
  
  if (isLoadingCategory || isLoadingSizes) {
    return <LoadingSpinner text="Loading item data..." />
  }
  
  if (isEditing) {
    return (
      <div className="card">
        <h2>Edit Item</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid">
            <div className="form-group">
              <label htmlFor="categoryId">
                Category
                <select
                  id="categoryId"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={true} // We don't allow changing category in edit mode
                  required
                >
                  <option value={item.itemCategoryId}>{item.categoryName}</option>
                </select>
                <small>Category cannot be changed. Create a new item to change category.</small>
              </label>
            </div>
            
            <div className="form-group">
              <label htmlFor="sizeId">
                Size
                <select
                  id="sizeId"
                  value={sizeId}
                  onChange={(e) => setSizeId(e.target.value)}
                >
                  <option value="">None</option>
                  {categorySizes.map(size => (
                    <option key={size.id} value={size.id}>
                      {size.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            
            <div className="form-group">
              <label htmlFor="condition">
                Condition
                <select
                  id="condition"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                  required
                >
                  <option value="New">New</option>
                  <option value="Gently Used">Gently Used</option>
                  <option value="Heavily Used">Heavily Used</option>
                </select>
              </label>
            </div>
            
            <div className="form-group">
              <label htmlFor="location">
                Location
                <select
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value as any)}
                  required
                >
                  <option value="McKinney">McKinney</option>
                  <option value="Plano">Plano</option>
                </select>
              </label>
            </div>
            
            <div className="form-group">
              <label htmlFor="receivedDate">
                Received Date
                <input
                  type="date"
                  id="receivedDate"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  required
                />
              </label>
            </div>
            
            <div className="form-group">
              <label htmlFor="donorInfo">
                Donor Information
                <input
                  type="text"
                  id="donorInfo"
                  value={donorInfo}
                  onChange={(e) => setDonorInfo(e.target.value)}
                  placeholder="Optional"
                />
              </label>
            </div>
            
            <div className="form-group">
              <label htmlFor="approxPrice">
                Approximate Price
                <input
                  type="number"
                  id="approxPrice"
                  value={approxPrice}
                  onChange={(e) => setApproxPrice(e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="Optional"
                />
              </label>
            </div>
          </div>
          
          <div className="flex gap-1 mt-1">
            <button type="submit" disabled={updateDetail.isPending}>
              {updateDetail.isPending ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    )
  }
  
  return (
    <div className="card">
      <div className="item-header-top">
        <div className="item-title-section">
          <h2>Item #{item.id}</h2>
          <span className={`item-status-badge ${item.isActive ? 'active' : 'inactive'}`}>
            {item.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setIsEditing(true)} className="edit-item-button">
            <span className="edit-icon">✏️</span> Edit Item
          </button>
        </div>
      </div>
      
      <div className="item-details-grid">
        <div className="item-detail-card">
          <h4 className="detail-section-title">Item Information</h4>
          <div className="detail-fields">
            <div className="detail-field">
              <dt>Category</dt>
              <dd>
                <Link to={`/categories/${item.itemCategoryId}`} className="category-link">
                  {item.categoryName || `Category #${item.itemCategoryId}`}
                </Link>
              </dd>
            </div>
            
            <div className="detail-field">
              <dt>Size</dt>
              <dd>{item.sizeName || 'None'}</dd>
            </div>
            
            <div className="detail-field">
              <dt>Condition</dt>
              <dd>
                <span className={`condition-badge ${item.condition.toLowerCase().replace(' ', '-')}`}>
                  {item.condition}
                </span>
              </dd>
            </div>
            
            <div className="detail-field">
              <dt>Location</dt>
              <dd>
                <span className="location-badge">
                  📍 {item.location}
                </span>
              </dd>
            </div>
          </div>
        </div>
        
        <div className="item-detail-card">
          <h4 className="detail-section-title">Donation Details</h4>
          <div className="detail-fields">
            <div className="detail-field">
              <dt>Received Date</dt>
              <dd>{new Date(item.receivedDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</dd>
            </div>
            
            <div className="detail-field">
              <dt>Donor Info</dt>
              <dd>{item.donorInfo || 'Not specified'}</dd>
            </div>
            
            <div className="detail-field">
              <dt>Approx. Price</dt>
              <dd>
                {item.approxPrice !== null
                  ? <span className="price">${item.approxPrice.toFixed(2)}</span>
                  : 'Not specified'}
              </dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItemHeader