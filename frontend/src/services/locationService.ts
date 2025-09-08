import api from './api';
import type { Location } from '../stores/locationStore';

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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

export const locationService = {
  async getLocations(): Promise<Location[]> {
    const response = await api.get<ApiResponse<Location[]>>('/locations');
    return response.data.data;
  },
  
  async getLocationById(id: number): Promise<Location> {
    const response = await api.get<ApiResponse<Location>>(`/locations/${id}`);
    return response.data.data;
  },
  
  async createLocation(location: CreateLocationData): Promise<Location> {
    const response = await api.post<ApiResponse<Location>>('/locations', location);
    return response.data.data;
  },
  
  async updateLocation(id: number, location: UpdateLocationData): Promise<Location> {
    const response = await api.put<ApiResponse<Location>>(`/locations/${id}`, location);
    return response.data.data;
  },
  
  async toggleLocationActive(id: number): Promise<Location> {
    const response = await api.patch<ApiResponse<Location>>(`/locations/${id}/toggle`);
    return response.data.data;
  },
};