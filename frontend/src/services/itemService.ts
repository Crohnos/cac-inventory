import api from './api';
import type { Item, ItemSize } from '../stores/inventoryStore';
import type { ApiResponse } from './locationService';

export interface CreateItemData {
  name: string;
  description?: string;
  storage_location?: string;
  has_sizes: boolean;
  sizes?: string[];
  min_stock_level?: number;
  unit_type?: string;
}

export const itemService = {
  async getItems(locationId?: number): Promise<Item[]> {
    const params = locationId ? { location_id: locationId } : {};
    const response = await api.get<ApiResponse<Item[]>>('/items', { params });
    return response.data.data;
  },
  
  async getItemById(id: number): Promise<Item> {
    const response = await api.get<ApiResponse<Item>>(`/items/${id}`);
    return response.data.data;
  },
  
  async getItemByQrCode(qrCode: string): Promise<Item> {
    const response = await api.get<ApiResponse<Item>>(`/items/qr/${qrCode}`);
    return response.data.data;
  },
  
  async getItemSizes(itemId: number, locationId?: number): Promise<ItemSize[]> {
    const params = locationId ? { location_id: locationId } : {};
    const response = await api.get<ApiResponse<ItemSize[]>>(`/items/${itemId}/sizes`, { params });
    return response.data.data;
  },
  
  async createItem(item: CreateItemData): Promise<Item> {
    const response = await api.post<ApiResponse<Item>>('/items', item);
    return response.data.data;
  },
  
  async updateQuantity(sizeId: number, quantity: number): Promise<ItemSize> {
    const response = await api.put<ApiResponse<ItemSize>>(`/items/sizes/${sizeId}/quantity`, {
      quantity
    });
    return response.data.data;
  },
  
  async adjustQuantity(sizeId: number, adjustment: number, adminName?: string, reason?: string): Promise<ItemSize> {
    const response = await api.patch<ApiResponse<ItemSize>>(`/items/sizes/${sizeId}/adjust`, {
      adjustment,
      admin_name: adminName,
      reason: reason
    });
    return response.data.data;
  },
};