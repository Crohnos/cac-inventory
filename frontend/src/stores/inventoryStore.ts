import { create } from 'zustand';
import api from '../services/api';

export interface Item {
  item_id: number;
  name: string;
  description?: string;
  storage_location?: string;
  qr_code: string;
  has_sizes: boolean;
  min_stock_level?: number;
  unit_type?: string;
  size_count?: number;
  total_quantity?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ItemSize {
  size_id: number;
  item_id: number;
  location_id: number;
  size_label: string;
  current_quantity: number;
  min_stock_level?: number;
  sort_order?: number;
  location_name?: string;
}

export interface CreateItemData {
  name: string;
  description?: string;
  storage_location?: string;
  has_sizes: boolean;
  sizes?: string[];
  min_stock_level?: number;
  unit_type?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

interface InventoryStore {
  items: Item[];
  itemSizes: Record<number, ItemSize[]>; // itemId -> sizes
  isLoading: boolean;
  error: string | null;

  // Filters
  searchTerm: string;
  selectedLocation: number | null;
  showLowStock: boolean;

  // API Actions
  fetchItems: (locationId?: number) => Promise<void>;
  fetchItemById: (id: number) => Promise<Item>;
  fetchItemByQrCode: (qrCode: string) => Promise<Item>;
  fetchItemSizes: (itemId: number, locationId?: number) => Promise<ItemSize[]>;
  createItem: (itemData: CreateItemData) => Promise<Item>;
  updateQuantity: (sizeId: number, quantity: number) => Promise<ItemSize>;
  adjustQuantity: (sizeId: number, adjustment: number, adminName?: string, reason?: string) => Promise<ItemSize>;

  // Local State Actions
  setItems: (items: Item[]) => void;
  setItemSizes: (itemId: number, sizes: ItemSize[]) => void;
  updateItemQuantity: (sizeId: number, newQuantity: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Filter actions
  setSearchTerm: (term: string) => void;
  setSelectedLocation: (locationId: number | null) => void;
  setShowLowStock: (show: boolean) => void;

  // Getters
  getFilteredItems: () => Item[];
  getItemById: (id: number) => Item | null;
  getItemSizes: (itemId: number) => ItemSize[];
  getLowStockItems: () => Item[];
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  items: [],
  itemSizes: {},
  isLoading: false,
  error: null,

  // Filters
  searchTerm: '',
  selectedLocation: null,
  showLowStock: false,

  // API Actions
  fetchItems: async (locationId?: number) => {
    set({ isLoading: true, error: null });
    try {
      const params = locationId ? { location_id: locationId } : {};
      const response = await api.get<ApiResponse<Item[]>>('/items', { params });
      set({ items: response.data.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch items', isLoading: false });
      throw error;
    }
  },

  fetchItemById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<ApiResponse<Item>>(`/items/${id}`);
      const item = response.data.data;

      // Update items array with fetched item
      set((state) => {
        const existingIndex = state.items.findIndex(i => i.item_id === id);
        if (existingIndex >= 0) {
          const updatedItems = [...state.items];
          updatedItems[existingIndex] = item;
          return { items: updatedItems, isLoading: false };
        } else {
          return { items: [...state.items, item], isLoading: false };
        }
      });

      return item;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch item', isLoading: false });
      throw error;
    }
  },

  fetchItemByQrCode: async (qrCode: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<ApiResponse<Item>>(`/items/qr/${qrCode}`);
      const item = response.data.data;

      // Update items array with fetched item
      set((state) => {
        const existingIndex = state.items.findIndex(i => i.item_id === item.item_id);
        if (existingIndex >= 0) {
          const updatedItems = [...state.items];
          updatedItems[existingIndex] = item;
          return { items: updatedItems, isLoading: false };
        } else {
          return { items: [...state.items, item], isLoading: false };
        }
      });

      return item;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch item by QR code', isLoading: false });
      throw error;
    }
  },

  fetchItemSizes: async (itemId: number, locationId?: number) => {
    set({ isLoading: true, error: null });
    try {
      const params = locationId ? { location_id: locationId } : {};
      const response = await api.get<ApiResponse<ItemSize[]>>(`/items/${itemId}/sizes`, { params });
      set((state) => ({
        itemSizes: { ...state.itemSizes, [itemId]: response.data.data },
        isLoading: false
      }));
      return response.data.data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch item sizes', isLoading: false });
      throw error;
    }
  },

  createItem: async (itemData: CreateItemData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<ApiResponse<Item>>('/items', itemData);
      const newItem = response.data.data;

      set((state) => ({
        items: [...state.items, newItem],
        isLoading: false
      }));

      return newItem;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create item', isLoading: false });
      throw error;
    }
  },

  updateQuantity: async (sizeId: number, quantity: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<ApiResponse<ItemSize>>(`/items/sizes/${sizeId}/quantity`, {
        quantity
      });
      const updatedSize = response.data.data;

      // Update local state
      get().updateItemQuantity(sizeId, updatedSize.current_quantity);
      set({ isLoading: false });
      return updatedSize;
    } catch (error: any) {
      set({ error: error.message || 'Failed to update quantity', isLoading: false });
      throw error;
    }
  },

  adjustQuantity: async (sizeId: number, adjustment: number, adminName?: string, reason?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch<ApiResponse<ItemSize>>(`/items/sizes/${sizeId}/adjust`, {
        adjustment,
        admin_name: adminName,
        reason: reason
      });
      const updatedSize = response.data.data;

      // Update local state
      get().updateItemQuantity(sizeId, updatedSize.current_quantity);
      set({ isLoading: false });
      return updatedSize;
    } catch (error: any) {
      set({ error: error.message || 'Failed to adjust quantity', isLoading: false });
      throw error;
    }
  },

  // Local State Actions
  setItems: (items) => set({ items, error: null }),
  
  setItemSizes: (itemId, sizes) => set((state) => ({
    itemSizes: { ...state.itemSizes, [itemId]: sizes }
  })),
  
  updateItemQuantity: (sizeId, newQuantity) => set((state) => {
    const updatedItemSizes = { ...state.itemSizes };
    
    // Find and update the specific size
    Object.keys(updatedItemSizes).forEach(itemIdStr => {
      const itemId = parseInt(itemIdStr);
      const sizes = updatedItemSizes[itemId];
      const sizeIndex = sizes.findIndex(size => size.size_id === sizeId);
      
      if (sizeIndex !== -1) {
        updatedItemSizes[itemId] = [
          ...sizes.slice(0, sizeIndex),
          { ...sizes[sizeIndex], current_quantity: newQuantity },
          ...sizes.slice(sizeIndex + 1)
        ];
      }
    });
    
    // Also update the total quantity in items if needed
    const updatedItems = state.items.map(item => {
      const sizes = updatedItemSizes[item.item_id];
      if (sizes) {
        const totalQuantity = sizes.reduce((sum, size) => sum + size.current_quantity, 0);
        return { ...item, total_quantity: totalQuantity };
      }
      return item;
    });
    
    return { itemSizes: updatedItemSizes, items: updatedItems };
  }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  // Filter actions
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  
  setSelectedLocation: (selectedLocation) => set({ selectedLocation }),
  
  setShowLowStock: (showLowStock) => set({ showLowStock }),
  
  // Getters
  getFilteredItems: () => {
    const { items, searchTerm, showLowStock } = get();
    
    return items.filter(item => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(term);
        const matchesDescription = item.description?.toLowerCase().includes(term);
        const matchesQrCode = item.qr_code.toLowerCase().includes(term);
        
        if (!matchesName && !matchesDescription && !matchesQrCode) {
          return false;
        }
      }
      
      // Low stock filter
      if (showLowStock) {
        const isLowStock = (item.total_quantity || 0) <= (item.min_stock_level || 5);
        if (!isLowStock) {
          return false;
        }
      }
      
      return true;
    });
  },
  
  getItemById: (id) => {
    const { items } = get();
    return items.find(item => item.item_id === id) || null;
  },
  
  getItemSizes: (itemId) => {
    const { itemSizes } = get();
    return itemSizes[itemId] || [];
  },
  
  getLowStockItems: () => {
    const { items } = get();
    return items.filter(item => 
      (item.total_quantity || 0) <= (item.min_stock_level || 5)
    );
  },
}));