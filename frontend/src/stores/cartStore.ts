import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  item_id: number;
  size_id: number | null;
  item_name: string;
  size_label: string;
  quantity: number;
  location_id: number;
  unit_type?: string;
}

interface CartStore {
  items: CartItem[];
  isVisible: boolean;
  
  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (item_id: number, size_id: number | null) => void;
  updateQuantity: (item_id: number, size_id: number | null, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  showCart: () => void;
  hideCart: () => void;
  getTotalItems: () => number;
  getItemCount: (item_id: number, size_id: number | null) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isVisible: false,
      
      addItem: (newItem) => {
        const { items } = get();
        const existingIndex = items.findIndex(
          item => item.item_id === newItem.item_id && item.size_id === newItem.size_id
        );
        
        if (existingIndex >= 0) {
          // Update existing item quantity
          const updatedItems = [...items];
          updatedItems[existingIndex].quantity += newItem.quantity;
          set({ items: updatedItems });
        } else {
          // Add new item
          set({ items: [...items, newItem] });
        }
      },
      
      removeItem: (item_id, size_id) => {
        set({
          items: get().items.filter(
            item => !(item.item_id === item_id && item.size_id === size_id)
          )
        });
      },
      
      updateQuantity: (item_id, size_id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(item_id, size_id);
          return;
        }
        
        set({
          items: get().items.map(item =>
            item.item_id === item_id && item.size_id === size_id
              ? { ...item, quantity }
              : item
          )
        });
      },
      
      clearCart: () => set({ items: [] }),
      
      toggleCart: () => set({ isVisible: !get().isVisible }),
      
      showCart: () => set({ isVisible: true }),
      
      hideCart: () => set({ isVisible: false }),
      
      getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      
      getItemCount: (item_id, size_id) => {
        const item = get().items.find(
          item => item.item_id === item_id && item.size_id === size_id
        );
        return item ? item.quantity : 0;
      },
    }),
    {
      name: 'rainbow-room-cart-store',
      partialize: (state) => ({ items: state.items }),
    }
  )
);