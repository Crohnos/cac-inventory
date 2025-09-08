import { create } from 'zustand';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface Modal {
  id: string;
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode;
  onClose?: () => void;
}

interface UIStore {
  // Loading states
  globalLoading: boolean;
  loadingStates: Record<string, boolean>;
  
  // Toasts
  toasts: Toast[];
  
  // Modals
  modals: Record<string, Modal>;
  
  // Sidebar (mobile)
  isSidebarOpen: boolean;
  
  // Actions
  setGlobalLoading: (loading: boolean) => void;
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
  
  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Modal actions
  openModal: (id: string, modal: Omit<Modal, 'id' | 'isOpen'>) => void;
  closeModal: (id: string) => void;
  isModalOpen: (id: string) => boolean;
  
  // Sidebar actions
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  // Loading states
  globalLoading: false,
  loadingStates: {},
  
  // Toasts
  toasts: [],
  
  // Modals
  modals: {},
  
  // Sidebar
  isSidebarOpen: false,
  
  // Loading actions
  setGlobalLoading: (globalLoading) => set({ globalLoading }),
  
  setLoading: (key, loading) => set((state) => ({
    loadingStates: { ...state.loadingStates, [key]: loading }
  })),
  
  isLoading: (key) => {
    const { loadingStates } = get();
    return loadingStates[key] || false;
  },
  
  // Toast actions
  addToast: (toast) => set((state) => {
    const id = Date.now().toString();
    const newToast: Toast = { ...toast, id };
    
    // Auto-remove toast after duration
    const duration = toast.duration || 5000;
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
    
    return { toasts: [...state.toasts, newToast] };
  }),
  
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(toast => toast.id !== id)
  })),
  
  clearToasts: () => set({ toasts: [] }),
  
  // Modal actions
  openModal: (id, modal) => set((state) => ({
    modals: {
      ...state.modals,
      [id]: { ...modal, id, isOpen: true }
    }
  })),
  
  closeModal: (id) => set((state) => {
    const modal = state.modals[id];
    if (modal?.onClose) {
      modal.onClose();
    }
    
    return {
      modals: {
        ...state.modals,
        [id]: { ...modal, isOpen: false }
      }
    };
  }),
  
  isModalOpen: (id) => {
    const { modals } = get();
    return modals[id]?.isOpen || false;
  },
  
  // Sidebar actions
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  closeSidebar: () => set({ isSidebarOpen: false }),
  
  openSidebar: () => set({ isSidebarOpen: true }),
}));