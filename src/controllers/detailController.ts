import { Request, Response, NextFunction } from 'express';
import { dbAsync } from '../database/connection.js';
import { getCurrentTimestamp } from '../database/setup.js';
import { NotFoundError } from '../utils/errors.js';
import { 
  ItemDetailInput, 
  ItemDetailUpdateInput,
  ItemTransferInput
} from '../models/itemDetailSchema.js';

/**
 * Get all item details with optional filtering
 */
export const getAllDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categoryId, location, isActive } = req.query;
    
    let sql = `
      SELECT 
        d.*,
        c.name as categoryName,
        s.name as sizeName
      FROM ItemDetail d
      LEFT JOIN ItemCategory c ON d.itemCategoryId = c.id
      LEFT JOIN Size s ON d.sizeId = s.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    // Add filters if provided
    if (categoryId) {
      sql += ' AND d.itemCategoryId = ?';
      params.push(categoryId);
    }
    
    if (location) {
      sql += ' AND d.location = ?';
      params.push(location);
    }
    
    if (isActive !== undefined) {
      sql += ' AND d.isActive = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }
    
    sql += ' ORDER BY d.receivedDate DESC';
    
    const details = await dbAsync.all(sql, params);
    res.json(details);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new item detail
 */
export const createDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract and validate input from request body
    const { 
      itemCategoryId, 
      sizeId, 
      condition, 
      location, 
      receivedDate,
      donorInfo,
      approxPrice,
      isActive
    }: ItemDetailInput = req.body;
    
    // Check if the item category exists
    const category = await dbAsync.get(
      'SELECT * FROM ItemCategory WHERE id = ?', 
      [itemCategoryId]
    );
    
    if (!category) {
      return res.status(404).json({
        error: 'Item category not found',
        details: `No category with ID ${itemCategoryId} exists`
      });
    }
    
    // Check if size exists and belongs to this category
    if (sizeId) {
      const sizeExists = await dbAsync.get(
        'SELECT * FROM Size WHERE id = ?',
        [sizeId]
      );
      
      if (!sizeExists) {
        return res.status(404).json({
          error: 'Size not found',
          details: `No size with ID ${sizeId} exists`
        });
      }
      
      const sizeInCategory = await dbAsync.get(
        'SELECT * FROM ItemSize WHERE itemCategoryId = ? AND sizeId = ?',
        [itemCategoryId, sizeId]
      );
      
      if (!sizeInCategory) {
        return res.status(400).json({
          error: 'Invalid size for category',
          details: `Size ${sizeId} is not associated with category ${itemCategoryId}`
        });
      }
    }
    
    const timestamp = getCurrentTimestamp();
    
    // Insert into database
    const result = await dbAsync.run(
      `INSERT INTO ItemDetail (
        itemCategoryId, sizeId, condition, location, 
        receivedDate, donorInfo, approxPrice, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        itemCategoryId,
        sizeId || null,
        condition,
        location,
        receivedDate,
        donorInfo || null,
        approxPrice || null,
        isActive ? 1 : 0,
        timestamp,
        timestamp
      ]
    );
    
    // Get the created item with related data
    const createdItem = await dbAsync.get(`
      SELECT 
        d.*,
        c.name as categoryName,
        s.name as sizeName
      FROM ItemDetail d
      LEFT JOIN ItemCategory c ON d.itemCategoryId = c.id
      LEFT JOIN Size s ON d.sizeId = s.id
      WHERE d.id = ?
    `, [result.lastID]);
    
    res.status(201).json(createdItem);
  } catch (error) {
    next(error);
  }
};

/**
 * Get an item detail by ID
 */
export const getDetailById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    
    const detail = await dbAsync.get(`
      SELECT 
        d.*,
        c.name as categoryName,
        s.name as sizeName
      FROM ItemDetail d
      LEFT JOIN ItemCategory c ON d.itemCategoryId = c.id
      LEFT JOIN Size s ON d.sizeId = s.id
      WHERE d.id = ?
    `, [id]);
    
    if (!detail) {
      throw new NotFoundError(`Item detail with ID ${id} not found`);
    }
    
    res.json(detail);
  } catch (error) {
    next(error);
  }
};


/**
 * Update an item detail
 */
export const updateDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updateData: ItemDetailUpdateInput = req.body;
    
    // Check if item exists
    const item = await dbAsync.get('SELECT * FROM ItemDetail WHERE id = ?', [id]);
    if (!item) {
      throw new NotFoundError(`Item detail with ID ${id} not found`);
    }
    
    // Check if category exists if updating
    if (updateData.itemCategoryId) {
      const category = await dbAsync.get(
        'SELECT * FROM ItemCategory WHERE id = ?', 
        [updateData.itemCategoryId]
      );
      
      if (!category) {
        return res.status(404).json({
          error: 'Item category not found',
          details: `No category with ID ${updateData.itemCategoryId} exists`
        });
      }
    }
    
    // Check if size exists and belongs to this category if updating
    if (updateData.sizeId) {
      const sizeExists = await dbAsync.get(
        'SELECT * FROM Size WHERE id = ?',
        [updateData.sizeId]
      );
      
      if (!sizeExists) {
        return res.status(404).json({
          error: 'Size not found',
          details: `No size with ID ${updateData.sizeId} exists`
        });
      }
      
      // Get the effective category ID (either from update or existing item)
      const effectiveCategoryId = updateData.itemCategoryId || item.itemCategoryId;
      
      const sizeInCategory = await dbAsync.get(
        'SELECT * FROM ItemSize WHERE itemCategoryId = ? AND sizeId = ?',
        [effectiveCategoryId, updateData.sizeId]
      );
      
      if (!sizeInCategory) {
        return res.status(400).json({
          error: 'Invalid size for category',
          details: `Size ${updateData.sizeId} is not associated with category ${effectiveCategoryId}`
        });
      }
    }
    
    // Prepare update query parts
    const timestamp = getCurrentTimestamp();
    const updates: string[] = [];
    const values: any[] = [];
    
    // Add each field if it exists in the update data
    if (updateData.itemCategoryId !== undefined) {
      updates.push('itemCategoryId = ?');
      values.push(updateData.itemCategoryId);
    }
    
    if (updateData.sizeId !== undefined) {
      updates.push('sizeId = ?');
      values.push(updateData.sizeId || null);
    }
    
    if (updateData.condition !== undefined) {
      updates.push('condition = ?');
      values.push(updateData.condition);
    }
    
    if (updateData.location !== undefined) {
      updates.push('location = ?');
      values.push(updateData.location);
    }
    
    if (updateData.receivedDate !== undefined) {
      updates.push('receivedDate = ?');
      values.push(updateData.receivedDate);
    }
    
    if (updateData.donorInfo !== undefined) {
      updates.push('donorInfo = ?');
      values.push(updateData.donorInfo || null);
    }
    
    if (updateData.approxPrice !== undefined) {
      updates.push('approxPrice = ?');
      values.push(updateData.approxPrice || null);
    }
    
    if (updateData.isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(updateData.isActive ? 1 : 0);
    }
    
    // Add updated timestamp
    updates.push('updatedAt = ?');
    values.push(timestamp);
    
    // Add ID for WHERE clause
    values.push(id);
    
    // If there are fields to update
    if (updates.length > 0) {
      await dbAsync.run(
        `UPDATE ItemDetail SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }
    
    // Get the updated item with related data
    const updatedItem = await dbAsync.get(`
      SELECT 
        d.*,
        c.name as categoryName,
        s.name as sizeName
      FROM ItemDetail d
      LEFT JOIN ItemCategory c ON d.itemCategoryId = c.id
      LEFT JOIN Size s ON d.sizeId = s.id
      WHERE d.id = ?
    `, [id]);
    
    res.json(updatedItem);
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate an item detail (set isActive = 0)
 */
export const deactivateDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    
    // Check if item exists
    const item = await dbAsync.get('SELECT * FROM ItemDetail WHERE id = ?', [id]);
    if (!item) {
      throw new NotFoundError(`Item detail with ID ${id} not found`);
    }
    
    // If already inactive, return success
    if (item.isActive === 0) {
      return res.json({ message: 'Item is already inactive' });
    }
    
    const timestamp = getCurrentTimestamp();
    
    await dbAsync.run(
      'UPDATE ItemDetail SET isActive = 0, updatedAt = ? WHERE id = ?',
      [timestamp, id]
    );
    
    res.json({ message: 'Item deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Transfer an item to a new location
 */
export const transferDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { location }: ItemTransferInput = req.body;
    
    // Check if item exists
    const item = await dbAsync.get('SELECT * FROM ItemDetail WHERE id = ?', [id]);
    if (!item) {
      throw new NotFoundError(`Item detail with ID ${id} not found`);
    }
    
    // If location is the same, return early
    if (item.location === location) {
      return res.json({ message: `Item is already at ${location}` });
    }
    
    const timestamp = getCurrentTimestamp();
    
    await dbAsync.run(
      'UPDATE ItemDetail SET location = ?, updatedAt = ? WHERE id = ?',
      [location, timestamp, id]
    );
    
    res.json({ 
      message: `Item transferred to ${location} successfully`,
      previousLocation: item.location,
      newLocation: location
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk create items for a category
 */
export const bulkCreateDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categoryId, quantity, location, sizeId } = req.body;
    
    // Validate quantity (1-3)
    if (!quantity || quantity < 1 || quantity > 3) {
      return res.status(400).json({
        error: 'Invalid quantity',
        details: 'Quantity must be between 1 and 3'
      });
    }
    
    // Validate category exists
    const category = await dbAsync.get(
      'SELECT * FROM ItemCategory WHERE id = ?',
      [categoryId]
    );
    
    if (!category) {
      throw new NotFoundError(`Category with ID ${categoryId} not found`);
    }
    
    // If size is provided, validate it's associated with the category
    if (sizeId) {
      const sizeAssociation = await dbAsync.get(
        'SELECT * FROM ItemSize WHERE itemCategoryId = ? AND sizeId = ?',
        [categoryId, sizeId]
      );
      
      if (!sizeAssociation) {
        return res.status(400).json({
          error: 'Invalid size for category',
          details: `Size ${sizeId} is not associated with category ${categoryId}`
        });
      }
    }
    
    const timestamp = getCurrentTimestamp();
    const receivedDate = new Date().toISOString().split('T')[0];
    const createdItems = [];
    
    // Create the specified number of items
    for (let i = 0; i < quantity; i++) {
      const result = await dbAsync.run(
        `INSERT INTO ItemDetail (
          itemCategoryId, sizeId, condition, location, 
          receivedDate, isActive, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          categoryId,
          sizeId || null,
          'New',
          location,
          receivedDate,
          1,
          timestamp,
          timestamp
        ]
      );
      
      // Get the created item with category and size names
      const createdItem = await dbAsync.get(`
        SELECT 
          d.*,
          c.name as categoryName,
          s.name as sizeName
        FROM ItemDetail d
        LEFT JOIN ItemCategory c ON d.itemCategoryId = c.id
        LEFT JOIN Size s ON d.sizeId = s.id
        WHERE d.id = ?
      `, [result.lastID]);
      
      createdItems.push(createdItem);
    }
    
    res.json({
      success: true,
      message: `Successfully created ${quantity} item${quantity > 1 ? 's' : ''}`,
      createdCount: quantity,
      items: createdItems
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk deactivate items for a category
 */
export const bulkDeactivateDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categoryId, quantity, location } = req.body;
    
    // Validate quantity (1-3)
    if (!quantity || quantity < 1 || quantity > 3) {
      return res.status(400).json({
        error: 'Invalid quantity',
        details: 'Quantity must be between 1 and 3'
      });
    }
    
    // Find active items for the category at the specified location
    const activeItems = await dbAsync.all(
      `SELECT id FROM ItemDetail 
       WHERE itemCategoryId = ? AND location = ? AND isActive = 1 
       ORDER BY receivedDate ASC, id ASC 
       LIMIT ?`,
      [categoryId, location, quantity]
    );
    
    if (activeItems.length === 0) {
      return res.json({
        success: true,
        message: 'No active items found to deactivate',
        deactivatedCount: 0
      });
    }
    
    const timestamp = getCurrentTimestamp();
    const itemIds = activeItems.map(item => item.id);
    const placeholders = itemIds.map(() => '?').join(',');
    
    // Deactivate the items
    await dbAsync.run(
      `UPDATE ItemDetail 
       SET isActive = 0, updatedAt = ? 
       WHERE id IN (${placeholders})`,
      [timestamp, ...itemIds]
    );
    
    res.json({
      success: true,
      message: `Successfully deactivated ${activeItems.length} item${activeItems.length > 1 ? 's' : ''}`,
      deactivatedCount: activeItems.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk transfer items between locations
 */
export const bulkTransferDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categoryId, quantity, fromLocation, toLocation } = req.body;
    
    // Validate quantity (1-3)
    if (!quantity || quantity < 1 || quantity > 3) {
      return res.status(400).json({
        error: 'Invalid quantity',
        details: 'Quantity must be between 1 and 3'
      });
    }
    
    // Validate locations are different
    if (fromLocation === toLocation) {
      return res.status(400).json({
        error: 'Invalid transfer',
        details: 'Source and destination locations must be different'
      });
    }
    
    // Find active items for the category at the source location
    const itemsToTransfer = await dbAsync.all(
      `SELECT id FROM ItemDetail 
       WHERE itemCategoryId = ? AND location = ? AND isActive = 1 
       ORDER BY receivedDate ASC, id ASC 
       LIMIT ?`,
      [categoryId, fromLocation, quantity]
    );
    
    if (itemsToTransfer.length === 0) {
      return res.json({
        success: true,
        message: 'No items found to transfer',
        transferredCount: 0
      });
    }
    
    const timestamp = getCurrentTimestamp();
    const itemIds = itemsToTransfer.map(item => item.id);
    const placeholders = itemIds.map(() => '?').join(',');
    
    // Transfer the items
    await dbAsync.run(
      `UPDATE ItemDetail 
       SET location = ?, updatedAt = ? 
       WHERE id IN (${placeholders})`,
      [toLocation, timestamp, ...itemIds]
    );
    
    res.json({
      success: true,
      message: `Successfully transferred ${itemsToTransfer.length} item${itemsToTransfer.length > 1 ? 's' : ''} from ${fromLocation} to ${toLocation}`,
      transferredCount: itemsToTransfer.length
    });
  } catch (error) {
    next(error);
  }
};