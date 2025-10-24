import React from 'react';
import { useInventoryStore } from '../stores/inventoryStore';
import { useLocationStore } from '../stores/locationStore';
import { useUIStore } from '../stores/uiStore';

export const useInventory = () => {
  const {
    items,
    fetchItems,
    updateQuantity,
    adjustQuantity,
    isLoading,
    error,
    getFilteredItems,
  } = useInventoryStore();

  const {
    locations,
    currentLocationId,
    fetchLocations,
  } = useLocationStore();

  const { addToast } = useUIStore();

  // Load locations on mount
  React.useEffect(() => {
    const loadLocations = async () => {
      try {
        await fetchLocations();
      } catch (error: any) {
        console.error('Failed to load locations:', error);
        addToast({
          type: 'error',
          title: 'Failed to load locations',
          message: error.message,
        });
      }
    };

    if (locations.length === 0) {
      loadLocations();
    }
  }, [locations.length, fetchLocations, addToast]);

  // Load items when location changes or on mount
  React.useEffect(() => {
    const loadItems = async () => {
      if (!currentLocationId && locations.length === 0) return;

      try {
        await fetchItems(currentLocationId || undefined);
      } catch (error: any) {
        console.error('Failed to load items:', error);
        addToast({
          type: 'error',
          title: 'Failed to load inventory',
          message: error.message,
        });
      }
    };

    loadItems();
  }, [currentLocationId, locations.length, fetchItems, addToast]);

  const refreshItems = React.useCallback(async () => {
    try {
      await fetchItems(currentLocationId || undefined);
      addToast({
        type: 'success',
        title: 'Inventory refreshed',
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to refresh inventory',
        message: error.message,
      });
    }
  }, [currentLocationId, fetchItems, addToast]);

  const updateItemQuantity = React.useCallback(async (sizeId: number, quantity: number) => {
    try {
      await updateQuantity(sizeId, quantity);
      // Refresh items to get updated quantities
      await refreshItems();
      addToast({
        type: 'success',
        title: 'Quantity updated',
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to update quantity',
        message: error.message,
      });
      throw error;
    }
  }, [updateQuantity, refreshItems, addToast]);

  const adjustItemQuantity = React.useCallback(async (sizeId: number, adjustment: number) => {
    try {
      await adjustQuantity(sizeId, adjustment);
      // Refresh items to get updated quantities
      await refreshItems();
      addToast({
        type: 'success',
        title: `Quantity ${adjustment > 0 ? 'increased' : 'decreased'}`,
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to adjust quantity',
        message: error.message,
      });
      throw error;
    }
  }, [adjustQuantity, refreshItems, addToast]);

  return {
    // Data
    items,
    filteredItems: getFilteredItems(),
    isLoading,
    error,
    
    // Actions
    refreshItems,
    updateItemQuantity,
    adjustItemQuantity,
  };
};