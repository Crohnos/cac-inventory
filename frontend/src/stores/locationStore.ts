import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

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

export interface CreateLocationData {
  name: string;
  city: string;
  state?: string;
  address?: string;
  phone?: string;
  zip_code?: string;
}

export interface UpdateLocationData {
  name?: string;
  city?: string;
  state?: string;
  address?: string;
  phone?: string;
  zip_code?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

interface LocationStore {
  locations: Location[];
  currentLocationId: number | null;
  isLoading: boolean;
  error: string | null;

  // API Actions
  fetchLocations: () => Promise<void>;
  fetchLocationById: (id: number) => Promise<Location>;
  createLocation: (locationData: CreateLocationData) => Promise<Location>;
  updateLocation: (id: number, locationData: UpdateLocationData) => Promise<Location>;
  toggleLocationActive: (id: number) => Promise<Location>;

  // Local State Actions
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

      // API Actions
      fetchLocations: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get<ApiResponse<Location[]>>('/locations');
          const locations = response.data.data;
          set({ locations, isLoading: false });

          // Set first location as default if none selected
          if (!get().currentLocationId && locations.length > 0) {
            set({ currentLocationId: locations[0].location_id });
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to fetch locations', isLoading: false });
          throw error;
        }
      },

      fetchLocationById: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get<ApiResponse<Location>>(`/locations/${id}`);
          const location = response.data.data;

          // Update locations array with fetched location
          set((state) => {
            const existingIndex = state.locations.findIndex(l => l.location_id === id);
            if (existingIndex >= 0) {
              const updatedLocations = [...state.locations];
              updatedLocations[existingIndex] = location;
              return { locations: updatedLocations, isLoading: false };
            } else {
              return { locations: [...state.locations, location], isLoading: false };
            }
          });

          return location;
        } catch (error: any) {
          set({ error: error.message || 'Failed to fetch location', isLoading: false });
          throw error;
        }
      },

      createLocation: async (locationData: CreateLocationData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<ApiResponse<Location>>('/locations', locationData);
          const newLocation = response.data.data;

          set((state) => ({
            locations: [...state.locations, newLocation],
            isLoading: false
          }));

          return newLocation;
        } catch (error: any) {
          set({ error: error.message || 'Failed to create location', isLoading: false });
          throw error;
        }
      },

      updateLocation: async (id: number, locationData: UpdateLocationData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.put<ApiResponse<Location>>(`/locations/${id}`, locationData);
          const updatedLocation = response.data.data;

          set((state) => ({
            locations: state.locations.map(l =>
              l.location_id === id ? updatedLocation : l
            ),
            isLoading: false
          }));

          return updatedLocation;
        } catch (error: any) {
          set({ error: error.message || 'Failed to update location', isLoading: false });
          throw error;
        }
      },

      toggleLocationActive: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.patch<ApiResponse<Location>>(`/locations/${id}/toggle`);
          const updatedLocation = response.data.data;

          set((state) => ({
            locations: state.locations.map(l =>
              l.location_id === id ? updatedLocation : l
            ),
            isLoading: false
          }));

          return updatedLocation;
        } catch (error: any) {
          set({ error: error.message || 'Failed to toggle location status', isLoading: false });
          throw error;
        }
      },

      // Local State Actions
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