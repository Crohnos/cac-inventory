import React from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Package, ArrowLeft, RefreshCw, Plus, Minus, AlertTriangle, ShoppingCart, ArrowRightLeft, History } from 'lucide-react';
import { QRCodeDisplay } from '../components/shared/QRCodeDisplay';
import { TransactionHistory } from '../components/inventory/TransactionHistory';
import { itemService } from '../services/itemService';
import { useLocationStore } from '../stores/locationStore';
import { useUIStore } from '../stores/uiStore';
import { useCartStore } from '../stores/cartStore';
import type { Item, ItemSize } from '../stores/inventoryStore';

export const ItemDetailPage: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const [searchParams] = useSearchParams();
  const isQRMode = searchParams.get('qr') === 'true';
  const [item, setItem] = React.useState<Item | null>(null);
  const [itemSizes, setItemSizes] = React.useState<ItemSize[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedAction, setSelectedAction] = React.useState<'ADD' | 'REMOVE' | 'TRANSFER' | null>(null);
  const [quantities, setQuantities] = React.useState<Record<number, number>>({});
  const [activeTab, setActiveTab] = React.useState<'inventory' | 'history'>('inventory');
  const [editingQuantities, setEditingQuantities] = React.useState<Record<number, string>>({});
  
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

  // Initialize quantities for QR mode
  React.useEffect(() => {
    if (isQRMode && itemSizes.length > 0) {
      const initialQuantities: Record<number, number> = {};
      itemSizes.forEach(size => {
        if (size.location_id === currentLocation?.location_id) {
          initialQuantities[size.size_id] = 0;
        }
      });
      setQuantities(initialQuantities);
    }
  }, [isQRMode, itemSizes, currentLocation]);

  // Mobile QR handlers
  const handleQuantityChange = (sizeId: number, value: number) => {
    setQuantities(prev => ({
      ...prev,
      [sizeId]: Math.max(0, value)
    }));
  };

  const handleMobileAction = async () => {
    if (!selectedAction || !item || !currentLocation) return;
    
    const currentLocationSizes = itemSizes.filter(size => 
      size.location_id === currentLocation.location_id && quantities[size.size_id] > 0
    );
    
    if (currentLocationSizes.length === 0) {
      addToast({
        type: 'warning',
        title: 'No quantities specified',
        message: 'Please enter quantities for the items you want to process.'
      });
      return;
    }

    try {
      if (selectedAction === 'ADD') {
        for (const size of currentLocationSizes) {
          await itemService.adjustQuantity(size.size_id, quantities[size.size_id]);
        }
        addToast({
          type: 'success',
          title: 'Inventory Updated',
          message: `Added ${currentLocationSizes.length} size(s) to inventory`
        });
      } else if (selectedAction === 'REMOVE') {
        for (const size of currentLocationSizes) {
          addItem({
            item_id: item.item_id,
            size_id: size.size_id,
            item_name: item.name,
            size_label: size.size_label,
            quantity: quantities[size.size_id],
            location_id: currentLocation.location_id,
            unit_type: item.unit_type || 'each'
          });
        }
        addToast({
          type: 'success',
          title: 'Added to Cart',
          message: `Added ${currentLocationSizes.length} item(s) to cart for checkout`
        });
      } else if (selectedAction === 'TRANSFER') {
        addToast({
          type: 'info',
          title: 'Transfer Feature',
          message: 'Transfer functionality coming soon!'
        });
      }
      
      // Reset form
      setSelectedAction(null);
      const resetQuantities: Record<number, number> = {};
      Object.keys(quantities).forEach(key => {
        resetQuantities[parseInt(key)] = 0;
      });
      setQuantities(resetQuantities);
      
      // Reload data
      loadItemData();
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: error.message
      });
    }
  };

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

  const handleQuantityUpdate = async (sizeId: number, newQuantity: number) => {
    const currentSize = itemSizes.find(size => size.size_id === sizeId);
    if (!currentSize) return;

    const currentQuantity = currentSize.current_quantity;
    const adjustment = newQuantity - currentQuantity;
    
    if (adjustment === 0) {
      addToast({
        type: 'info',
        title: 'No Change',
        message: 'Quantity is already at the desired value'
      });
      return;
    }

    try {
      const updatedSize = await itemService.adjustQuantity(
        sizeId, 
        adjustment, 
        'Admin', // TODO: Get actual admin name from user context
        `Manual quantity adjustment: ${currentQuantity} → ${newQuantity}`
      );
      
      // Update only the specific item size in state instead of reloading all data
      setItemSizes(prevSizes => 
        prevSizes.map(size => 
          size.size_id === sizeId 
            ? { ...size, current_quantity: updatedSize.current_quantity }
            : size
        )
      );
      
      // Clear the editing state
      setEditingQuantities(prev => {
        const updated = { ...prev };
        delete updated[sizeId];
        return updated;
      });
      
      addToast({
        type: 'success',
        title: 'Quantity Updated',
        message: `Changed from ${currentQuantity} to ${newQuantity} (${adjustment > 0 ? '+' : ''}${adjustment})`
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to update quantity',
        message: error.message
      });
    }
  };

  const handleQuantityInputChange = (sizeId: number, value: string) => {
    setEditingQuantities(prev => ({
      ...prev,
      [sizeId]: value
    }));
  };

  const handleQuantityInputSubmit = (sizeId: number) => {
    const inputValue = editingQuantities[sizeId];
    const newQuantity = parseInt(inputValue);
    
    if (isNaN(newQuantity) || newQuantity < 0) {
      addToast({
        type: 'error',
        title: 'Invalid Quantity',
        message: 'Please enter a valid non-negative number'
      });
      return;
    }
    
    handleQuantityUpdate(sizeId, newQuantity);
  };

  const handleQuantityInputCancel = (sizeId: number) => {
    setEditingQuantities(prev => {
      const updated = { ...prev };
      delete updated[sizeId];
      return updated;
    });
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

  // Mobile QR Mode View
  if (isQRMode) {
    const currentLocationSizes = itemSizes.filter(size => size.location_id === currentLocation?.location_id);
    const totalItems = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{item?.name}</h1>
                <p className="text-sm text-gray-500">{currentLocation?.name}</p>
              </div>
            </div>
            {item?.description && (
              <p className="text-gray-600 mt-2 text-sm">{item.description}</p>
            )}
          </div>
        </div>

        <div className="max-w-md mx-auto p-4 space-y-6">
          {/* Action Selection */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold text-gray-900 mb-4">What would you like to do?</h2>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setSelectedAction('ADD')}
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                  selectedAction === 'ADD'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Plus className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-medium">Add to Inventory</div>
                  <div className="text-sm opacity-75">Restock items</div>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedAction('REMOVE')}
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                  selectedAction === 'REMOVE'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Minus className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-medium">Remove from Inventory</div>
                  <div className="text-sm opacity-75">Checkout items</div>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedAction('TRANSFER')}
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                  selectedAction === 'TRANSFER'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <ArrowRightLeft className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-medium">Transfer</div>
                  <div className="text-sm opacity-75">Move between locations</div>
                </div>
              </button>
            </div>
          </div>

          {/* Size Selection */}
          {selectedAction && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Select Quantities</h3>
              <div className="space-y-3">
                {currentLocationSizes.map((size) => (
                  <div key={size.size_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{size.size_label}</div>
                      <div className="text-sm text-gray-500">
                        Current: {size.current_quantity} {item?.unit_type || 'units'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleQuantityChange(size.size_id, (quantities[size.size_id] || 0) - 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={quantities[size.size_id] || 0}
                        onChange={(e) => handleQuantityChange(size.size_id, parseInt(e.target.value) || 0)}
                        className="w-16 text-center border rounded px-2 py-1"
                      />
                      <button
                        onClick={() => handleQuantityChange(size.size_id, (quantities[size.size_id] || 0) + 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          {selectedAction && totalItems > 0 && (
            <button
              onClick={handleMobileAction}
              className="w-full px-6 py-4 text-lg font-semibold rounded-lg transition-colors min-h-[48px] bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
            >
              {selectedAction === 'ADD' && `Add ${totalItems} Items to Inventory`}
              {selectedAction === 'REMOVE' && `Remove ${totalItems} Items (Add to Cart)`}
              {selectedAction === 'TRANSFER' && `Transfer ${totalItems} Items`}
            </button>
          )}
          
          {/* Back to Full View */}
          <Link
            to={`/items/${itemId}`}
            className="block w-full px-6 py-4 text-lg font-semibold rounded-lg transition-colors min-h-[48px] bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 text-center"
          >
            View Full Details
          </Link>
        </div>
      </div>
    );
  }

  // Regular Desktop View
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 md:gap-4">
        <Link
          to="/"
          className="px-4 md:px-6 py-3 md:py-4 text-base md:text-lg font-semibold rounded-lg transition-colors min-h-[48px] bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 flex items-center justify-center w-full sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 break-words">{item.name}</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 break-words">
            {currentLocation?.name} • {item.description || 'No description'}
          </p>
        </div>

        <button
          onClick={loadItemData}
          disabled={isLoading}
          className="px-4 md:px-6 py-3 md:py-4 text-base md:text-lg font-semibold rounded-lg transition-colors min-h-[48px] bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 flex items-center justify-center space-x-2 w-full sm:w-auto flex-shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* QR Code & Item Info */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="bg-white rounded-lg shadow p-4 md:p-6 space-y-4 md:space-y-6">
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">QR Code</h3>
              <QRCodeDisplay
                qrCode={item.qr_code}
                itemId={item.item_id}
                itemName={item.name}
                size="medium"
                showActions={true}
              />
            </div>

            <div className="border-t pt-3 md:pt-4">
              <h4 className="font-medium text-gray-900 mb-2 md:mb-3 text-sm md:text-base">Item Information</h4>
              <div className="space-y-2 text-xs md:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Storage Location:</span>
                  <span className="font-medium text-right truncate ml-2">{item.storage_location || 'Not specified'}</span>
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

        {/* Main Content Area with Tabs */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <div className="bg-white rounded-lg shadow">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 overflow-x-auto">
              <nav className="flex min-w-full">
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`flex-1 sm:flex-none px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'inventory'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Package className="h-4 w-4 inline mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Inventory Management</span>
                  <span className="sm:hidden">Inventory</span>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 sm:flex-none px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'history'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <History className="h-4 w-4 inline mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Transaction History</span>
                  <span className="sm:hidden">History</span>
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-3 sm:p-4 md:p-6">
              {activeTab === 'inventory' ? (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900">Inventory Management</h3>
              <div className="flex items-center space-x-3 md:space-x-4 text-xs md:text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <span className="whitespace-nowrap">Total: {totalQuantity}</span>
                </div>
                {lowStockCount > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                    <span className="whitespace-nowrap">Low Stock: {lowStockCount}</span>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {sizes
                          .filter(size => !currentLocation || size.location_id === currentLocation.location_id)
                          .map((size) => {
                          const isLowStock = size.current_quantity <= (size.min_stock_level || 5);
                          const isOutOfStock = size.current_quantity === 0;
                          const cartQuantity = getItemCount(item.item_id, size.size_id);

                          return (
                            <div
                              key={size.size_id}
                              className={`border rounded-lg p-3 md:p-4 ${
                                isOutOfStock
                                  ? 'border-red-300 bg-red-50'
                                  : isLowStock
                                    ? 'border-yellow-300 bg-yellow-50'
                                    : 'border-gray-300 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2 md:mb-3">
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-medium text-gray-700 mb-1 truncate">
                                    {size.location_name || 'Unknown Location'}
                                  </div>
                                  <div className="text-base md:text-lg font-semibold text-gray-900">
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
                                    className={`h-4 w-4 flex-shrink-0 ml-2 ${
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
                                  className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 text-xs md:text-sm bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-500 text-blue-700 rounded-lg transition-colors min-h-[44px]"
                                >
                                  <ShoppingCart className="h-4 w-4" />
                                  <span>Add to Cart</span>
                                </button>
                                
                                {/* Inventory adjustment */}
                                <div className="flex items-center justify-center space-x-2">
                                  <span className="text-xs text-gray-500">Stock:</span>
                                  {editingQuantities[size.size_id!] !== undefined ? (
                                    // Editing mode - show input field
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        min="0"
                                        value={editingQuantities[size.size_id!]}
                                        onChange={(e) => handleQuantityInputChange(size.size_id!, e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleQuantityInputSubmit(size.size_id!);
                                          } else if (e.key === 'Escape') {
                                            handleQuantityInputCancel(size.size_id!);
                                          }
                                        }}
                                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-center"
                                        placeholder="0"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => handleQuantityInputSubmit(size.size_id!)}
                                        className="w-6 h-6 rounded bg-green-100 hover:bg-green-200 flex items-center justify-center transition-colors"
                                        title="Save quantity"
                                      >
                                        <span className="text-xs text-green-600">✓</span>
                                      </button>
                                      <button
                                        onClick={() => handleQuantityInputCancel(size.size_id!)}
                                        className="w-6 h-6 rounded bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
                                        title="Cancel edit"
                                      >
                                        <span className="text-xs text-red-600">✕</span>
                                      </button>
                                    </div>
                                  ) : (
                                    // Display mode - show current quantity (clickable)
                                    <button
                                      onClick={() => handleQuantityInputChange(size.size_id!, size.current_quantity.toString())}
                                      className="text-sm font-medium min-w-[2rem] text-center px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                                      title="Click to edit quantity"
                                    >
                                      {size.current_quantity}
                                    </button>
                                  )}
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
              ) : (
                <TransactionHistory 
                  itemId={item.item_id} 
                  itemName={item.name} 
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};