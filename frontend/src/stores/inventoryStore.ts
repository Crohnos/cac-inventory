import { create } from 'zustand';

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

interface InventoryStore {
  items: Item[];
  itemSizes: Record<number, ItemSize[]>; // itemId -> sizes
  isLoading: boolean;
  error: string | null;
  
  // Filters
  searchTerm: string;
  selectedLocation: number | null;
  showLowStock: boolean;
  
  // Actions
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