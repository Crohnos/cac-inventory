import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, ArrowLeft, RefreshCw, Plus, Minus, AlertTriangle, ShoppingCart } from 'lucide-react';
import { QRCodeDisplay } from '../components/shared/QRCodeDisplay';
import { itemService } from '../services/itemService';
import { useLocationStore } from '../stores/locationStore';
import { useUIStore } from '../stores/uiStore';
import { useCartStore } from '../stores/cartStore';
import type { Item, ItemSize } from '../stores/inventoryStore';

export const ItemDetailPage: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const [item, setItem] = React.useState<Item | null>(null);
  const [itemSizes, setItemSizes] = React.useState<ItemSize[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  const { getCurrentLocation } = useLocationStore();
  const { addToast } = useUIStore();
  const { addItem, getItemCount } = useCartStore();
  const currentLocation = getCurrentLocation();
  
  const loadItemData = React.useCallback(async () => {
    if (!itemId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [itemData, sizesData] = await Promise.all([
        itemService.getItemById(parseInt(itemId)),
        itemService.getItemSizes(parseInt(itemId)) // Get sizes for ALL locations
      ]);
      
      setItem(itemData);
      setItemSizes(sizesData);
    } catch (error: any) {
      console.error('Failed to load item:', error);
      setError(error.message);
      addToast({
        type: 'error',
        title: 'Failed to load item',
        message: error.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [itemId, addToast]);

  React.useEffect(() => {
    loadItemData();
  }, [loadItemData]);

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  // Group sizes by size_label and location
  const sizeGroups = React.useMemo(() => {
    const groups: Record<string, ItemSize[]> = {};
    itemSizes.forEach(size => {
      if (!groups[size.size_label]) {
        groups[size.size_label] = [];
      }
      groups[size.size_label].push(size);
    });
    
    // Sort each group by location name
    Object.keys(groups).forEach(sizeLabel => {
      groups[sizeLabel].sort((a, b) => (a.location_name || '').localeCompare(b.location_name || ''));
    });
    
    return groups;
  }, [itemSizes]);
  
  const totalQuantity = itemSizes.reduce((sum, size) => sum + size.current_quantity, 0);
  const lowStockSizes = itemSizes.filter(size => 
    size.current_quantity <= (size.min_stock_level || 5)
  );
  const lowStockCount = lowStockSizes.length;

  const handleQuantityAdjustment = async (sizeId: number, adjustment: number) => {
    try {
      await itemService.adjustQuantity(sizeId, adjustment);
      await loadItemData(); // Refresh data
      addToast({
        type: 'success',
        title: 'Quantity updated',
        message: `${adjustment > 0 ? 'Added' : 'Removed'} ${Math.abs(adjustment)} item(s)`
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to update quantity',
        message: error.message
      });
    }
  };

  const handleAddToCart = (size: ItemSize, quantity: number = 1) => {
    if (!currentLocation || !item) return;
    
    // Check if there's enough stock
    if (size.current_quantity < quantity) {
      addToast({
        type: 'error',
        title: 'Insufficient Stock',
        message: `Only ${size.current_quantity} ${item.unit_type || 'items'} available`
      });
      return;
    }
    
    addItem({
      item_id: item.item_id,
      size_id: size.size_id,
      item_name: item.name,
      size_label: size.size_label,
      quantity: quantity,
      location_id: currentLocation.location_id,
      unit_type: item.unit_type
    });
    
    addToast({
      type: 'success',
      title: 'Added to Cart',
      message: `${quantity} ${size.size_label} ${item.name} added to cart`
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="bg-white rounded-lg shadow p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link to="/" className="px-6 py-4 text-lg font-semibold rounded-lg transition-colors min-h-[48px] bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Item Not Found</h2>
          <p className="text-gray-600">
            {error || `No item found with ID: ${itemId}`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="px-6 py-4 text-lg font-semibold rounded-lg transition-colors min-h-[48px] bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
            <p className="text-gray-600">
              {currentLocation?.name} • {item.description || 'No description'}
            </p>
          </div>
        </div>
        
        <button
          onClick={loadItemData}
          disabled={isLoading}
          className="px-6 py-4 text-lg font-semibold rounded-lg transition-colors min-h-[48px] bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Code & Item Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code</h3>
              <QRCodeDisplay 
                qrCode={item.qr_code}
                itemName={item.name}
                size="medium"
                showActions={true}
              />
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Item Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Storage Location:</span>
                  <span className="font-medium">{item.storage_location || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Unit Type:</span>
                  <span className="font-medium">{item.unit_type || 'each'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Has Sizes:</span>
                  <span className="font-medium">{item.has_sizes ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Min Stock Level:</span>
                  <span className="font-medium">{item.min_stock_level || 5}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Management */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Inventory Management</h3>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Total: {totalQuantity}</span>
                </div>
                {lowStockCount > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Low Stock: {lowStockCount}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {Object.keys(sizeGroups).length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No inventory data found</p>
                </div>
              ) : (
                Object.entries(sizeGroups).map(([sizeLabel, sizes]) => {
                  const totalForSize = sizes.reduce((sum, size) => sum + size.current_quantity, 0);
                  const hasLowStock = sizes.some(size => 
                    size.current_quantity <= (size.min_stock_level || 5)
                  );
                  const hasOutOfStock = sizes.some(size => size.current_quantity === 0);
                  
                  return (
                    <div
                      key={sizeLabel}
                      className={`border rounded-lg p-4 ${
                        hasOutOfStock 
                          ? 'border-red-200 bg-red-50' 
                          : hasLowStock 
                            ? 'border-yellow-200 bg-yellow-50'
                            : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="font-medium text-gray-900">
                              {sizeLabel}
                            </div>
                            <div className="text-sm text-gray-500">
                              Total: {totalForSize} {item.unit_type || 'units'}
                            </div>
                          </div>
                          {(hasLowStock || hasOutOfStock) && (
                            <AlertTriangle 
                              className={`h-5 w-5 ${
                                hasOutOfStock ? 'text-red-500' : 'text-yellow-500'
                              }`} 
                            />
                          )}
                        </div>
                      </div>
                      
                      {/* Per-location breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {sizes
                          .filter(size => !currentLocation || size.location_id === currentLocation.location_id)
                          .map((size) => {
                          const isLowStock = size.current_quantity <= (size.min_stock_level || 5);
                          const isOutOfStock = size.current_quantity === 0;
                          const cartQuantity = getItemCount(item.item_id, size.size_id);
                          
                          return (
                            <div
                              key={size.size_id}
                              className={`border rounded-lg p-4 ${
                                isOutOfStock 
                                  ? 'border-red-300 bg-red-50' 
                                  : isLowStock 
                                    ? 'border-yellow-300 bg-yellow-50'
                                    : 'border-gray-300 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <div className="text-xs font-medium text-gray-700 mb-1">
                                    {size.location_name || 'Unknown Location'}
                                  </div>
                                  <div className="text-lg font-semibold text-gray-900">
                                    {size.current_quantity} {item.unit_type || 'units'}
                                  </div>
                                  {cartQuantity > 0 && (
                                    <div className="text-xs text-blue-600">
                                      {cartQuantity} in cart
                                    </div>
                                  )}
                                </div>
                                {(isLowStock || isOutOfStock) && (
                                  <AlertTriangle 
                                    className={`h-4 w-4 ${
                                      isOutOfStock ? 'text-red-500' : 'text-yellow-500'
                                    }`} 
                                  />
                                )}
                              </div>
                              
                              {/* Action buttons */}
                              <div className="space-y-2">
                                {/* Add to Cart */}
                                <button
                                  onClick={() => handleAddToCart(size, 1)}
                                  disabled={isOutOfStock}
                                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-500 text-blue-700 rounded-lg transition-colors"
                                >
                                  <ShoppingCart className="h-4 w-4" />
                                  <span>Add to Cart</span>
                                </button>
                                
                                {/* Inventory adjustment */}
                                <div className="flex items-center justify-center space-x-2">
                                  <span className="text-xs text-gray-500">Stock:</span>
                                  <button
                                    onClick={() => handleQuantityAdjustment(size.size_id, -1)}
                                    disabled={size.current_quantity === 0}
                                    className="w-7 h-7 rounded-full bg-red-100 hover:bg-red-200 disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                                    title="Remove from stock"
                                  >
                                    <Minus className="h-3 w-3 text-red-600" />
                                  </button>
                                  <span className="text-sm font-medium min-w-[2rem] text-center">
                                    {size.current_quantity}
                                  </span>
                                  <button
                                    onClick={() => handleQuantityAdjustment(size.size_id, 1)}
                                    className="w-7 h-7 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center transition-colors"
                                    title="Add to stock"
                                  >
                                    <Plus className="h-3 w-3 text-green-600" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};