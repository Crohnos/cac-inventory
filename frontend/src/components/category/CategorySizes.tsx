import { useState, useEffect } from 'react'
import Select, { components, OptionProps, SingleValue } from 'react-select'
import { 
  useCategorySizes, 
  useSizes, 
  useAddSizeToCategory, 
  useRemoveSizeFromCategory,
  useCreateSize,
  useToastContext
} from '../../hooks'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorDisplay from '../common/ErrorDisplay'
import ConfirmationDialog from '../common/ConfirmationDialog'

interface CategorySizesProps {
  categoryId: number
}

// Define our option type for react-select
interface SizeOption {
  value: string | number
  label: string
  isCustom?: boolean
  id?: number
}

// Define custom option for "Add New Size"
const CustomOption = (props: OptionProps<SizeOption>) => {
  const { data, children } = props;
  
  return (
    <components.Option {...props}>
      {data.isCustom ? (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          color: 'var(--primary)'
        }}>
          <span>✚</span> {children}
        </div>
      ) : (
        children
      )}
    </components.Option>
  );
};

const CategorySizes = ({ categoryId }: CategorySizesProps) => {
  // State for dropdown selection
  const [selectedOption, setSelectedOption] = useState<SizeOption | null>(null)
  const [sizeToRemove, setSizeToRemove] = useState<{ id: number, name: string } | null>(null)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [isOneSize, setIsOneSize] = useState(false)
  
  // State for new size modal
  const [showAddSizeModal, setShowAddSizeModal] = useState(false)
  const [newSizeName, setNewSizeName] = useState('')
  const [isAddingNewSize, setIsAddingNewSize] = useState(false)
  
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
  const createSize = useCreateSize()
  
  // Filter out sizes that are already associated with this category
  const availableSizes = allSizes.filter(
    size => !categorySizes.some(catSize => catSize.id === size.id)
  )
  
  // Check if "One Size" is already selected
  useEffect(() => {
    const hasOneSize = categorySizes.some(size => size.name === "One Size");
    setIsOneSize(hasOneSize);
  }, [categorySizes])
  
  const handleAddSize = async () => {
    if (!selectedOption || selectedOption.isCustom) {
      toast.error('Please select a valid size')
      return
    }
    
    try {
      const sizeId = typeof selectedOption.value === 'number' ? 
        selectedOption.value : parseInt(selectedOption.value.toString())
      
      await addSizeToCategory.mutateAsync(sizeId)
      toast.success(`Size "${selectedOption.label}" added to category`)
      setSelectedOption(null)
      refetchCategorySizes()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add size to category')
    }
  }
  
  // Handle the creation of a new custom size
  const handleCreateNewSize = async () => {
    if (!newSizeName.trim()) {
      toast.error('Please enter a size name')
      return
    }
    
    setIsAddingNewSize(true)
    
    try {
      // Create the new size
      const newSize = await createSize.mutateAsync({ name: newSizeName.trim() })
      
      // Add it to the current category
      await addSizeToCategory.mutateAsync(newSize.id)
      
      toast.success(`New size "${newSizeName}" created and added to category`)
      setNewSizeName('')
      setShowAddSizeModal(false)
      refetchCategorySizes()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create new size')
    } finally {
      setIsAddingNewSize(false)
    }
  }
  
  const openRemoveDialog = (size: { id: number, name: string }) => {
    setSizeToRemove(size)
    setShowRemoveDialog(true)
  }
  
  // Handle dropdown option selection
  const handleSelectChange = (option: SingleValue<SizeOption>) => {
    if (option?.isCustom) {
      // Open the add new size modal
      setShowAddSizeModal(true)
      setSelectedOption(null)
    } else {
      setSelectedOption(option)
    }
  }
  
  const handleRemoveSize = async () => {
    if (!sizeToRemove) return
    
    try {
      await removeSizeFromCategory.mutateAsync(sizeToRemove.id)
      toast.success(`Size "${sizeToRemove.name}" removed from category`)
      setShowRemoveDialog(false)
      setSizeToRemove(null)
      refetchCategorySizes()
      
      // If we just removed "One Size", update the state
      if (sizeToRemove.name === "One Size") {
        setIsOneSize(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove size from category')
    }
  }
  
  // Handle the "One Size" checkbox
  const handleOneSizeChange = async (checked: boolean) => {
    try {
      if (checked) {
        // Find if "One Size" already exists in the database
        const oneSizeOption = allSizes.find(size => size.name === "One Size");
        let oneSizeId: number;
        
        // If "One Size" doesn't exist in the database, create it
        if (!oneSizeOption) {
          const newSize = await createSize.mutateAsync({ name: "One Size" });
          oneSizeId = newSize.id;
        } else {
          oneSizeId = oneSizeOption.id;
        }
        
        // Add "One Size" to the category
        await addSizeToCategory.mutateAsync(oneSizeId);
        
        // Remove all other sizes from the category
        for (const size of categorySizes) {
          if (size.name !== "One Size") {
            await removeSizeFromCategory.mutateAsync(size.id);
          }
        }
        
        toast.success('Set to "One Size" only');
        setIsOneSize(true);
        refetchCategorySizes();
      } else {
        // Find the "One Size" option in the category sizes
        const oneSizeOption = categorySizes.find(size => size.name === "One Size");
        
        // Remove "One Size" from the category
        if (oneSizeOption) {
          await removeSizeFromCategory.mutateAsync(oneSizeOption.id);
        }
        
        setIsOneSize(false);
        toast.success('Removed "One Size" setting');
        refetchCategorySizes();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update size settings');
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
      
      {/* One Size Checkbox */}
      <div className="one-size-option mb-1">
        <div style={{ 
          backgroundColor: isOneSize ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--card-sectionning-background-color)',
          padding: '0.75rem',
          borderRadius: '8px',
          border: isOneSize ? '1px solid rgba(var(--primary-rgb), 0.3)' : '1px solid var(--muted-border-color)'
        }}>
          <label className="flex items-center gap-1" style={{ cursor: 'pointer', marginBottom: '0.25rem' }}>
            <input
              type="checkbox"
              checked={isOneSize}
              onChange={(e) => handleOneSizeChange(e.target.checked)}
              style={{ margin: 0 }}
            />
            <span style={{ 
              fontWeight: isOneSize ? 'bold' : 'normal',
              color: isOneSize ? 'var(--primary)' : 'inherit'
            }}>
              This is a "One Size" item
            </span>
          </label>
          <div style={{ 
            fontSize: '0.85rem', 
            marginLeft: '1.5rem', 
            color: 'var(--text-secondary)'
          }}>
            {isOneSize ? (
              <p style={{ margin: '0.25rem 0 0 0' }}>
                This category will only have the "One Size" option available. All other sizes will be removed.
              </p>
            ) : (
              <p style={{ margin: '0.25rem 0 0 0' }}>
                Check this box if this item doesn't come in multiple sizes (e.g., accessories, hygiene products).
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Add new size with searchable dropdown */}
      <div className="flex gap-1 mb-1">
        <div style={{ flex: 1, position: 'relative' }}>
          <Select
            value={selectedOption}
            onChange={handleSelectChange}
            options={[
              // Map existing sizes to select options
              ...availableSizes.map(size => ({
                value: size.id,
                label: size.name,
                id: size.id
              })),
              // Add the "Add new size" option at the bottom
              {
                value: 'new',
                label: 'Add custom size...',
                isCustom: true
              }
            ]}
            isDisabled={isOneSize}
            placeholder="Search or select a size to add..."
            isClearable
            components={{ Option: CustomOption }}
            styles={{
              control: (base) => ({
                ...base,
                minHeight: '42px',
                backgroundColor: 'var(--pico-background-color, #fff)',
                color: 'var(--pico-color, #333)',
                borderColor: 'var(--border-color)',
                '&:hover': {
                  borderColor: 'var(--primary)'
                }
              }),
              valueContainer: (base) => ({
                ...base,
                padding: '2px 8px'
              }),
              singleValue: (base) => ({
                ...base,
                color: 'var(--pico-color, #333)'
              }),
              input: (base) => ({
                ...base,
                color: 'var(--pico-color, #333)'
              }),
              placeholder: (base) => ({
                ...base,
                color: 'var(--text-secondary)'
              }),
              menu: (base) => ({
                ...base,
                zIndex: 10,
                backgroundColor: 'var(--pico-background-color, #fff)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                borderRadius: '6px'
              }),
              menuList: (base) => ({
                ...base,
                backgroundColor: 'var(--pico-background-color, #fff)',
                color: 'var(--pico-color, #333)'
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isSelected 
                  ? 'rgba(var(--primary-rgb), 0.1)' 
                  : state.isFocused 
                    ? 'rgba(var(--primary-rgb), 0.05)'
                    : 'var(--pico-background-color, #fff)',
                color: state.isSelected 
                  ? 'var(--primary)' 
                  : 'var(--pico-color, #333)',
                '&:active': {
                  backgroundColor: 'rgba(var(--primary-rgb), 0.15)'
                }
              })
            }}
          />
        </div>
        
        <button 
          onClick={handleAddSize} 
          disabled={!selectedOption || selectedOption.isCustom || addSizeToCategory.isPending || isOneSize}
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
                border: size.name === "One Size" && isOneSize ? '1px solid var(--primary)' : '1px solid var(--muted-border-color)',
                borderRadius: '2em',
                fontWeight: size.name === "One Size" && isOneSize ? 'bold' : 'normal'
              }}
            >
              {size.name}
              <button 
                onClick={() => openRemoveDialog({ id: size.id, name: size.name })}
                disabled={removeSizeFromCategory.isPending || (size.name === "One Size" && isOneSize)}
                style={{ 
                  marginLeft: '0.5em',
                  background: 'none',
                  border: 'none',
                  padding: '0 0.25em',
                  cursor: size.name === "One Size" && isOneSize ? 'not-allowed' : 'pointer',
                  fontSize: '1em',
                  color: size.name === "One Size" && isOneSize ? 'var(--muted-color)' : 'var(--primary)',
                  opacity: size.name === "One Size" && isOneSize ? '0.5' : '1'
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
      
      {/* Confirmation Dialog for Size Removal */}
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
      
      {/* Modal for Adding New Size */}
      {showAddSizeModal && (
        <div className="modal-backdrop">
          <dialog open className="add-size-modal" style={{ backgroundColor: 'var(--pico-background-color, #fff)', color: 'var(--pico-color, #333)' }}>
            <div className="modal-header" style={{ 
              backgroundColor: 'var(--pico-background-color, var(--card-sectionning-background-color))',
              borderBottom: '1px solid var(--pico-muted-border-color, var(--border-color))'
            }}>
              <h3>Add New Size</h3>
              <button 
                onClick={() => setShowAddSizeModal(false)}
                className="close-button"
                aria-label="Close"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0',
                  marginLeft: 'auto',
                  color: 'var(--color)'
                }}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <p>Create a new custom size for your inventory.</p>
              
              <div className="form-group">
                <label htmlFor="newSizeName">Size Name</label>
                <input
                  type="text"
                  id="newSizeName"
                  value={newSizeName}
                  onChange={(e) => setNewSizeName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newSizeName.trim() && !isAddingNewSize) {
                      e.preventDefault();
                      handleCreateNewSize();
                    }
                  }}
                  placeholder="Enter size name (e.g., 3T, XXL, 16W)"
                  autoFocus
                  style={{ 
                    width: '100%',
                    backgroundColor: 'var(--pico-background-color, #fff)',
                    color: 'var(--pico-color, #333)',
                    borderColor: 'var(--pico-muted-border-color, var(--border-color))'
                  }}
                />
                
                {/* Size presets */}
                <div style={{ marginTop: '0.75rem' }}>
                  <label style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    Common Size Presets:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                    {/* Adult clothing presets */}
                    <div>
                      <div style={{ fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Adult:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].map(size => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setNewSizeName(size)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.8rem',
                              backgroundColor: newSizeName === size ? 'var(--primary)' : 'var(--background-color)',
                              color: newSizeName === size ? 'white' : 'var(--color)',
                              border: `1px solid ${newSizeName === size ? 'var(--primary)' : 'var(--border-color)'}`,
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Kid's clothing presets */}
                    <div>
                      <div style={{ fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Kids:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {['2T', '3T', '4T', '5T', '6', '8', '10', '12', '14', '16'].map(size => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setNewSizeName(size)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.8rem',
                              backgroundColor: newSizeName === size ? 'var(--primary)' : 'var(--background-color)',
                              color: newSizeName === size ? 'white' : 'var(--color)',
                              border: `1px solid ${newSizeName === size ? 'var(--primary)' : 'var(--border-color)'}`,
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="form-help" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                  <p>Tips for consistent size naming:</p>
                  <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                    <li>Use standard formats: S, M, L, XL, XXL</li>
                    <li>For children's sizes, use 2T, 3T, 4T format</li>
                    <li>For numerical sizes, use simple numbers: 6, 8, 10</li>
                    <li>For specialized sizes, add a suffix: 16W, 34P</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="modal-footer" style={{ 
              backgroundColor: 'var(--pico-background-color, var(--card-sectionning-background-color))',
              borderTop: '1px solid var(--pico-muted-border-color, var(--border-color))',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.5rem',
              padding: '1rem'
            }}>
              <button 
                onClick={() => setShowAddSizeModal(false)}
                className="secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateNewSize}
                className="primary"
                disabled={!newSizeName.trim() || isAddingNewSize}
              >
                {isAddingNewSize ? 'Creating...' : 'Create Size'}
              </button>
            </div>
          </dialog>
        </div>
      )}
    </div>
  )
}

export default CategorySizes