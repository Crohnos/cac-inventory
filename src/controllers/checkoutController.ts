import { Request, Response, NextFunction } from 'express';
import { DatabaseConnection } from '../database/connection.js';

interface CheckoutItem {
  item_id: number;
  size_id: number | null;
  quantity: number;
}

interface CreateCheckoutData {
  location_id: number;
  checkout_date: string; // MM-DD-YYYY format
  worker_first_name: string;
  worker_last_name: string;
  department: string;
  case_number: string;
  allegations: string; // JSON string array
  parent_guardian_first_name: string;
  parent_guardian_last_name: string;
  zip_code: string;
  alleged_perpetrator_first_name?: string | null;
  alleged_perpetrator_last_name?: string | null;
  number_of_children: number;
  items: CheckoutItem[];
}

interface Checkout {
  checkout_id: number;
  location_id: number;
  checkout_date: string;
  worker_first_name: string;
  worker_last_name: string;
  department: string;
  case_number: string;
  allegations: string;
  parent_guardian_first_name: string;
  parent_guardian_last_name: string;
  zip_code: string;
  alleged_perpetrator_first_name?: string | null;
  alleged_perpetrator_last_name?: string | null;
  number_of_children: number;
  total_items: number;
  created_at: string;
}

export class CheckoutController {
  private static db = DatabaseConnection.getInstance();

  static async debugSchema(req: Request, res: Response, next: NextFunction) {
    try {
      const tableInfo = CheckoutController.db.prepare("PRAGMA table_info(checkouts)").all();
      res.json({
        success: true,
        tableInfo
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async createCheckout(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateCheckoutData = req.body;
      
      // Validation
      if (!data.location_id) {
        return res.status(400).json({
          success: false,
          error: 'Location ID is required'
        });
      }

      if (!data.worker_first_name?.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Worker first name is required'
        });
      }

      if (!data.worker_last_name?.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Worker last name is required'
        });
      }

      if (!data.department?.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Department is required'
        });
      }

      if (!data.case_number?.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Case number is required'
        });
      }

      if (!data.parent_guardian_first_name?.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Parent/Guardian first name is required'
        });
      }

      if (!data.parent_guardian_last_name?.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Parent/Guardian last name is required'
        });
      }

      if (!data.zip_code?.trim()) {
        return res.status(400).json({
          success: false,
          error: 'ZIP code is required'
        });
      }

      if (!data.items || data.items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one item is required for checkout'
        });
      }

      // Use transaction for atomic operation
      const transaction = CheckoutController.db.transaction(() => {
        // 1. Create checkout record
        const checkoutStmt = CheckoutController.db.prepare(`
          INSERT INTO checkouts (
            location_id, checkout_date, worker_first_name, worker_last_name,
            department, case_number, allegations, parent_guardian_first_name,
            parent_guardian_last_name, zip_code, alleged_perpetrator_first_name,
            alleged_perpetrator_last_name, number_of_children, total_items
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);
        
        const checkoutResult = checkoutStmt.run(
          data.location_id,
          data.checkout_date,
          data.worker_first_name,
          data.worker_last_name,
          data.department,
          data.case_number,
          data.allegations,
          data.parent_guardian_first_name,
          data.parent_guardian_last_name,
          data.zip_code,
          data.alleged_perpetrator_first_name || null,
          data.alleged_perpetrator_last_name || null,
          data.number_of_children,
          totalItems
        );
        
        const checkoutId = checkoutResult.lastInsertRowid as number;
        
        // 2. Create checkout items and update inventory
        const checkoutItemStmt = CheckoutController.db.prepare(`
          INSERT INTO checkout_items (checkout_id, item_id, size_id, quantity, item_name, size_label)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        const updateInventoryStmt = CheckoutController.db.prepare(`
          UPDATE item_sizes 
          SET current_quantity = current_quantity - ?
          WHERE size_id = ? AND current_quantity >= ?
        `);
        
        const getItemInfoStmt = CheckoutController.db.prepare(`
          SELECT i.name as item_name, s.size_label
          FROM item_sizes s
          JOIN items i ON s.item_id = i.item_id
          WHERE s.size_id = ?
        `);

        const getItemInfoNoSizeStmt = CheckoutController.db.prepare(`
          SELECT name as item_name
          FROM items
          WHERE item_id = ?
        `);

        // Process each item
        for (const item of data.items) {
          let itemInfo: { item_name: string; size_label: string } | undefined;

          // Get item info based on whether size_id exists
          if (item.size_id !== null) {
            itemInfo = getItemInfoStmt.get(item.size_id) as { item_name: string; size_label: string } | undefined;
          } else {
            // For items without sizes, get info from items table
            const itemData = getItemInfoNoSizeStmt.get(item.item_id) as { item_name: string } | undefined;
            if (itemData) {
              itemInfo = {
                item_name: itemData.item_name,
                size_label: 'N/A'
              };
            }
          }

          if (!itemInfo) {
            throw new Error(`Item not found for ${item.size_id !== null ? `size_id: ${item.size_id}` : `item_id: ${item.item_id}`}`);
          }
          
          // Update inventory (decrement stock) - only if item has a size_id
          if (item.size_id !== null) {
            const inventoryResult = updateInventoryStmt.run(item.quantity, item.size_id, item.quantity);

            if (inventoryResult.changes === 0) {
              // Check if item exists but has insufficient stock
              const stockCheck = CheckoutController.db.prepare(
                'SELECT current_quantity FROM item_sizes WHERE size_id = ?'
              ).get(item.size_id) as { current_quantity: number } | undefined;

              if (stockCheck) {
                throw new Error(
                  `Insufficient stock for ${itemInfo.item_name} (${itemInfo.size_label}). ` +
                  `Requested: ${item.quantity}, Available: ${stockCheck.current_quantity}`
                );
              } else {
                throw new Error(`Item not found: ${itemInfo.item_name} (${itemInfo.size_label})`);
              }
            }
          } else {
            // For items without size_id, we cannot track inventory changes
            // This should not happen in normal operation - all items should have at least one size entry
            console.warn(`Warning: Checkout item ${item.item_id} has no size_id. Inventory will not be decremented.`);
          }
          
          // Create checkout item record
          checkoutItemStmt.run(
            checkoutId,
            item.item_id,
            item.size_id,
            item.quantity,
            itemInfo.item_name,
            itemInfo.size_label
          );
        }
        
        return checkoutId;
      });
      
      const checkoutId = transaction();
      
      // Fetch the created checkout with details
      const createdCheckout = CheckoutController.db.prepare(`
        SELECT c.*, l.name as location_name
        FROM checkouts c
        JOIN locations l ON c.location_id = l.location_id
        WHERE c.checkout_id = ?
      `).get(checkoutId);
      
      res.status(201).json({
        success: true,
        data: createdCheckout,
        message: `Checkout completed successfully for ${data.parent_guardian_first_name} ${data.parent_guardian_last_name}`
      });
      
    } catch (error: any) {
      next(error);
    }
  }

  static async getCheckouts(req: Request, res: Response, next: NextFunction) {
    try {
      const locationId = req.query.location_id as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      let query = `
        SELECT c.*, l.name as location_name
        FROM checkouts c
        JOIN locations l ON c.location_id = l.location_id
      `;
      
      const params: any[] = [];
      
      if (locationId) {
        query += ' WHERE c.location_id = ?';
        params.push(parseInt(locationId));
      }
      
      query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const stmt = CheckoutController.db.prepare(query);
      const checkouts = stmt.all(...params);
      
      res.json({
        success: true,
        data: checkouts,
        count: checkouts.length
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async getCheckoutById(req: Request, res: Response, next: NextFunction) {
    try {
      const checkoutId = parseInt(req.params.id);
      
      if (isNaN(checkoutId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid checkout ID'
        });
      }
      
      // Get checkout details
      const checkoutStmt = CheckoutController.db.prepare(`
        SELECT c.*, l.name as location_name
        FROM checkouts c
        JOIN locations l ON c.location_id = l.location_id
        WHERE c.checkout_id = ?
      `);
      
      const checkout = checkoutStmt.get(checkoutId);
      
      if (!checkout) {
        return res.status(404).json({
          success: false,
          error: 'Checkout not found'
        });
      }
      
      // Get checkout items
      const itemsStmt = CheckoutController.db.prepare(`
        SELECT * FROM checkout_items 
        WHERE checkout_id = ? 
        ORDER BY item_name, size_label
      `);
      
      const items = itemsStmt.all(checkoutId);
      
      res.json({
        success: true,
        data: {
          ...checkout,
          items
        }
      });
    } catch (error: any) {
      next(error);
    }
  }
}