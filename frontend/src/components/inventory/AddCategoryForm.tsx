import { useState, FormEvent } from 'react'
import { useCreateCategory } from '../../hooks/useCategories'
import { useToastContext } from '../../hooks'

const AddCategoryForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [lowStockThreshold, setLowStockThreshold] = useState('5')
  
  const toast = useToastContext()
  const createCategory = useCreateCategory()
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!name) {
      toast.error('Category name is required')
      return
    }
    
    try {
      await createCategory.mutateAsync({
        name,
        description: description || undefined,
        lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : undefined,
      })
      
      // Show success toast
      toast.success(`Category "${name}" created successfully`)
      
      // Reset form
      setName('')
      setDescription('')
      setLowStockThreshold('5')
      
      // Call onSuccess callback if provided
      if (onSuccess) onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create category')
      console.error('Error creating category:', error)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <h3>Add New Category</h3>
      
      <div className="grid">
        <label htmlFor="categoryName">
          Category Name
          <input 
            type="text" 
            id="categoryName" 
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter category name" 
            required 
          />
        </label>
        
        <label htmlFor="categoryDescription">
          Description
          <textarea 
            id="categoryDescription" 
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Enter category description" 
            rows={3}
          ></textarea>
        </label>
        
        <label htmlFor="lowStockThreshold">
          Low Stock Threshold
          <input 
            type="number" 
            id="lowStockThreshold" 
            value={lowStockThreshold}
            onChange={e => setLowStockThreshold(e.target.value)}
            placeholder="5" 
            min="1" 
          />
        </label>
      </div>
      
      <div className="mt-1">
        <button type="submit" disabled={createCategory.isPending}>
          {createCategory.isPending ? 'Creating...' : 'Add Category'}
        </button>
      </div>
    </form>
  )
}

export default AddCategoryForm