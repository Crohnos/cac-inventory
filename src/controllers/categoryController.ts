import { Request, Response, NextFunction } from 'express';
import { dbAsync } from '../database/connection.js';
import { getCurrentTimestamp } from '../database/setup.js';
import { NotFoundError } from '../utils/errors.js';
import { 
  ItemCategoryInput, 
  ItemCategoryUpdateInput, 
  CategorySizeInput 
} from '../models/itemCategorySchema.js';

/**
 * Get all categories with total quantity calculation
 */
export const getAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log('GET /api/item-categories - getAllCategories called');
  try {
    console.log('Executing SQL query to get all categories...');
    const categories = await dbAsync.all(`
      SELECT 
        c.*,
        COALESCE(
          (SELECT COUNT(*) FROM ItemDetail WHERE itemCategoryId = c.id AND isActive = 1),
          0
        ) as totalQuantity
      FROM ItemCategory c
      ORDER BY c.name
    `);
    
    console.log(`Successfully retrieved ${categories.length} categories`);
    res.json(categories);
  } catch (error) {
    console.error('Error in getAllCategories:', error);
    next(error);
  }
};

/**
 * Create a new category
 */
export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, lowStockThreshold }: ItemCategoryInput = req.body;
    const timestamp = getCurrentTimestamp();
    
    const result = await dbAsync.run(
      'INSERT INTO ItemCategory (name, description, lowStockThreshold, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
      [name, description || null, lowStockThreshold, timestamp, timestamp]
    );
    
    // Get the created category
    const category = await dbAsync.get('SELECT * FROM ItemCategory WHERE id = ?', [result.lastID]);
    res.status(201).json(category);
  } catch (error) {
    // Check for SQLITE_CONSTRAINT error (unique constraint violation)
    const sqliteError = error as any;
    if (sqliteError.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({
        error: 'Category already exists',
        details: 'A category with this name already exists'
      });
    }
    next(error);
  }
};

/**
 * Get a category by ID with total quantity
 */
export const getCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    
    const category = await dbAsync.get(`
      SELECT 
        c.*,
        COALESCE(
          (SELECT COUNT(*) FROM ItemDetail WHERE itemCategoryId = c.id AND isActive = 1),
          0
        ) as totalQuantity
      FROM ItemCategory c
      WHERE c.id = ?
    `, [id]);
    
    if (!category) {
      throw new NotFoundError(`Category with ID ${id} not found`);
    }
    
    res.json(category);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a category
 */
export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, description, lowStockThreshold }: ItemCategoryUpdateInput = req.body;
    
    // Check if category exists
    const category = await dbAsync.get('SELECT * FROM ItemCategory WHERE id = ?', [id]);
    if (!category) {
      throw new NotFoundError(`Category with ID ${id} not found`);
    }
    
    const timestamp = getCurrentTimestamp();
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    
    if (lowStockThreshold !== undefined) {
      updates.push('lowStockThreshold = ?');
      values.push(lowStockThreshold);
    }
    
    updates.push('updatedAt = ?');
    values.push(timestamp);
    values.push(id);
    
    await dbAsync.run(
      `UPDATE ItemCategory SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    // Get the updated category with total quantity
    const updatedCategory = await dbAsync.get(`
      SELECT 
        c.*,
        COALESCE(
          (SELECT COUNT(*) FROM ItemDetail WHERE itemCategoryId = c.id AND isActive = 1),
          0
        ) as totalQuantity
      FROM ItemCategory c
      WHERE c.id = ?
    `, [id]);
    
    res.json(updatedCategory);
  } catch (error) {
    // Check for SQLITE_CONSTRAINT error (unique constraint violation)
    const sqliteError = error as any;
    if (sqliteError.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({
        error: 'Category already exists',
        details: 'A category with this name already exists'
      });
    }
    next(error);
  }
};

/**
 * Delete a category
 */
export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    
    // Check if category exists
    const category = await dbAsync.get('SELECT * FROM ItemCategory WHERE id = ?', [id]);
    if (!category) {
      throw new NotFoundError(`Category with ID ${id} not found`);
    }
    
    // Check if category is being used in any item detail
    const inUse = await dbAsync.get('SELECT id FROM ItemDetail WHERE itemCategoryId = ? LIMIT 1', [id]);
    if (inUse) {
      return res.status(409).json({
        error: 'Category is in use',
        details: 'This category is associated with one or more items and cannot be deleted'
      });
    }
    
    // Delete the category (will cascade to ItemSize entries due to ON DELETE CASCADE)
    await dbAsync.run('DELETE FROM ItemCategory WHERE id = ?', [id]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * Get all sizes associated with a category
 */
export const getCategorySizes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    
    // Check if category exists
    const category = await dbAsync.get('SELECT * FROM ItemCategory WHERE id = ?', [id]);
    if (!category) {
      throw new NotFoundError(`Category with ID ${id} not found`);
    }
    
    const sizes = await dbAsync.all(`
      SELECT s.* 
      FROM Size s
      JOIN ItemSize is2 ON s.id = is2.sizeId
      WHERE is2.itemCategoryId = ?
      ORDER BY s.name
    `, [id]);
    
    res.json(sizes);
  } catch (error) {
    next(error);
  }
};

/**
 * Add a size to a category
 */
export const addSizeToCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { sizeId }: CategorySizeInput = req.body;
    
    // Check if category exists
    const category = await dbAsync.get('SELECT * FROM ItemCategory WHERE id = ?', [id]);
    if (!category) {
      throw new NotFoundError(`Category with ID ${id} not found`);
    }
    
    // Check if size exists
    const size = await dbAsync.get('SELECT * FROM Size WHERE id = ?', [sizeId]);
    if (!size) {
      throw new NotFoundError(`Size with ID ${sizeId} not found`);
    }
    
    // Check if association already exists
    const existing = await dbAsync.get(
      'SELECT * FROM ItemSize WHERE itemCategoryId = ? AND sizeId = ?',
      [id, sizeId]
    );
    
    if (existing) {
      // Association already exists, return the existing size
      return res.status(200).json(size);
    }
    
    const timestamp = getCurrentTimestamp();
    
    // Create the association
    await dbAsync.run(
      'INSERT INTO ItemSize (itemCategoryId, sizeId, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
      [id, sizeId, timestamp, timestamp]
    );
    
    res.status(201).json(size);
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a size from a category
 */
export const removeSizeFromCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categoryId, sizeId } = req.params;
    
    // Check if category exists
    const category = await dbAsync.get('SELECT * FROM ItemCategory WHERE id = ?', [categoryId]);
    if (!category) {
      throw new NotFoundError(`Category with ID ${categoryId} not found`);
    }
    
    // Check if size exists
    const size = await dbAsync.get('SELECT * FROM Size WHERE id = ?', [sizeId]);
    if (!size) {
      throw new NotFoundError(`Size with ID ${sizeId} not found`);
    }
    
    // Check if the association exists
    const association = await dbAsync.get(
      'SELECT * FROM ItemSize WHERE itemCategoryId = ? AND sizeId = ?',
      [categoryId, sizeId]
    );
    
    if (!association) {
      throw new NotFoundError(`Size ${sizeId} is not associated with Category ${categoryId}`);
    }
    
    // Check if any items are using this size in this category
    const inUse = await dbAsync.get(
      'SELECT id FROM ItemDetail WHERE itemCategoryId = ? AND sizeId = ? LIMIT 1',
      [categoryId, sizeId]
    );
    
    if (inUse) {
      return res.status(409).json({
        error: 'Size is in use',
        details: 'This size is being used by one or more items in this category and cannot be removed'
      });
    }
    
    // Remove the association
    await dbAsync.run(
      'DELETE FROM ItemSize WHERE itemCategoryId = ? AND sizeId = ?',
      [categoryId, sizeId]
    );
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};