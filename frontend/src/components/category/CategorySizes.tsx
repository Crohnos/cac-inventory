import { useState } from 'react'
import { 
  useCategorySizes, 
  useSizes, 
  useAddSizeToCategory, 
  useRemoveSizeFromCategory,
  useToastContext
} from '../../hooks'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorDisplay from '../common/ErrorDisplay'
import ConfirmationDialog from '../common/ConfirmationDialog'

interface CategorySizesProps {
  categoryId: number
}

const CategorySizes = ({ categoryId }: CategorySizesProps) => {
  const [selectedSizeId, setSelectedSizeId] = useState<string>('')
  const [sizeToRemove, setSizeToRemove] = useState<{ id: number, name: string } | null>(null)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  
  const toast = useToastContext()
  
  // Fetch sizes for this category
  const { 
    data: categorySizes = [], 
    isLoading: isLoadingCategorySizes, 
    error: categorySizesError,
    refetch: refetchCategorySizes 
  } = useCategorySizes(categoryId)
  
  // Fetch all available sizes
  const { 
    data: allSizes = [], 
    isLoading: isLoadingAllSizes, 
    error: allSizesError 
  } = useSizes()
  
  // Mutations
  const addSizeToCategory = useAddSizeToCategory(categoryId)
  const removeSizeFromCategory = useRemoveSizeFromCategory(categoryId)
  
  // Filter out sizes that are already associated with this category
  const availableSizes = allSizes.filter(
    size => !categorySizes.some(catSize => catSize.id === size.id)
  )
  
  const handleAddSize = async () => {
    if (!selectedSizeId) {
      toast.error('Please select a size to add')
      return
    }
    
    try {
      await addSizeToCategory.mutateAsync(parseInt(selectedSizeId))
      toast.success('Size added to category')
      setSelectedSizeId('')
      refetchCategorySizes()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add size to category')
    }
  }
  
  const openRemoveDialog = (size: { id: number, name: string }) => {
    setSizeToRemove(size)
    setShowRemoveDialog(true)
  }
  
  const handleRemoveSize = async () => {
    if (!sizeToRemove) return
    
    try {
      await removeSizeFromCategory.mutateAsync(sizeToRemove.id)
      toast.success(`Size "${sizeToRemove.name}" removed from category`)
      setShowRemoveDialog(false)
      setSizeToRemove(null)
      refetchCategorySizes()
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove size from category')
    }
  }
  
  if (isLoadingCategorySizes || isLoadingAllSizes) {
    return <LoadingSpinner text="Loading sizes..." />
  }
  
  if (categorySizesError || allSizesError) {
    return (
      <ErrorDisplay 
        error={categorySizesError || allSizesError as Error} 
        retry={refetchCategorySizes}
      />
    )
  }
  
  return (
    <div className="card">
      <h3>Associated Sizes</h3>
      
      {/* Add new size */}
      <div className="flex gap-1 mb-1">
        <select 
          value={selectedSizeId}
          onChange={(e) => setSelectedSizeId(e.target.value)}
          style={{ flex: 1 }}
          disabled={availableSizes.length === 0}
        >
          <option value="">Select a size to add...</option>
          {availableSizes.map(size => (
            <option key={size.id} value={size.id}>
              {size.name}
            </option>
          ))}
        </select>
        
        <button 
          onClick={handleAddSize} 
          disabled={!selectedSizeId || addSizeToCategory.isPending}
        >
          {addSizeToCategory.isPending ? 'Adding...' : 'Add Size'}
        </button>
      </div>
      
      {/* Current sizes */}
      {categorySizes.length === 0 ? (
        <p><em>No sizes associated with this category.</em></p>
      ) : (
        <div className="size-chips flex flex-wrap gap-1">
          {categorySizes.map(size => (
            <div 
              key={size.id} 
              className="size-chip"
              style={{ 
                display: 'inline-block',
                padding: '0.5em 1em',
                background: 'var(--card-background-color)',
                border: '1px solid var(--muted-border-color)',
                borderRadius: '2em',
              }}
            >
              {size.name}
              <button 
                onClick={() => openRemoveDialog({ id: size.id, name: size.name })}
                disabled={removeSizeFromCategory.isPending}
                style={{ 
                  marginLeft: '0.5em',
                  background: 'none',
                  border: 'none',
                  padding: '0 0.25em',
                  cursor: 'pointer',
                  fontSize: '1em',
                  color: 'var(--primary)',
                }}
                aria-label={`Remove ${size.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      {availableSizes.length === 0 && categorySizes.length > 0 && (
        <p className="mt-1"><small>All available sizes have been added to this category.</small></p>
      )}
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showRemoveDialog}
        title="Remove Size"
        message={sizeToRemove ? 
          `Are you sure you want to remove "${sizeToRemove.name}" from this category? Items with this size will not be affected.` : 
          'Are you sure you want to remove this size?'
        }
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={handleRemoveSize}
        onCancel={() => setShowRemoveDialog(false)}
      />
    </div>
  )
}

export default CategorySizes