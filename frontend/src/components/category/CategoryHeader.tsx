import { useState } from 'react'
import { ItemCategory } from '../../types/apiTypes'
import { useUpdateCategory } from '../../hooks/useCategories'
import { useToastContext } from '../../hooks'
import ItemQrCode from '../item/ItemQrCode'

interface CategoryHeaderProps {
  category: ItemCategory
  onRefresh: () => void
}

const CategoryHeader = ({ category, onRefresh }: CategoryHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const [description, setDescription] = useState(category.description || '')
  const [lowStockThreshold, setLowStockThreshold] = useState(
    category.lowStockThreshold.toString()
  )
  
  const updateCategory = useUpdateCategory(category.id)
  const toast = useToastContext()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name) {
      toast.error('Category name is required')
      return
    }
    
    try {
      await updateCategory.mutateAsync({
        name,
        description: description || undefined,
        lowStockThreshold: parseInt(lowStockThreshold),
      })
      
      toast.success('Category updated successfully')
      setIsEditing(false)
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update category')
    }
  }
  
  const handleCancel = () => {
    // Reset form values
    setName(category.name)
    setDescription(category.description || '')
    setLowStockThreshold(category.lowStockThreshold.toString())
    setIsEditing(false)
  }
  
  if (isEditing) {
    return (
      <div className="card">
        <h2>Edit Category</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid">
            <label htmlFor="name">
              Category Name
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            
            <label htmlFor="description">
              Description
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </label>
            
            <label htmlFor="lowStockThreshold">
              Low Stock Threshold
              <input
                type="number"
                id="lowStockThreshold"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                min="1"
              />
            </label>
          </div>
          
          <div className="flex gap-1 mt-1">
            <button type="submit" disabled={updateCategory.isPending}>
              {updateCategory.isPending ? 'Saving...' : 'Save Changes'}
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
    <div className="card category-header">
      <div className="flex justify-between items-center">
        <h2 className="category-title">{category.name}</h2>
        <button onClick={() => setIsEditing(true)} className="edit-button">
          <span className="edit-icon">✏️</span>
          Edit Category
        </button>
      </div>
      
      <dl className="category-details">
        <div className="category-details-grid">
          <div className="description-section">
            <dt>Description</dt>
            <dd className="description-content">{category.description || <em>No description provided</em>}</dd>
          </div>
          
          <div className="metrics-section">
            <div className="metric-card">
              <dt>Total Items</dt>
              <dd 
                className={
                  Number(category.totalQuantity) < category.lowStockThreshold 
                    ? 'metric-value low-stock' 
                    : 'metric-value'
                }
              >
                {category.totalQuantity || 0}
              </dd>
            </div>
            
            <div className="metric-card">
              <dt>Min. Required</dt>
              <dd className="metric-value">{category.lowStockThreshold}</dd>
            </div>
            
            <div className="metric-card status-card">
              <dt>Stock Status</dt>
              <dd className={
                Number(category.totalQuantity) < category.lowStockThreshold 
                  ? 'status-indicator low' 
                  : 'status-indicator good'
              }>
                {Number(category.totalQuantity) < category.lowStockThreshold 
                  ? 'Low Stock' 
                  : 'In Stock'}
              </dd>
            </div>
          </div>
        </div>
      </dl>
      
      {/* QR Code Section */}
      {category.qrCodeValue && (
        <div style={{ marginTop: '20px' }}>
          <ItemQrCode 
            qrCodeValue={category.qrCodeValue} 
            qrCodeDataUrl={category.qrCodeDataUrl}
          />
        </div>
      )}
    </div>
  )
}

export default CategoryHeader