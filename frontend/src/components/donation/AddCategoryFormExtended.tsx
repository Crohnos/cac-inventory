import { useState } from 'react'
import { useCreateCategory, useToastContext } from '../../hooks'

interface AddCategoryFormExtendedProps {
  onSuccess?: (categoryId: number) => void
}

const AddCategoryFormExtended = ({ onSuccess }: AddCategoryFormExtendedProps) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [lowStockThreshold, setLowStockThreshold] = useState('5')
  const [sizes, setSizes] = useState<string[]>([])
  const [newSize, setNewSize] = useState('')
  
  const toast = useToastContext()
  const createCategory = useCreateCategory()
  
  const addSize = () => {
    if (!newSize.trim()) return
    
    // Check if size already exists
    if (sizes.includes(newSize.trim())) {
      toast.error(`Size "${newSize}" has already been added`)
      return
    }
    
    setSizes([...sizes, newSize.trim()])
    setNewSize('')
  }
  
  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name) {
      toast.error('Category name is required')
      return
    }
    
    try {
      const result = await createCategory.mutateAsync({
        name,
        description: description || undefined,
        lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : undefined,
      })
      
      // TODO: Add sizes to category (would require updating backend)
      // For now, just show a message if sizes were specified
      if (sizes.length > 0) {
        toast.info(`Category created. Note: ${sizes.length} size(s) could not be automatically added. Please add them on the category page.`)
      } else {
        toast.success(`Category "${name}" created successfully`)
      }
      
      // Reset form
      setName('')
      setDescription('')
      setLowStockThreshold('5')
      setSizes([])
      
      // Call onSuccess callback if provided
      if (onSuccess && result.id) {
        onSuccess(result.id)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create category')
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="donation-form-container">
        {/* Left column - Basic Information */}
        <div className="donation-form-section">
          <h3 className="section-title">Basic Information</h3>
          
          <div className="form-group">
            <label htmlFor="name">
              Category Name *
              <input 
                type="text" 
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter category name" 
                required 
              />
            </label>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">
              Description
              <textarea 
                id="description" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter category description" 
                rows={3}
              ></textarea>
            </label>
          </div>
          
          <div className="form-group">
            <label htmlFor="lowStockThreshold">
              Low Stock Threshold
              <input 
                type="number" 
                id="lowStockThreshold" 
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                placeholder="5" 
                min="1" 
              />
              <small>Items below this quantity will be highlighted as low stock</small>
            </label>
          </div>
        </div>
        
        {/* Right column - Size Management */}
        <div className="donation-form-section">
          <h3 className="section-title">Size Management</h3>
          
          <div className="form-group">
            <label htmlFor="sizes">
              Add Sizes
              <div className="flex gap-1">
                <input 
                  type="text" 
                  id="sizes"
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  placeholder="Enter a size name" 
                  style={{ flex: 1 }}
                />
                <button 
                  type="button" 
                  onClick={addSize}
                  disabled={!newSize.trim()}
                >
                  Add
                </button>
              </div>
              <small>Add common sizes for this category (e.g., S, M, L or 2T, 3T, 4T)</small>
            </label>
          </div>
          
          <div className="sizes-container">
            <h4 className="sizes-title">Added Sizes:</h4>
            
            {sizes.length === 0 ? (
              <p className="no-sizes-message">No sizes added yet</p>
            ) : (
              <div className="size-chips-container">
                {sizes.map((size, index) => (
                  <div key={index} className="size-chip">
                    <span className="size-name">{size}</span>
                    <button 
                      onClick={() => removeSize(index)}
                      className="size-remove-button"
                      aria-label={`Remove ${size}`}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="form-actions">
        <div></div> {/* Empty div for spacing */}
        <button type="submit" className="submit-button" disabled={createCategory.isPending}>
          {createCategory.isPending ? 'Creating...' : 'Create Category'}
        </button>
      </div>
    </form>
  )
}

export default AddCategoryFormExtended