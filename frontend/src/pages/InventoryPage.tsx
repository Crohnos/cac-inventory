import React from 'react';
import { RefreshCw, Filter } from 'lucide-react';
import { ItemsTable } from '../components/inventory/ItemsTable';
import { useInventory } from '../hooks/useInventory';
import { useInventoryStore } from '../stores/inventoryStore';
import { useLocationStore } from '../stores/locationStore';

export const InventoryPage: React.FC = () => {
  const { filteredItems, isLoading, refreshItems } = useInventory();
  const { 
    showLowStock, 
    setShowLowStock,
    getLowStockItems 
  } = useInventoryStore();
  const { getCurrentLocation } = useLocationStore();
  
  const currentLocation = getCurrentLocation();
  const lowStockItems = getLowStockItems();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            {currentLocation
              ? `Managing inventory for ${currentLocation.name}`
              : 'Select a location to manage inventory'
            }
          </p>
        </div>

        <button
          onClick={refreshItems}
          disabled={isLoading}
          className="px-6 py-4 text-base md:text-lg font-semibold rounded-lg transition-colors min-h-[48px] bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-base md:text-lg font-semibold text-blue-600">
                  {filteredItems.length}
                </span>
              </div>
            </div>
            <div className="ml-3 md:ml-4 min-w-0">
              <p className="text-xs md:text-sm font-medium text-gray-500">Total Items</p>
              <p className="text-base md:text-lg font-semibold text-gray-900 truncate">
                {filteredItems.reduce((sum, item) => sum + (item.total_quantity || 0), 0)} units
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-base md:text-lg font-semibold text-yellow-600">
                  {lowStockItems.length}
                </span>
              </div>
            </div>
            <div className="ml-3 md:ml-4 min-w-0">
              <p className="text-xs md:text-sm font-medium text-gray-500">Low Stock</p>
              <p className="text-base md:text-lg font-semibold text-gray-900 truncate">
                Items need restocking
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Filter className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              </div>
            </div>
            <div className="ml-3 md:ml-4">
              <label className="flex items-center space-x-2 cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={showLowStock}
                  onChange={(e) => setShowLowStock(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
                />
                <span className="text-sm md:text-base font-medium text-gray-700">
                  Show low stock only
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Items Table */}
      <ItemsTable items={filteredItems} isLoading={isLoading} />
    </div>
  );
};