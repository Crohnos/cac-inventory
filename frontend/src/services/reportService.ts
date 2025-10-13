import api from './api';
import type { ApiResponse } from './locationService';

// Report data interfaces
export interface InventoryReportRow {
  item_name: string;
  description: string;
  size_label: string;
  current_quantity: number;
  min_stock_level: number;
  stock_status: 'LOW' | 'OK' | 'HIGH';
  location_name: string;
  unit_type: string;
}

export interface LowStockReportRow {
  location_name: string;
  item_name: string;
  size_label: string;
  current_quantity: number;
  min_stock_level: number;
  needed_quantity: number;
  unit_type: string;
}

export interface CheckoutReportRow {
  checkout_date: string;
  checkout_time: string;
  location_name: string;
  item_name: string;
  size_label: string;
  quantity: number;
  case_worker: string;
  client_info: string;
  unit_type: string;
}

export interface PopularItemsRow {
  item_name: string;
  size_label: string;
  times_checked_out: number;
  total_quantity: number;
  last_checkout: string;
}

export interface VolunteerHoursRow {
  volunteer_name: string;
  total_hours: number;
  total_sessions: number;
  avg_hours_per_session: number;
  last_session_date: string;
  locations_worked: string;
}

export interface DailyVolunteerRow {
  session_date: string;
  volunteer_name: string;
  location_name: string;
  start_time: string;
  end_time: string;
  hours_worked: number;
  tasks_performed: string;
  notes: string;
}

export interface ItemMasterRow {
  item_id: number;
  name: string;
  description: string;
  qr_code: string;
  has_sizes: boolean;
  available_sizes: string;
  unit_type: string;
  storage_location: string;
}

export interface TransactionHistoryRow {
  transaction_date: string;
  transaction_type: 'CHECKOUT' | 'ADDITION' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'MANUAL_ADJUSTMENT';
  location_name: string;
  quantity: number;
  size_label?: string;
  volunteer_name?: string;
  case_worker?: string;
  admin_name?: string; // for manual adjustments
  source?: string; // for additions
  reason?: string; // for transfers and manual adjustments
  notes?: string;
  from_location?: string; // for transfer in
  to_location?: string; // for transfer out
}

export interface MonthlySummary {
  total_items_distributed: number;
  new_items_added: number;
  total_volunteer_hours: number;
  unique_volunteers: number;
  most_active_location: string;
  least_active_location: string;
  top_items: Array<{
    item_name: string;
    size_label: string;
    total_quantity: number;
  }>;
}

export interface MonthlyInventoryMovementRow {
  item_name: string;
  size_label: string;
  location_name: string;
  unit_type: string;
  additions_total: number;
  additions_count: number;
  checkouts_total: number;
  checkouts_count: number;
  transfers_in_total: number;
  transfers_in_count: number;
  transfers_out_total: number;
  transfers_out_count: number;
  manual_additions_total: number;
  manual_additions_count: number;
  manual_subtractions_total: number;
  manual_subtractions_count: number;
  net_change: number;
  starting_quantity?: number;
  ending_quantity?: number;
}

// Report filters
export interface ReportFilters {
  locationId?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export const reportService = {
  // Current Inventory Report
  async getCurrentInventory(filters: ReportFilters = {}): Promise<InventoryReportRow[]> {
    const params = new URLSearchParams();
    if (filters.locationId) params.append('location_id', filters.locationId.toString());
    
    const response = await api.get<ApiResponse<InventoryReportRow[]>>(`/reports/current-inventory?${params}`);
    return response.data.data;
  },

  // Low Stock Report
  async getLowStock(filters: ReportFilters = {}): Promise<LowStockReportRow[]> {
    const params = new URLSearchParams();
    if (filters.locationId) params.append('location_id', filters.locationId.toString());
    
    const response = await api.get<ApiResponse<LowStockReportRow[]>>(`/reports/low-stock?${params}`);
    return response.data.data;
  },

  // Checkout Report
  async getCheckouts(filters: ReportFilters = {}): Promise<CheckoutReportRow[]> {
    const params = new URLSearchParams();
    if (filters.locationId) params.append('location_id', filters.locationId.toString());
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    
    const response = await api.get<ApiResponse<CheckoutReportRow[]>>(`/reports/checkouts?${params}`);
    return response.data.data;
  },

  // Popular Items Report
  async getPopularItems(filters: ReportFilters = {}): Promise<PopularItemsRow[]> {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const response = await api.get<ApiResponse<PopularItemsRow[]>>(`/reports/popular-items?${params}`);
    return response.data.data;
  },

  // Volunteer Hours Report
  async getVolunteerHours(filters: ReportFilters = {}): Promise<VolunteerHoursRow[]> {
    const params = new URLSearchParams();
    if (filters.locationId) params.append('location_id', filters.locationId.toString());
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    
    const response = await api.get<ApiResponse<VolunteerHoursRow[]>>(`/reports/volunteer-hours?${params}`);
    return response.data.data;
  },

  // Daily Volunteer Report
  async getDailyVolunteers(filters: ReportFilters = {}): Promise<DailyVolunteerRow[]> {
    const params = new URLSearchParams();
    if (filters.locationId) params.append('location_id', filters.locationId.toString());
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    
    const response = await api.get<ApiResponse<DailyVolunteerRow[]>>(`/reports/daily-volunteers?${params}`);
    return response.data.data;
  },

  // Item Master Report
  async getItemMaster(): Promise<ItemMasterRow[]> {
    const response = await api.get<ApiResponse<ItemMasterRow[]>>('/reports/item-master');
    return response.data.data;
  },

  // Monthly Summary Report
  async getMonthlySummary(month: number, year: number): Promise<MonthlySummary> {
    const params = new URLSearchParams();
    params.append('month', month.toString());
    params.append('year', year.toString());
    
    const response = await api.get<ApiResponse<MonthlySummary>>(`/reports/monthly-summary?${params}`);
    return response.data.data;
  },

  // Transaction History for specific item
  async getTransactionHistory(itemId: number, filters: ReportFilters = {}): Promise<TransactionHistoryRow[]> {
    const params = new URLSearchParams();
    if (filters.locationId) params.append('location_id', filters.locationId.toString());
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    
    const response = await api.get<ApiResponse<TransactionHistoryRow[]>>(`/reports/transaction-history/${itemId}?${params}`);
    return response.data.data;
  },

  // Monthly Inventory Movements Report
  async getMonthlyInventoryMovements(month: number, year: number, locationId?: number): Promise<MonthlyInventoryMovementRow[]> {
    const params = new URLSearchParams();
    params.append('month', month.toString());
    params.append('year', year.toString());
    if (locationId) params.append('location_id', locationId.toString());
    
    const response = await api.get<ApiResponse<MonthlyInventoryMovementRow[]>>(`/reports/monthly-movements?${params}`);
    return response.data.data;
  },

  // Export Report
  async exportReport(reportType: string, filters: ReportFilters = {}, format: 'csv' | 'json' = 'csv'): Promise<void> {
    const params = new URLSearchParams();
    if (filters.locationId) params.append('location_id', filters.locationId.toString());
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.limit) params.append('limit', filters.limit.toString());
    params.append('format', format);
    
    const response = await api.get(`/reports/export/${reportType}?${params}`, {
      responseType: format === 'csv' ? 'blob' : 'json'
    });
    
    if (format === 'csv') {
      // Create download link for CSV
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  }
};