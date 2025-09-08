import { DatabaseConnection } from './connection.js';

export class DatabaseQueries {
  private static db = DatabaseConnection.getInstance();

  // Location queries
  static readonly locations: any = {
    getAll: this.db.prepare('SELECT * FROM locations WHERE is_active = 1 ORDER BY name'),
    getById: this.db.prepare('SELECT * FROM locations WHERE location_id = ?'),
    create: this.db.prepare(`
      INSERT INTO locations (name, city, state, address, phone)
      VALUES (?, ?, ?, ?, ?)
    `),
    update: this.db.prepare(`
      UPDATE locations 
      SET name = ?, city = ?, state = ?, address = ?, phone = ?
      WHERE location_id = ?
    `),
    toggleActive: this.db.prepare(`
      UPDATE locations 
      SET is_active = NOT is_active
      WHERE location_id = ?
    `)
  };

  // Item queries
  static readonly items: any = {
    getAll: this.db.prepare(`
      SELECT i.*, 
             COUNT(DISTINCT is2.size_id) as size_count,
             SUM(is2.current_quantity) as total_quantity
      FROM items i
      LEFT JOIN item_sizes is2 ON i.item_id = is2.item_id
      GROUP BY i.item_id
      ORDER BY i.name
    `),
    getByLocation: this.db.prepare(`
      SELECT i.*, 
             COUNT(DISTINCT is2.size_id) as size_count,
             SUM(is2.current_quantity) as total_quantity
      FROM items i
      LEFT JOIN item_sizes is2 ON i.item_id = is2.item_id AND is2.location_id = ?
      GROUP BY i.item_id
      ORDER BY i.name
    `),
    getById: this.db.prepare(`
      SELECT * FROM items WHERE item_id = ?
    `),
    getByQrCode: this.db.prepare(`
      SELECT * FROM items WHERE qr_code = ?
    `),
    create: this.db.prepare(`
      INSERT INTO items (name, description, storage_location, qr_code, has_sizes, unit_type, min_stock_level)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `),
    update: this.db.prepare(`
      UPDATE items 
      SET name = ?, description = ?, storage_location = ?, has_sizes = ?, unit_type = ?, min_stock_level = ?
      WHERE item_id = ?
    `)
  };

  // Item sizes queries
  static readonly itemSizes: any = {
    getByItem: this.db.prepare(`
      SELECT is2.*, l.name as location_name
      FROM item_sizes is2
      JOIN locations l ON is2.location_id = l.location_id
      WHERE is2.item_id = ?
      ORDER BY l.name, is2.sort_order
    `),
    getByItemAndLocation: this.db.prepare(`
      SELECT is2.*
      FROM item_sizes is2
      WHERE is2.item_id = ? AND is2.location_id = ?
      ORDER BY is2.sort_order
    `),
    getById: this.db.prepare('SELECT * FROM item_sizes WHERE size_id = ?'),
    create: this.db.prepare(`
      INSERT INTO item_sizes (item_id, location_id, size_label, current_quantity, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `),
    updateQuantity: this.db.prepare(`
      UPDATE item_sizes 
      SET current_quantity = ?
      WHERE size_id = ?
    `),
    adjustQuantity: this.db.prepare(`
      UPDATE item_sizes 
      SET current_quantity = current_quantity + ?
      WHERE size_id = ?
    `)
  };
}