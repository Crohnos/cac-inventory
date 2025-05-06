import { Request, Response, NextFunction } from 'express';
import { dbAsync } from '../database/connection.js';
import { getCurrentTimestamp } from '../database/setup.js';
import { NotFoundError } from '../utils/errors.js';
import { Size, SizeInput, SizeUpdateInput } from '../models/sizeSchema.js';

/**
 * Get all sizes
 */
export const getAllSizes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sizes = await dbAsync.all('SELECT * FROM Size ORDER BY name');
    res.json(sizes);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new size
 */
export const createSize = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name }: SizeInput = req.body;
    const timestamp = getCurrentTimestamp();
    
    const result = await dbAsync.run(
      'INSERT INTO Size (name, createdAt, updatedAt) VALUES (?, ?, ?)',
      [name, timestamp, timestamp]
    );
    
    // Get the created size
    const size = await dbAsync.get('SELECT * FROM Size WHERE id = ?', [result.lastID]);
    res.status(201).json(size);
  } catch (error) {
    // Check for SQLITE_CONSTRAINT error (unique constraint violation)
    const sqliteError = error as any;
    if (sqliteError.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({
        error: 'Size already exists',
        details: 'A size with this name already exists'
      });
    }
    next(error);
  }
};

/**
 * Get a size by ID
 */
export const getSizeById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const size = await dbAsync.get('SELECT * FROM Size WHERE id = ?', [id]);
    
    if (!size) {
      throw new NotFoundError(`Size with ID ${id} not found`);
    }
    
    res.json(size);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a size
 */
export const updateSize = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name }: SizeUpdateInput = req.body;
    
    // Check if size exists
    const size = await dbAsync.get('SELECT * FROM Size WHERE id = ?', [id]);
    if (!size) {
      throw new NotFoundError(`Size with ID ${id} not found`);
    }
    
    const timestamp = getCurrentTimestamp();
    
    await dbAsync.run(
      'UPDATE Size SET name = ?, updatedAt = ? WHERE id = ?',
      [name, timestamp, id]
    );
    
    // Get the updated size
    const updatedSize = await dbAsync.get('SELECT * FROM Size WHERE id = ?', [id]);
    res.json(updatedSize);
  } catch (error) {
    // Check for SQLITE_CONSTRAINT error (unique constraint violation)
    const sqliteError = error as any;
    if (sqliteError.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({
        error: 'Size already exists',
        details: 'A size with this name already exists'
      });
    }
    next(error);
  }
};

/**
 * Delete a size
 */
export const deleteSize = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    
    // Check if size exists
    const size = await dbAsync.get('SELECT * FROM Size WHERE id = ?', [id]);
    if (!size) {
      throw new NotFoundError(`Size with ID ${id} not found`);
    }
    
    // Check if size is being used in any item
    const inUse = await dbAsync.get('SELECT id FROM ItemSize WHERE sizeId = ? LIMIT 1', [id]);
    if (inUse) {
      return res.status(409).json({
        error: 'Size is in use',
        details: 'This size is associated with one or more item categories and cannot be deleted'
      });
    }
    
    await dbAsync.run('DELETE FROM Size WHERE id = ?', [id]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};