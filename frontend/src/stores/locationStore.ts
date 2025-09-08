import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Location {
  location_id: number;
  name: string;
  city: string;
  state: string;
  address?: string;
  phone?: string;
  zip_code?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface LocationStore {
  locations: Location[];
  currentLocationId: number | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setLocations: (locations: Location[]) => void;
  setCurrentLocation: (locationId: number) => void;
  getCurrentLocation: () => Location | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useLocationStore = create<LocationStore>()(
  persist(
    (set, get) => ({
      locations: [],
      currentLocationId: null,
      isLoading: false,
      error: null,
      
      setLocations: (locations) => {
        set({ locations, error: null });
        // Set first location as default if none selected
        if (!get().currentLocationId && locations.length > 0) {
          set({ currentLocationId: locations[0].location_id });
        }
      },
      
      setCurrentLocation: (locationId) => set({ currentLocationId: locationId }),
      
      getCurrentLocation: () => {
        const { locations, currentLocationId } = get();
        return locations.find(l => l.location_id === currentLocationId) || null;
      },
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
    }),
    {
      name: 'rainbow-room-location-store',
      partialize: (state) => ({ 
        currentLocationId: state.currentLocationId,
        locations: state.locations 
      }),
    }
  )
);