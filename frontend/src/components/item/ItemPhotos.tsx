import { useState, useRef } from 'react'
import { 
  useItemPhotos,
  useUploadPhoto,
  useDeletePhoto,
  useToastContext
} from '../../hooks'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorDisplay from '../common/ErrorDisplay'
import ConfirmationDialog from '../common/ConfirmationDialog'

interface ItemPhotosProps {
  itemId: number
}

const ItemPhotos = ({ itemId }: ItemPhotosProps) => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [description, setDescription] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [photoToDelete, setPhotoToDelete] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const toast = useToastContext()
  
  // Fetch photos for this item
  const { 
    data: photos = [], 
    isLoading, 
    error,
    refetch 
  } = useItemPhotos(itemId)
  
  // Mutations
  const uploadPhoto = useUploadPhoto(itemId)
  const deletePhoto = useDeletePhoto(itemId)
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files)
  }
  
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error('Please select a file to upload')
      return
    }
    
    setIsUploading(true)
    
    try {
      // Upload each file sequentially
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        await uploadPhoto.mutateAsync({ file, description })
      }
      
      toast.success(`Successfully uploaded ${selectedFiles.length} photo(s)`)
      
      // Reset form
      setSelectedFiles(null)
      setDescription('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Refresh photos
      refetch()
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload photo')
    } finally {
      setIsUploading(false)
    }
  }
  
  const openDeleteDialog = (photoId: number) => {
    setPhotoToDelete(photoId)
    setShowDeleteDialog(true)
  }
  
  const handleDelete = async () => {
    if (photoToDelete === null) return
    
    try {
      await deletePhoto.mutateAsync(photoToDelete)
      toast.success('Photo deleted successfully')
      setShowDeleteDialog(false)
      setPhotoToDelete(null)
      refetch()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete photo')
    }
  }
  
  if (isLoading) {
    return <LoadingSpinner text="Loading photos..." />
  }
  
  if (error) {
    return <ErrorDisplay error={error as Error} retry={refetch} />
  }
  
  return (
    <div className="card">
      <h3>Photos</h3>
      
      {/* Upload form */}
      <form onSubmit={handleUpload} className="mb-1">
        <div className="grid">
          <label htmlFor="photo">
            Select Image(s)
            <input
              type="file"
              id="photo"
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={handleFileChange}
              required
            />
          </label>
          
          <label htmlFor="description">
            Description (optional)
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description for the photo(s)"
            />
          </label>
        </div>
        
        <button 
          type="submit" 
          disabled={isUploading || !selectedFiles || selectedFiles.length === 0}
          className="mt-1"
        >
          {isUploading ? 'Uploading...' : 'Upload Photo(s)'}
        </button>
      </form>
      
      {/* Photo gallery */}
      {photos.length === 0 ? (
        <p><em>No photos uploaded for this item.</em></p>
      ) : (
        <div className="photo-gallery">
          {photos.map(photo => (
            <div key={photo.id} className="photo-item">
              <img 
                src={photo.url} 
                alt={photo.description || `Photo ${photo.id}`} 
                title={photo.description || `Photo ${photo.id}`}
              />
              <div className="photo-actions">
                <button 
                  onClick={() => openDeleteDialog(photo.id)}
                  className="delete-photo"
                  aria-label="Delete photo"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    border: 'none',
                    borderRadius: '50%',
                    padding: '4px 8px',
                    fontSize: '14px',
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        title="Delete Photo"
        message="Are you sure you want to delete this photo? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        confirmButtonClass="contrast"
      />
    </div>
  )
}

export default ItemPhotos