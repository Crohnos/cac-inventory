import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, Plus, Minus, ArrowRightLeft, MapPin, AlertCircle } from 'lucide-react';
import { useLocationStore } from '../stores/locationStore';
import { useCartStore } from '../stores/cartStore';
import { useUIStore } from '../stores/uiStore';
import { useInventoryStore } from '../stores/inventoryStore';

export const QRActionPage: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  
  const [item, setItem] = React.useState<any>(null);
  const [itemSizes, setItemSizes] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedAction, setSelectedAction] = React.useState<'ADD' | 'REMOVE' | 'TRANSFER' | null>(null);
  const [quantities, setQuantities] = React.useState<Record<number, number>>({});
  
  const { addToast } = useUIStore();
  const { getCurrentLocation } = useLocationStore();
  const { addItem: addToCart } = useCartStore();
  const { fetchItemById, fetchItemSizes, adjustQuantity: adjustItemQuantity } = useInventoryStore();

  const currentLocation = getCurrentLocation();

  // Load item data by ID
  React.useEffect(() => {
    const loadItemData = async () => {
      if (!itemId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Get item by ID
        const itemData = await fetchItemById(parseInt(itemId));
        setItem(itemData);
        
        // Get sizes for current location
        if (currentLocation) {
          const sizesData = await fetchItemSizes(itemData.item_id, currentLocation.location_id);
          setItemSizes(sizesData);
          
          // Initialize quantities state
          const initialQuantities: Record<number, number> = {};
          sizesData.forEach(size => {
            initialQuantities[size.size_id] = 0;
          });
          setQuantities(initialQuantities);
        }
      } catch (error: any) {
        console.error('Failed to load item:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadItemData();
  }, [itemId, currentLocation]);

  const handleQuantityChange = (sizeId: number, value: number) => {
    setQuantities(prev => ({
      ...prev,
      [sizeId]: Math.max(0, value)
    }));
  };

  const handleAction = async () => {
    if (!selectedAction || !item || !currentLocation) return;
    
    const sizesToProcess = itemSizes.filter(size => quantities[size.size_id] > 0);
    
    if (sizesToProcess.length === 0) {
      addToast({
        type: 'warning',
        title: 'No quantities specified',
        message: 'Please enter quantities for the items you want to process.'
      });
      return;
    }

    try {
      if (selectedAction === 'ADD') {
        // Add to inventory (restock)
        for (const size of sizesToProcess) {
          await adjustItemQuantity(size.size_id, quantities[size.size_id]);
        }
        
        addToast({
          type: 'success',
          title: 'Inventory Updated',
          message: `Added ${sizesToProcess.length} size(s) to inventory`
        });
        
      } else if (selectedAction === 'REMOVE') {
        // Add to cart for checkout
        for (const size of sizesToProcess) {
          addToCart({
            item_id: item.item_id,
            size_id: size.size_id,
            item_name: item.name,
            size_label: size.size_label,
            quantity: quantities[size.size_id],
            location_id: currentLocation.location_id,
            unit_type: item.unit_type
          });
        }
        
        addToast({
          type: 'success',
          title: 'Added to Cart',
          message: `Added ${sizesToProcess.length} item(s) to cart for checkout`
        });
        
      } else if (selectedAction === 'TRANSFER') {
        // This would open a transfer modal - for now, show a message
        addToast({
          type: 'info',
          title: 'Transfer Feature',
          message: 'Transfer functionality coming soon!'
        });
      }
      
      // Reset form
      setSelectedAction(null);
      setQuantities(prev => {
        const reset: Record<number, number> = {};
        Object.keys(prev).forEach(key => {
          reset[parseInt(key)] = 0;
        });
        return reset;
      });
      
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: error.message
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900">Loading Item...</h2>
          <p className="text-gray-600">Item ID: {itemId}</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Item Not Found</h2>
          <p className="text-gray-600 mb-4">
            {error || `No item found with ID: ${itemId}`}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-4 text-lg font-semibold rounded-lg transition-colors min-h-[48px] bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 w-full"
          >
            Go to Inventory
          </button>
        </div>
      </div>
    );
  }

  if (!currentLocation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
          <MapPin className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Select Location</h2>
          <p className="text-gray-600 mb-4">
            Please select a location to manage inventory for this item.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-4 text-lg font-semibold rounded-lg transition-colors min-h-[48px] bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 w-full"
          >
            Select Location
          </button>
        </div>
      </div>
    );
  }

  const totalItems = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{item.name}</h1>
              <p className="text-sm text-gray-500">{currentLocation.name}</p>
            </div>
          </div>
          {item.description && (
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
              {itemSizes.map((size) => (
                <div key={size.size_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{size.size_label}</div>
                    <div className="text-sm text-gray-500">
                      Current: {size.current_quantity} {item.unit_type || 'units'}
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
            onClick={handleAction}
            className="w-full px-6 py-4 text-lg font-semibold rounded-lg transition-colors min-h-[48px] bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 py-4 text-lg"
          >
            {selectedAction === 'ADD' && `Add ${totalItems} Items to Inventory`}
            {selectedAction === 'REMOVE' && `Remove ${totalItems} Items (Add to Cart)`}
            {selectedAction === 'TRANSFER' && `Transfer ${totalItems} Items`}
          </button>
        )}
        
        {/* Back to Inventory */}
        <button
          onClick={() => navigate('/')}
          className="w-full px-6 py-4 text-lg font-semibold rounded-lg transition-colors min-h-[48px] bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 py-3"
        >
          Back to Full Inventory
        </button>
      </div>
    </div>
  );
};