import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { useCategories, useCategorySizes, useCreateDetail, useToastContext } from '../../hooks'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorDisplay from '../common/ErrorDisplay'
import ItemQrCode from '../item/ItemQrCode'

interface AddItemFormProps {
  initialCategoryId?: number
  onSuccess?: () => void
}

interface NewItem {
  id?: number
  qrCodeValue?: string
  qrCodeDataUrl?: string
}

const AddItemForm = ({ initialCategoryId, onSuccess }: AddItemFormProps) => {
  // Form state
  const [categoryId, setCategoryId] = useState(initialCategoryId?.toString() || '')
  const [sizeId, setSizeId] = useState('')
  const [condition, setCondition] = useState<'New' | 'Gently Used' | 'Heavily Used'>('New')
  const [location, setLocation] = useState<'McKinney' | 'Plano'>('McKinney')
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0])
  const [donorInfo, setDonorInfo] = useState('')
  const [approxPrice, setApproxPrice] = useState('')
  
  // Added item tracking
  const [newItem, setNewItem] = useState<NewItem | null>(null)
  const [addAnother, setAddAnother] = useState(false)
  
  const toast = useToastContext()
  
  // Fetch all categories
  const { 
    data: categories = [], 
    isLoading: isLoadingCategories, 
    error: categoriesError 
  } = useCategories()
  
  // Fetch available sizes for selected category
  const {
    data: categorySizes = [],
    isLoading: isLoadingSizes,
    error: sizesError
  } = useCategorySizes(categoryId ? parseInt(categoryId) : 0)
  
  // Create item mutation
  const createDetail = useCreateDetail()
  
  // Reset size when category changes
  useEffect(() => {
    setSizeId('')
  }, [categoryId])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!categoryId) {
      toast.error('Please select a category')
      return
    }
    
    try {
      const result = await createDetail.mutateAsync({
        itemCategoryId: parseInt(categoryId),
        sizeId: sizeId ? parseInt(sizeId) : undefined,
        condition,
        location,
        receivedDate,
        donorInfo: donorInfo || undefined,
        approxPrice: approxPrice ? parseFloat(approxPrice) : undefined,
      })
      
      toast.success('Item added successfully')
      
      // Save the new item info for display
      setNewItem({
        id: result.id,
        qrCodeValue: result.qrCodeValue,
        qrCodeDataUrl: result.qrCodeDataUrl
      })
      
      // Reset form if adding another
      if (addAnother) {
        // Keep category and location, reset other fields
        setSizeId('')
        setCondition('New')
        setDonorInfo('')
        setApproxPrice('')
        setReceivedDate(new Date().toISOString().split('T')[0])
      }
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add item')
    }
  }
  
  const resetForm = () => {
    setNewItem(null)
    setCategoryId(initialCategoryId?.toString() || '')
    setSizeId('')
    setCondition('New')
    setLocation('McKinney')
    setReceivedDate(new Date().toISOString().split('T')[0])
    setDonorInfo('')
    setApproxPrice('')
  }
  
  if (isLoadingCategories) {
    return <LoadingSpinner text="Loading categories..." />
  }
  
  if (categoriesError) {
    return <ErrorDisplay error={categoriesError as Error} />
  }
  
  // If a new item was just created, show the QR code and options
  if (newItem) {
    return (
      <div>
        <div className="card">
          <h3 className="text-center">Item Added Successfully!</h3>
          
          {newItem.qrCodeValue && (
            <div className="mt-1">
              <ItemQrCode 
                qrCodeValue={newItem.qrCodeValue}
                qrCodeDataUrl={newItem.qrCodeDataUrl}
              />
            </div>
          )}
          
          <div className="flex gap-1 justify-between mt-1">
            <div>
              <Link to={`/items/${newItem.id}`} className="button">
                View Item Details
              </Link>
            </div>
            
            <div className="flex gap-1">
              <button onClick={resetForm} className="secondary">
                Add Another Item
              </button>
              <Link to="/" className="button secondary">
                Done
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="donation-form-container">
        {/* Left column - Primary information */}
        <div className="donation-form-section">
          <h3 className="section-title">Primary Information</h3>
          
          <div className="form-group">
            <label htmlFor="categoryId">
              Category *
              <select
                id="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          
          <div className="form-group">
            <label htmlFor="sizeId">
              Size
              <select
                id="sizeId"
                value={sizeId}
                onChange={(e) => setSizeId(e.target.value)}
                disabled={!categoryId || isLoadingSizes || categorySizes.length === 0}
              >
                <option value="">None</option>
                {categorySizes.map(size => (
                  <option key={size.id} value={size.id}>
                    {size.name}
                  </option>
                ))}
              </select>
              {categoryId && categorySizes.length === 0 && !isLoadingSizes && (
                <small>No sizes available for this category.</small>
              )}
            </label>
          </div>
          
          <div className="form-group">
            <label htmlFor="condition">
              Condition *
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
              Location *
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
        </div>
        
        {/* Right column - Additional details */}
        <div className="donation-form-section">
          <h3 className="section-title">Additional Details</h3>
          
          <div className="form-group">
            <label htmlFor="receivedDate">
              Received Date *
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
      </div>
      
      <div className="form-actions mt-2">
        <label className="add-another-checkbox">
          <input
            type="checkbox"
            checked={addAnother}
            onChange={(e) => setAddAnother(e.target.checked)}
          />
          <span>Add another item after this one</span>
        </label>
        
        <button type="submit" className="submit-button" disabled={createDetail.isPending}>
          {createDetail.isPending ? 'Adding...' : 'Add Item'}
        </button>
      </div>
    </form>
  )
}

export default AddItemForm