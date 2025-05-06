import { useParams } from '@tanstack/react-router'
import { useEffect } from 'react'
import { ItemParams } from '../types/routeTypes'
import { useDetail, useToastContext } from '../hooks'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorDisplay from '../components/common/ErrorDisplay'
import ItemHeader from '../components/item/ItemHeader'
import ItemQrCode from '../components/item/ItemQrCode'
import ItemPhotos from '../components/item/ItemPhotos'
import ItemActions from '../components/item/ItemActions'

const ItemDetailPage = () => {
  const { itemId: itemIdParam } = useParams({ from: '/items/$itemId' }) as ItemParams
  const itemId = parseInt(itemIdParam)
  const toast = useToastContext()
  
  // Fetch item data
  const { 
    data: item, 
    isLoading, 
    error,
    refetch
  } = useDetail(itemId)
  
  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error('Failed to load item details')
    }
  }, [error, toast])
  
  if (isLoading) {
    return <LoadingSpinner text="Loading item details..." />
  }
  
  if (error) {
    return <ErrorDisplay error={error as Error} retry={refetch} />
  }
  
  return (
    <div>
      <h1>Item Details</h1>
      
      {/* Item Header */}
      <ItemHeader 
        item={item!} 
        onRefresh={refetch} 
      />
      
      {/* Item Actions */}
      <ItemActions 
        item={item!} 
        onRefresh={refetch} 
      />
      
      {/* QR Code */}
      <ItemQrCode 
        qrCodeValue={item!.qrCodeValue} 
        qrCodeDataUrl={item!.qrCodeDataUrl} 
      />
      
      {/* Item Photos */}
      <ItemPhotos itemId={itemId} />
    </div>
  )
}

export default ItemDetailPage