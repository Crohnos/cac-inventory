import { create } from 'zustand';
import api from '../services/api';

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
  admin_name?: string;
  source?: string;
  reason?: string;
  notes?: string;
  from_location?: string;
  to_location?: string;
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

export interface ReportFilters {
  locationId?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

interface ReportStore {
  isLoading: boolean;
  error: string | null;

  // API Actions - Current Inventory
  getCurrentInventory: (filters?: ReportFilters) => Promise<InventoryReportRow[]>;
  getLowStock: (filters?: ReportFilters) => Promise<LowStockReportRow[]>;

  // API Actions - Checkouts
  getCheckouts: (filters?: ReportFilters) => Promise<CheckoutReportRow[]>;
  getPopularItems: (filters?: ReportFilters) => Promise<PopularItemsRow[]>;

  // API Actions - Volunteers
  getVolunteerHours: (filters?: ReportFilters) => Promise<VolunteerHoursRow[]>;
  getDailyVolunteers: (filters?: ReportFilters) => Promise<DailyVolunteerRow[]>;

  // API Actions - Item Management
  getItemMaster: () => Promise<ItemMasterRow[]>;
  getTransactionHistory: (itemId: number, filters?: ReportFilters) => Promise<TransactionHistoryRow[]>;

  // API Actions - Monthly Reports
  getMonthlySummary: (month: number, year: number) => Promise<MonthlySummary>;
  getMonthlyInventoryMovements: (month: number, year: number, locationId?: number) => Promise<MonthlyInventoryMovementRow[]>;

  // Export Report
  exportReport: (reportType: string, filters?: ReportFilters, format?: 'csv' | 'json') => Promise<void>;
}

export const useReportStore = create<ReportStore>((set) => ({
  isLoading: false,
  error: null,

  getCurrentInventory: async (filters: ReportFilters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.locationId) params.append('location_id', filters.locationId.toString());

      const response = await api.get<ApiResponse<InventoryReportRow[]>>(`/reports/current-inventory?${params}`);
      set({ isLoading: false });
      return response.data.data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch current inventory report', isLoading: false });
      throw error;
    }
  },

  getLowStock: async (filters: ReportFilters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.locationId) params.append('location_id', filters.locationId.toString());

      const response = await api.get<ApiResponse<LowStockReportRow[]>>(`/reports/low-stock?${params}`);
      set({ isLoading: false });
      return response.data.data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch low stock report', isLoading: false });
      throw error;
    }
  },

  getCheckouts: async (filters: ReportFilters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.locationId) params.append('location_id', filters.locationId.toString());
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);

      const response = await api.get<ApiResponse<CheckoutReportRow[]>>(`/reports/checkouts?${params}`);
      set({ isLoading: false });
      return response.data.data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch checkout report', isLoading: false });
      throw error;
    }
  },

  getPopularItems: async (filters: ReportFilters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await api.get<ApiResponse<PopularItemsRow[]>>(`/reports/popular-items?${params}`);
      set({ isLoading: false });
      return response.data.data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch popular items report', isLoading: false });
      throw error;
    }
  },

  getVolunteerHours: async (filters: ReportFilters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.locationId) params.append('location_id', filters.locationId.toString());
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);

      const response = await api.get<ApiResponse<VolunteerHoursRow[]>>(`/reports/volunteer-hours?${params}`);
      set({ isLoading: false });
      return response.data.data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch volunteer hours report', isLoading: false });
      throw error;
    }
  },

  getDailyVolunteers: async (filters: ReportFilters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.locationId) params.append('location_id', filters.locationId.toString());
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);

      const response = await api.get<ApiResponse<DailyVolunteerRow[]>>(`/reports/daily-volunteers?${params}`);
      set({ isLoading: false });
      return response.data.data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch daily volunteers report', isLoading: false });
      throw error;
    }
  },

  getItemMaster: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<ApiResponse<ItemMasterRow[]>>('/reports/item-master');
      set({ isLoading: false });
      return response.data.data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch item master report', isLoading: false });
      throw error;
    }
  },

  getTransactionHistory: async (itemId: number, filters: ReportFilters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.locationId) params.append('location_id', filters.locationId.toString());
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);

      const response = await api.get<ApiResponse<TransactionHistoryRow[]>>(`/reports/transaction-history/${itemId}?${params}`);
      set({ isLoading: false });
      return response.data.data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch transaction history', isLoading: false });
      throw error;
    }
  },

  getMonthlySummary: async (month: number, year: number) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      params.append('month', month.toString());
      params.append('year', year.toString());

      const response = await api.get<ApiResponse<MonthlySummary>>(`/reports/monthly-summary?${params}`);
      set({ isLoading: false });
      return response.data.data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch monthly summary', isLoading: false });
      throw error;
    }
  },

  getMonthlyInventoryMovements: async (month: number, year: number, locationId?: number) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      params.append('month', month.toString());
      params.append('year', year.toString());
      if (locationId) params.append('location_id', locationId.toString());

      const response = await api.get<ApiResponse<MonthlyInventoryMovementRow[]>>(`/reports/monthly-movements?${params}`);
      set({ isLoading: false });
      return response.data.data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch monthly inventory movements', isLoading: false });
      throw error;
    }
  },

  exportReport: async (reportType: string, filters: ReportFilters = {}, format: 'csv' | 'json' = 'csv') => {
    set({ isLoading: true, error: null });
    try {
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

      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to export report', isLoading: false });
      throw error;
    }
  },
}));
