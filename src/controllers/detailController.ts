import { Request, Response, NextFunction } from 'express';
import { dbAsync } from '../database/connection.js';
import { getCurrentTimestamp } from '../database/setup.js';
import { NotFoundError } from '../utils/errors.js';
import { generateUniqueQrValue, generateQrCodeDataUrl } from '../utils/qrCode.js';
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
    
    // Generate a unique QR code value
    const qrCodeValue = await generateUniqueQrValue();
    const timestamp = getCurrentTimestamp();
    
    // Insert into database
    const result = await dbAsync.run(
      `INSERT INTO ItemDetail (
        itemCategoryId, sizeId, condition, location, qrCodeValue, 
        receivedDate, donorInfo, approxPrice, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        itemCategoryId,
        sizeId || null,
        condition,
        location,
        qrCodeValue,
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
    
    // Generate a QR code data URL
    const qrCodeDataUrl = await generateQrCodeDataUrl(qrCodeValue);
    
    // Return the item with its QR code
    res.status(201).json({
      ...createdItem,
      qrCodeDataUrl
    });
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
    
    // Generate QR code data URL
    const qrCodeDataUrl = await generateQrCodeDataUrl(detail.qrCodeValue);
    
    res.json({
      ...detail,
      qrCodeDataUrl
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get an item detail by QR code value
 */
export const getDetailByQrCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { qrCodeValue } = req.params;
    
    const detail = await dbAsync.get(`
      SELECT 
        d.*,
        c.name as categoryName,
        s.name as sizeName
      FROM ItemDetail d
      LEFT JOIN ItemCategory c ON d.itemCategoryId = c.id
      LEFT JOIN Size s ON d.sizeId = s.id
      WHERE d.qrCodeValue = ?
    `, [qrCodeValue]);
    
    if (!detail) {
      return res.status(404).json({
        error: 'Item not found',
        details: `No item with QR code ${qrCodeValue} exists`
      });
    }
    
    // Generate QR code data URL
    const qrCodeDataUrl = await generateQrCodeDataUrl(qrCodeValue);
    
    res.json({
      ...detail,
      qrCodeDataUrl
    });
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
    
    // Generate QR code data URL
    const qrCodeDataUrl = await generateQrCodeDataUrl(updatedItem.qrCodeValue);
    
    res.json({
      ...updatedItem,
      qrCodeDataUrl
    });
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