import { DatabaseConnection } from '../database/connection.js';

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

export class ReportService {
  private static db = DatabaseConnection.getInstance();

  // Current Inventory Report
  static getCurrentInventory(locationId?: number, dateRange?: { start: string; end: string }): InventoryReportRow[] {
    let query = `
      SELECT 
        i.name as item_name,
        i.description,
        is2.size_label,
        is2.current_quantity,
        is2.min_stock_level,
        CASE 
          WHEN is2.current_quantity <= is2.min_stock_level THEN 'LOW'
          WHEN is2.current_quantity > is2.min_stock_level * 2 THEN 'HIGH'
          ELSE 'OK'
        END as stock_status,
        l.name as location_name,
        i.unit_type
      FROM items i
      JOIN item_sizes is2 ON i.item_id = is2.item_id
      JOIN locations l ON is2.location_id = l.location_id
      WHERE l.is_active = 1
    `;
    
    const params: any[] = [];
    
    if (locationId) {
      query += ' AND l.location_id = ?';
      params.push(locationId);
    }
    
    query += ' ORDER BY i.name, is2.size_label';
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params) as InventoryReportRow[];
  }

  // Low Stock Alert Report
  static getLowStockItems(locationId?: number): LowStockReportRow[] {
    let query = `
      SELECT 
        l.name as location_name,
        i.name as item_name,
        is2.size_label,
        is2.current_quantity,
        is2.min_stock_level,
        (is2.min_stock_level - is2.current_quantity + is2.min_stock_level) as needed_quantity,
        i.unit_type
      FROM items i
      JOIN item_sizes is2 ON i.item_id = is2.item_id
      JOIN locations l ON is2.location_id = l.location_id
      WHERE l.is_active = 1 AND is2.current_quantity <= is2.min_stock_level
    `;
    
    const params: any[] = [];
    
    if (locationId) {
      query += ' AND l.location_id = ?';
      params.push(locationId);
    }
    
    query += ' ORDER BY (is2.min_stock_level - is2.current_quantity) DESC, i.name';
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params) as LowStockReportRow[];
  }

  // Daily Checkout Report
  static getCheckoutReport(filters: {
    startDate?: string;
    endDate?: string;
    locationId?: number;
  }): CheckoutReportRow[] {
    let query = `
      SELECT 
        DATE(c.checkout_date) as checkout_date,
        TIME(c.checkout_date) as checkout_time,
        l.name as location_name,
        i.name as item_name,
        ci.size_label,
        ci.quantity,
        COALESCE(c.case_worker, '') as case_worker,
        COALESCE(c.client_info, '') as client_info,
        i.unit_type
      FROM checkouts c
      JOIN locations l ON c.location_id = l.location_id
      JOIN checkout_items ci ON c.checkout_id = ci.checkout_id
      JOIN items i ON ci.item_id = i.item_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (filters.startDate) {
      query += ' AND DATE(c.checkout_date) >= ?';
      params.push(filters.startDate);
    }
    
    if (filters.endDate) {
      query += ' AND DATE(c.checkout_date) <= ?';
      params.push(filters.endDate);
    }
    
    if (filters.locationId) {
      query += ' AND c.location_id = ?';
      params.push(filters.locationId);
    }
    
    query += ' ORDER BY c.checkout_date DESC, i.name';
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params) as CheckoutReportRow[];
  }

  // Popular Items Report
  static getPopularItems(filters: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): PopularItemsRow[] {
    let query = `
      SELECT 
        i.name as item_name,
        ci.size_label,
        COUNT(*) as times_checked_out,
        SUM(ci.quantity) as total_quantity,
        MAX(DATE(c.checkout_date)) as last_checkout
      FROM checkout_items ci
      JOIN checkouts c ON ci.checkout_id = c.checkout_id  
      JOIN items i ON ci.item_id = i.item_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (filters.startDate) {
      query += ' AND DATE(c.checkout_date) >= ?';
      params.push(filters.startDate);
    }
    
    if (filters.endDate) {
      query += ' AND DATE(c.checkout_date) <= ?';
      params.push(filters.endDate);
    }
    
    query += ' GROUP BY i.item_id, ci.size_label';
    query += ' ORDER BY times_checked_out DESC, total_quantity DESC';
    
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params) as PopularItemsRow[];
  }

  // Volunteer Hours Summary
  static getVolunteerHoursSummary(filters: {
    startDate?: string;
    endDate?: string;
    locationId?: number;
  }): VolunteerHoursRow[] {
    let query = `
      SELECT 
        vs.volunteer_name,
        ROUND(SUM(COALESCE(vs.hours_worked, 0)), 2) as total_hours,
        COUNT(*) as total_sessions,
        ROUND(AVG(COALESCE(vs.hours_worked, 0)), 2) as avg_hours_per_session,
        MAX(DATE(vs.session_date)) as last_session_date,
        GROUP_CONCAT(DISTINCT l.name) as locations_worked
      FROM volunteer_sessions vs
      JOIN locations l ON vs.location_id = l.location_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (filters.startDate) {
      query += ' AND DATE(vs.session_date) >= ?';
      params.push(filters.startDate);
    }
    
    if (filters.endDate) {
      query += ' AND DATE(vs.session_date) <= ?';
      params.push(filters.endDate);
    }
    
    if (filters.locationId) {
      query += ' AND vs.location_id = ?';
      params.push(filters.locationId);
    }
    
    query += ' GROUP BY vs.volunteer_name';
    query += ' ORDER BY total_hours DESC';
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params) as VolunteerHoursRow[];
  }

  // Daily Volunteer Report
  static getDailyVolunteerReport(filters: {
    startDate?: string;
    endDate?: string;
    locationId?: number;
  }): DailyVolunteerRow[] {
    let query = `
      SELECT 
        DATE(vs.session_date) as session_date,
        vs.volunteer_name,
        l.name as location_name,
        vs.start_time,
        COALESCE(vs.end_time, '') as end_time,
        COALESCE(vs.hours_worked, 0) as hours_worked,
        COALESCE(vs.tasks_performed, '') as tasks_performed,
        COALESCE(vs.notes, '') as notes
      FROM volunteer_sessions vs
      JOIN locations l ON vs.location_id = l.location_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (filters.startDate) {
      query += ' AND DATE(vs.session_date) >= ?';
      params.push(filters.startDate);
    }
    
    if (filters.endDate) {
      query += ' AND DATE(vs.session_date) <= ?';
      params.push(filters.endDate);
    }
    
    if (filters.locationId) {
      query += ' AND vs.location_id = ?';
      params.push(filters.locationId);
    }
    
    query += ' ORDER BY vs.session_date DESC, vs.start_time DESC';
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params) as DailyVolunteerRow[];
  }

  // Item Master List
  static getItemMasterList(): ItemMasterRow[] {
    const query = `
      SELECT 
        i.item_id,
        i.name,
        i.description,
        i.qr_code,
        i.has_sizes,
        CASE 
          WHEN i.has_sizes = 1 THEN (
            SELECT GROUP_CONCAT(DISTINCT is2.size_label) 
            FROM item_sizes is2 
            WHERE is2.item_id = i.item_id
          )
          ELSE 'N/A'
        END as available_sizes,
        i.unit_type,
        COALESCE(i.storage_location, '') as storage_location
      FROM items i
      ORDER BY i.name
    `;
    
    const stmt = this.db.prepare(query);
    return stmt.all() as ItemMasterRow[];
  }

  // Monthly Summary Report
  static getMonthlySummary(month: number, year: number): MonthlySummary {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month
    
    // Total items distributed
    const itemsDistributed = this.db.prepare(`
      SELECT COALESCE(SUM(ci.quantity), 0) as total
      FROM checkout_items ci
      JOIN checkouts c ON ci.checkout_id = c.checkout_id
      WHERE DATE(c.checkout_date) BETWEEN ? AND ?
    `).get(startDate, endDate) as { total: number };

    // New items added
    const newItems = this.db.prepare(`
      SELECT COUNT(*) as total
      FROM items 
      WHERE DATE(created_at) BETWEEN ? AND ?
    `).get(startDate, endDate) as { total: number };

    // Volunteer hours
    const volunteerHours = this.db.prepare(`
      SELECT COALESCE(SUM(hours_worked), 0) as total,
             COUNT(DISTINCT volunteer_name) as unique_volunteers
      FROM volunteer_sessions
      WHERE DATE(session_date) BETWEEN ? AND ?
    `).get(startDate, endDate) as { total: number; unique_volunteers: number };

    // Most/Least active locations
    const locationActivity = this.db.prepare(`
      SELECT 
        l.name,
        COUNT(c.checkout_id) as checkout_count
      FROM locations l
      LEFT JOIN checkouts c ON l.location_id = c.location_id 
        AND DATE(c.checkout_date) BETWEEN ? AND ?
      WHERE l.is_active = 1
      GROUP BY l.location_id, l.name
      ORDER BY checkout_count DESC
    `).all(startDate, endDate) as Array<{ name: string; checkout_count: number }>;

    // Top 10 items
    const topItems = this.db.prepare(`
      SELECT 
        i.name as item_name,
        ci.size_label,
        SUM(ci.quantity) as total_quantity
      FROM checkout_items ci
      JOIN checkouts c ON ci.checkout_id = c.checkout_id
      JOIN items i ON ci.item_id = i.item_id
      WHERE DATE(c.checkout_date) BETWEEN ? AND ?
      GROUP BY i.item_id, ci.size_label
      ORDER BY total_quantity DESC
      LIMIT 10
    `).all(startDate, endDate) as Array<{ item_name: string; size_label: string; total_quantity: number }>;

    return {
      total_items_distributed: itemsDistributed.total,
      new_items_added: newItems.total,
      total_volunteer_hours: volunteerHours.total,
      unique_volunteers: volunteerHours.unique_volunteers,
      most_active_location: locationActivity[0]?.name || 'N/A',
      least_active_location: locationActivity[locationActivity.length - 1]?.name || 'N/A',
      top_items: topItems
    };
  }
}