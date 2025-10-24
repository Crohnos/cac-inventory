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
        (c.worker_first_name || ' ' || c.worker_last_name) as case_worker,
        (c.parent_guardian_first_name || ' ' || c.parent_guardian_last_name) as client_info,
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

  // Transaction History Report
  static getTransactionHistory(itemId: number, filters: { startDate?: string; endDate?: string; locationId?: number }): TransactionHistoryRow[] {
    const transactions: TransactionHistoryRow[] = [];
    
    // Helper function to build parameters for each query
    const buildParams = (locationField: string = 'location_id') => {
      const queryParams: any[] = [itemId];
      
      if (filters.startDate && filters.endDate) {
        queryParams.push(filters.startDate, filters.endDate);
      } else if (filters.startDate) {
        queryParams.push(filters.startDate);
      } else if (filters.endDate) {
        queryParams.push(filters.endDate);
      }
      
      if (filters.locationId) {
        queryParams.push(filters.locationId);
      }
      
      return queryParams;
    };
    
    // Helper function to build date condition
    const getDateCondition = (dateField: string) => {
      if (dateField === 'c.checkout_date') {
        // Handle the special date format conversion for checkout_date
        const convertDateClause = `
          CASE 
            WHEN ${dateField} LIKE '%/%/%' THEN 
              substr(${dateField}, 7, 4) || '-' || 
              printf('%02d', substr(${dateField}, 1, instr(${dateField}, '/') - 1)) || '-' || 
              printf('%02d', substr(${dateField}, instr(${dateField}, '/') + 1, instr(substr(${dateField}, instr(${dateField}, '/') + 1), '/') - 1))
            WHEN ${dateField} LIKE '%-%-%' THEN
              substr(${dateField}, 7, 4) || '-' || 
              printf('%02d', substr(${dateField}, 1, instr(${dateField}, '-') - 1)) || '-' || 
              printf('%02d', substr(${dateField}, instr(${dateField}, '-') + 1, instr(substr(${dateField}, instr(${dateField}, '-') + 1), '-') - 1))
            ELSE ${dateField} 
          END`;
        
        if (filters.startDate && filters.endDate) {
          return `AND ${convertDateClause} BETWEEN ? AND ?`;
        } else if (filters.startDate) {
          return `AND ${convertDateClause} >= ?`;
        } else if (filters.endDate) {
          return `AND ${convertDateClause} <= ?`;
        }
      } else {
        // Standard DATE() function for other date fields
        if (filters.startDate && filters.endDate) {
          return `AND DATE(${dateField}) BETWEEN ? AND ?`;
        } else if (filters.startDate) {
          return `AND DATE(${dateField}) >= ?`;
        } else if (filters.endDate) {
          return `AND DATE(${dateField}) <= ?`;
        }
      }
      return '';
    };
    
    // Helper function to build location condition
    const getLocationCondition = (locationField: string) => {
      return filters.locationId ? `AND ${locationField} = ?` : '';
    };

    // 1. Get checkouts (items removed from inventory)
    const checkouts = this.db.prepare(`
      SELECT 
        CASE 
          WHEN c.checkout_date LIKE '%/%/%' THEN 
            substr(c.checkout_date, 7, 4) || '-' || 
            printf('%02d', substr(c.checkout_date, 1, instr(c.checkout_date, '/') - 1)) || '-' || 
            printf('%02d', substr(c.checkout_date, instr(c.checkout_date, '/') + 1, instr(substr(c.checkout_date, instr(c.checkout_date, '/') + 1), '/') - 1))
          WHEN c.checkout_date LIKE '%-%-%' THEN
            substr(c.checkout_date, 7, 4) || '-' || 
            printf('%02d', substr(c.checkout_date, 1, instr(c.checkout_date, '-') - 1)) || '-' || 
            printf('%02d', substr(c.checkout_date, instr(c.checkout_date, '-') + 1, instr(substr(c.checkout_date, instr(c.checkout_date, '-') + 1), '-') - 1))
          ELSE c.checkout_date 
        END as transaction_date,
        'CHECKOUT' as transaction_type,
        l.name as location_name,
        -ci.quantity as quantity,
        ci.size_label,
        NULL as volunteer_name,
        (c.worker_first_name || ' ' || c.worker_last_name) as case_worker,
        NULL as admin_name,
        NULL as source,
        NULL as reason,
        NULL as notes,
        NULL as from_location,
        NULL as to_location,
        c.created_at
      FROM checkout_items ci
      JOIN checkouts c ON ci.checkout_id = c.checkout_id
      JOIN locations l ON c.location_id = l.location_id
      WHERE ci.item_id = ? ${getDateCondition('c.checkout_date')} ${getLocationCondition('c.location_id')}
    `).all(...buildParams()) as TransactionHistoryRow[];

    // 2. Get additions (items added to inventory)
    const additions = this.db.prepare(`
      SELECT 
        DATE(ia.addition_date) as transaction_date,
        'ADDITION' as transaction_type,
        l.name as location_name,
        iai.quantity as quantity,
        iai.size_label,
        ia.volunteer_name,
        NULL as case_worker,
        NULL as admin_name,
        ia.source,
        NULL as reason,
        ia.notes,
        NULL as from_location,
        NULL as to_location,
        ia.created_at
      FROM inventory_addition_items iai
      JOIN inventory_additions ia ON iai.addition_id = ia.addition_id
      JOIN locations l ON ia.location_id = l.location_id
      WHERE iai.item_id = ? ${getDateCondition('ia.addition_date')} ${getLocationCondition('ia.location_id')}
    `).all(...buildParams()) as TransactionHistoryRow[];

    // 3. Get transfers out (items leaving a location)
    const transfersOut = this.db.prepare(`
      SELECT 
        DATE(it.transfer_date) as transaction_date,
        'TRANSFER_OUT' as transaction_type,
        l1.name as location_name,
        -iti.quantity as quantity,
        iti.size_label,
        it.volunteer_name,
        NULL as case_worker,
        NULL as admin_name,
        NULL as source,
        it.reason,
        it.notes,
        NULL as from_location,
        l2.name as to_location,
        it.created_at
      FROM inventory_transfer_items iti
      JOIN inventory_transfers it ON iti.transfer_id = it.transfer_id
      JOIN locations l1 ON it.from_location_id = l1.location_id
      JOIN locations l2 ON it.to_location_id = l2.location_id
      WHERE iti.item_id = ? ${getDateCondition('it.transfer_date')} ${getLocationCondition('it.from_location_id')}
    `).all(...buildParams()) as TransactionHistoryRow[];

    // 4. Get transfers in (items arriving at a location)  
    const transfersIn = this.db.prepare(`
      SELECT 
        DATE(it.transfer_date) as transaction_date,
        'TRANSFER_IN' as transaction_type,
        l2.name as location_name,
        iti.quantity as quantity,
        iti.size_label,
        it.volunteer_name,
        NULL as case_worker,
        NULL as admin_name,
        NULL as source,
        it.reason,
        it.notes,
        l1.name as from_location,
        NULL as to_location,
        it.created_at
      FROM inventory_transfer_items iti
      JOIN inventory_transfers it ON iti.transfer_id = it.transfer_id
      JOIN locations l1 ON it.from_location_id = l1.location_id
      JOIN locations l2 ON it.to_location_id = l2.location_id
      WHERE iti.item_id = ? ${getDateCondition('it.transfer_date')} ${getLocationCondition('it.to_location_id')}
    `).all(...buildParams()) as TransactionHistoryRow[];

    // 5. Get manual adjustments (admin corrections)
    const manualAdjustments = this.db.prepare(`
      SELECT 
        DATE(ia.adjustment_date) as transaction_date,
        'MANUAL_ADJUSTMENT' as transaction_type,
        l.name as location_name,
        iai.quantity_adjustment as quantity,
        iai.size_label,
        NULL as volunteer_name,
        NULL as case_worker,
        ia.admin_name,
        NULL as source,
        ia.reason,
        ia.notes,
        NULL as from_location,
        NULL as to_location,
        ia.created_at
      FROM inventory_adjustment_items iai
      JOIN inventory_adjustments ia ON iai.adjustment_id = ia.adjustment_id
      JOIN locations l ON ia.location_id = l.location_id
      WHERE iai.item_id = ? ${getDateCondition('ia.adjustment_date')} ${getLocationCondition('ia.location_id')}
    `).all(...buildParams()) as TransactionHistoryRow[];

    // Combine all transactions
    transactions.push(...checkouts, ...additions, ...transfersOut, ...transfersIn, ...manualAdjustments);

    // Sort by date (most recent first)
    transactions.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());

    return transactions;
  }

  // Monthly Inventory Movements Report
  static getMonthlyInventoryMovements(filters: {
    month: number;
    year: number;
    locationId?: number;
  }): MonthlyInventoryMovementRow[] {
    const startDate = `${filters.year}-${filters.month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(filters.year, filters.month, 0).toISOString().split('T')[0]; // Last day of month
    
    let query = `
      WITH monthly_movements AS (
        -- Get all items and locations for the base data
        SELECT DISTINCT
          i.item_id,
          i.name as item_name,
          is2.size_label,
          l.location_id,
          l.name as location_name,
          i.unit_type
        FROM items i
        JOIN item_sizes is2 ON i.item_id = is2.item_id
        JOIN locations l ON is2.location_id = l.location_id
        WHERE l.is_active = 1
      ),
      
      -- Additions from inventory_additions
      additions AS (
        SELECT 
          iai.item_id,
          iai.size_label,
          ia.location_id,
          SUM(iai.quantity) as total_quantity,
          COUNT(*) as transaction_count
        FROM inventory_addition_items iai
        JOIN inventory_additions ia ON iai.addition_id = ia.addition_id
        WHERE DATE(ia.addition_date) BETWEEN ? AND ?
        GROUP BY iai.item_id, iai.size_label, ia.location_id
      ),
      
      -- Checkouts (items leaving inventory)
      checkout_data AS (
        SELECT 
          ci.item_id,
          ci.size_label,
          c.location_id,
          SUM(ci.quantity) as total_quantity,
          COUNT(*) as transaction_count
        FROM checkout_items ci
        JOIN checkouts c ON ci.checkout_id = c.checkout_id
        WHERE CASE 
          WHEN c.checkout_date LIKE '%/%/%' THEN 
            substr(c.checkout_date, 7, 4) || '-' || 
            printf('%02d', substr(c.checkout_date, 1, instr(c.checkout_date, '/') - 1)) || '-' || 
            printf('%02d', substr(c.checkout_date, instr(c.checkout_date, '/') + 1, instr(substr(c.checkout_date, instr(c.checkout_date, '/') + 1), '/') - 1))
          WHEN c.checkout_date LIKE '%-%-%' THEN
            substr(c.checkout_date, 7, 4) || '-' || 
            printf('%02d', substr(c.checkout_date, 1, instr(c.checkout_date, '-') - 1)) || '-' || 
            printf('%02d', substr(c.checkout_date, instr(c.checkout_date, '-') + 1, instr(substr(c.checkout_date, instr(c.checkout_date, '-') + 1), '-') - 1))
          ELSE c.checkout_date 
        END BETWEEN ? AND ?
        GROUP BY ci.item_id, ci.size_label, c.location_id
      ),
      
      -- Transfers IN (items arriving at location)
      transfers_in AS (
        SELECT 
          iti.item_id,
          iti.size_label,
          it.to_location_id as location_id,
          SUM(iti.quantity) as total_quantity,
          COUNT(*) as transaction_count
        FROM inventory_transfer_items iti
        JOIN inventory_transfers it ON iti.transfer_id = it.transfer_id
        WHERE DATE(it.transfer_date) BETWEEN ? AND ?
        GROUP BY iti.item_id, iti.size_label, it.to_location_id
      ),
      
      -- Transfers OUT (items leaving location)
      transfers_out AS (
        SELECT 
          iti.item_id,
          iti.size_label,
          it.from_location_id as location_id,
          SUM(iti.quantity) as total_quantity,
          COUNT(*) as transaction_count
        FROM inventory_transfer_items iti
        JOIN inventory_transfers it ON iti.transfer_id = it.transfer_id
        WHERE DATE(it.transfer_date) BETWEEN ? AND ?
        GROUP BY iti.item_id, iti.size_label, it.from_location_id
      ),
      
      -- Manual adjustments (positive and negative)
      manual_additions AS (
        SELECT 
          iai.item_id,
          iai.size_label,
          ia.location_id,
          SUM(iai.quantity_adjustment) as total_quantity,
          COUNT(*) as transaction_count
        FROM inventory_adjustment_items iai
        JOIN inventory_adjustments ia ON iai.adjustment_id = ia.adjustment_id
        WHERE DATE(ia.adjustment_date) BETWEEN ? AND ?
          AND iai.quantity_adjustment > 0
        GROUP BY iai.item_id, iai.size_label, ia.location_id
      ),
      
      manual_subtractions AS (
        SELECT 
          iai.item_id,
          iai.size_label,
          ia.location_id,
          SUM(ABS(iai.quantity_adjustment)) as total_quantity,
          COUNT(*) as transaction_count
        FROM inventory_adjustment_items iai
        JOIN inventory_adjustments ia ON iai.adjustment_id = ia.adjustment_id
        WHERE DATE(ia.adjustment_date) BETWEEN ? AND ?
          AND iai.quantity_adjustment < 0
        GROUP BY iai.item_id, iai.size_label, ia.location_id
      )
      
      SELECT 
        mm.item_name,
        mm.size_label,
        mm.location_name,
        mm.unit_type,
        COALESCE(a.total_quantity, 0) as additions_total,
        COALESCE(a.transaction_count, 0) as additions_count,
        COALESCE(co.total_quantity, 0) as checkouts_total,
        COALESCE(co.transaction_count, 0) as checkouts_count,
        COALESCE(ti.total_quantity, 0) as transfers_in_total,
        COALESCE(ti.transaction_count, 0) as transfers_in_count,
        COALESCE(tou.total_quantity, 0) as transfers_out_total,
        COALESCE(tou.transaction_count, 0) as transfers_out_count,
        COALESCE(ma.total_quantity, 0) as manual_additions_total,
        COALESCE(ma.transaction_count, 0) as manual_additions_count,
        COALESCE(ms.total_quantity, 0) as manual_subtractions_total,
        COALESCE(ms.transaction_count, 0) as manual_subtractions_count,
        (
          COALESCE(a.total_quantity, 0) + 
          COALESCE(ti.total_quantity, 0) + 
          COALESCE(ma.total_quantity, 0) - 
          COALESCE(co.total_quantity, 0) - 
          COALESCE(tou.total_quantity, 0) - 
          COALESCE(ms.total_quantity, 0)
        ) as net_change
      FROM monthly_movements mm
      LEFT JOIN additions a ON mm.item_id = a.item_id 
        AND mm.size_label = a.size_label 
        AND mm.location_id = a.location_id
      LEFT JOIN checkout_data co ON mm.item_id = co.item_id 
        AND mm.size_label = co.size_label 
        AND mm.location_id = co.location_id
      LEFT JOIN transfers_in ti ON mm.item_id = ti.item_id 
        AND mm.size_label = ti.size_label 
        AND mm.location_id = ti.location_id
      LEFT JOIN transfers_out tou ON mm.item_id = tou.item_id 
        AND mm.size_label = tou.size_label 
        AND mm.location_id = tou.location_id
      LEFT JOIN manual_additions ma ON mm.item_id = ma.item_id 
        AND mm.size_label = ma.size_label 
        AND mm.location_id = ma.location_id
      LEFT JOIN manual_subtractions ms ON mm.item_id = ms.item_id 
        AND mm.size_label = ms.size_label 
        AND mm.location_id = ms.location_id
      WHERE (
        COALESCE(a.total_quantity, 0) + 
        COALESCE(ti.total_quantity, 0) + 
        COALESCE(ma.total_quantity, 0) + 
        COALESCE(co.total_quantity, 0) + 
        COALESCE(tou.total_quantity, 0) + 
        COALESCE(ms.total_quantity, 0)
      ) > 0
    `;
    
    const params: any[] = [
      startDate, endDate, // additions
      startDate, endDate, // checkouts  
      startDate, endDate, // transfers in
      startDate, endDate, // transfers out
      startDate, endDate, // manual additions
      startDate, endDate  // manual subtractions
    ];
    
    if (filters.locationId) {
      query += ' AND mm.location_id = ?';
      params.push(filters.locationId);
    }
    
    query += ' ORDER BY mm.item_name, mm.size_label, mm.location_name';
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params) as MonthlyInventoryMovementRow[];
  }
}