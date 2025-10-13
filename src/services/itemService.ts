import { DatabaseQueries } from '../database/queries.js';
import { LocationService } from './locationService.js';
import { v4 as uuidv4 } from 'uuid';

export interface Item {
  item_id?: number;
  name: string;
  description?: string;
  storage_location?: string;
  qr_code: string;
  has_sizes: boolean;
  min_stock_level?: number;
  unit_type?: string;
  size_count?: number;
  total_quantity?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ItemSize {
  size_id?: number;
  item_id: number;
  location_id: number;
  size_label: string;
  current_quantity: number;
  min_stock_level?: number;
  sort_order?: number;
  location_name?: string;
}

export interface CreateItemData {
  name: string;
  description?: string;
  storage_location?: string;
  has_sizes: boolean;
  sizes?: string[];
  min_stock_level?: number;
  unit_type?: string;
}

export class ItemService {
  static getAllItems(): Item[] {
    return DatabaseQueries.items.getAll.all() as Item[];
  }
  
  static getItemsByLocation(locationId: number): Item[] {
    return DatabaseQueries.items.getByLocation.all(locationId) as Item[];
  }
  
  static getById(id: number): Item | null {
    const result = DatabaseQueries.items.getById.get(id) as Item | undefined;
    return result || null;
  }
  
  static getByQrCode(qrCode: string): Item | null {
    const result = DatabaseQueries.items.getByQrCode.get(qrCode) as Item | undefined;
    return result || null;
  }
  
  static getItemSizes(itemId: number): ItemSize[] {
    return DatabaseQueries.itemSizes.getByItem.all(itemId) as ItemSize[];
  }
  
  static getItemSizesByLocation(itemId: number, locationId: number): ItemSize[] {
    return DatabaseQueries.itemSizes.getByItemAndLocation.all(itemId, locationId) as ItemSize[];
  }
  
  static create(data: CreateItemData): Item {
    const db = DatabaseQueries.items.create.database;
    
    // Generate unique QR code
    const qrCode = `RR-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    try {
      const transaction = db.transaction(() => {
        // Insert item
        const itemResult = DatabaseQueries.items.create.run(
          data.name,
          data.description || null,
          data.storage_location || null,
          qrCode,
          data.has_sizes ? 1 : 0,
          data.unit_type || 'each',
          data.min_stock_level || 5
        );
        
        const itemId = itemResult.lastInsertRowid as number;
        
        // Insert sizes for each location if has_sizes
        if (data.has_sizes && data.sizes && data.sizes.length > 0) {
          const locations = LocationService.getActiveLocations();
          
          for (const location of locations) {
            for (let i = 0; i < data.sizes!.length; i++) {
              DatabaseQueries.itemSizes.create.run(
                itemId,
                location.location_id,
                data.sizes![i],
                0, // initial quantity
                i   // sort order
              );
            }
          }
        } else {
          // Create single "N/A" size record for each location
          const locations = LocationService.getActiveLocations();
          
          for (const location of locations) {
            DatabaseQueries.itemSizes.create.run(
              itemId,
              location.location_id!,
              'N/A',
              0, // initial quantity
              0  // sort order
            );
          }
        }
        
        return itemId;
      });
      
      const itemId = transaction();
      const newItem = this.getById(itemId);
      
      if (!newItem) {
        throw new Error('Failed to retrieve created item');
      }
      
      return newItem;
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        const err = new Error(`Item with name '${data.name}' already exists`);
        (err as any).statusCode = 409;
        throw err;
      }
      throw error;
    }
  }
  
  static updateQuantity(sizeId: number, quantity: number): ItemSize {
    const existing = DatabaseQueries.itemSizes.getById.get(sizeId) as ItemSize | undefined;
    if (!existing) {
      const error = new Error(`Item size with ID ${sizeId} not found`);
      (error as any).statusCode = 404;
      throw error;
    }
    
    if (quantity < 0) {
      const error = new Error('Quantity cannot be negative');
      (error as any).statusCode = 400;
      throw error;
    }
    
    DatabaseQueries.itemSizes.updateQuantity.run(quantity, sizeId);
    
    const updated = DatabaseQueries.itemSizes.getById.get(sizeId) as ItemSize;
    return updated;
  }
  
  static adjustQuantity(sizeId: number, adjustment: number, adminName: string = 'Unknown', reason: string = 'Manual adjustment'): ItemSize {
    const existing = DatabaseQueries.itemSizes.getById.get(sizeId) as ItemSize | undefined;
    if (!existing) {
      const error = new Error(`Item size with ID ${sizeId} not found`);
      (error as any).statusCode = 404;
      throw error;
    }
    
    const newQuantity = existing.current_quantity + adjustment;
    if (newQuantity < 0) {
      const error = new Error(`Insufficient quantity. Current: ${existing.current_quantity}, Requested adjustment: ${adjustment}`);
      (error as any).statusCode = 400;
      throw error;
    }

    // Get item details for transaction logging
    const item = this.getById(existing.item_id);
    if (!item) {
      const error = new Error(`Item with ID ${existing.item_id} not found`);
      (error as any).statusCode = 404;
      throw error;
    }
    
    const db = DatabaseQueries.itemSizes.adjustQuantity.database;
    
    try {
      const transaction = db.transaction(() => {
        // Update the quantity
        DatabaseQueries.itemSizes.adjustQuantity.run(adjustment, sizeId);
        
        // Log the manual adjustment in the appropriate table
        const adjustmentResult = db.prepare(`
          INSERT INTO inventory_adjustments (
            location_id, 
            adjustment_date, 
            admin_name, 
            reason,
            notes, 
            total_items
          ) 
          VALUES (?, DATE('now'), ?, ?, ?, ?)
        `).run(
          existing.location_id,
          adminName,
          reason,
          `Manual inventory adjustment: ${existing.current_quantity} → ${newQuantity} (${adjustment > 0 ? '+' : ''}${adjustment}) ${existing.size_label} ${item.name}`,
          Math.abs(adjustment)
        );
        
        const adjustmentId = adjustmentResult.lastInsertRowid;
        
        // Log the line item
        db.prepare(`
          INSERT INTO inventory_adjustment_items (
            adjustment_id,
            item_id,
            size_id,
            quantity_adjustment,
            item_name,
            size_label
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          adjustmentId,
          existing.item_id,
          sizeId,
          adjustment, // Can be positive or negative
          item.name,
          existing.size_label
        );
      });
      
      transaction();
      
      const updated = DatabaseQueries.itemSizes.getById.get(sizeId) as ItemSize;
      return updated;
    } catch (error: any) {
      throw error;
    }
  }
}