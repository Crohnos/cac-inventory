import React from 'react';
import { useInventoryStore } from '../stores/inventoryStore';
import { useLocationStore } from '../stores/locationStore';
import { useUIStore } from '../stores/uiStore';
import { itemService } from '../services/itemService';
import { locationService } from '../services/locationService';

export const useInventory = () => {
  const {
    items,
    setItems,
    setLoading,
    setError,
    isLoading,
    error,
    getFilteredItems,
  } = useInventoryStore();
  
  const {
    locations,
    currentLocationId,
    setLocations,
    setError: setLocationError,
  } = useLocationStore();
  
  const { addToast } = useUIStore();

  // Load locations on mount
  React.useEffect(() => {
    const loadLocations = async () => {
      try {
        const locationData = await locationService.getLocations();
        setLocations(locationData);
      } catch (error: any) {
        console.error('Failed to load locations:', error);
        setLocationError(error.message);
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
  }, [locations.length, setLocations, setLocationError, addToast]);

  // Load items when location changes or on mount
  React.useEffect(() => {
    const loadItems = async () => {
      if (!currentLocationId && locations.length === 0) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const itemData = await itemService.getItems(currentLocationId || undefined);
        setItems(itemData);
      } catch (error: any) {
        console.error('Failed to load items:', error);
        setError(error.message);
        addToast({
          type: 'error',
          title: 'Failed to load inventory',
          message: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [currentLocationId, locations.length, setItems, setLoading, setError, addToast]);

  const refreshItems = React.useCallback(async () => {
    setLoading(true);
    try {
      const itemData = await itemService.getItems(currentLocationId || undefined);
      setItems(itemData);
      addToast({
        type: 'success',
        title: 'Inventory refreshed',
      });
    } catch (error: any) {
      setError(error.message);
      addToast({
        type: 'error',
        title: 'Failed to refresh inventory',
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [currentLocationId, setItems, setLoading, setError, addToast]);

  const updateItemQuantity = React.useCallback(async (sizeId: number, quantity: number) => {
    try {
      await itemService.updateQuantity(sizeId, quantity);
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
  }, [refreshItems, addToast]);

  const adjustItemQuantity = React.useCallback(async (sizeId: number, adjustment: number) => {
    try {
      await itemService.adjustQuantity(sizeId, adjustment);
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
  }, [refreshItems, addToast]);

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