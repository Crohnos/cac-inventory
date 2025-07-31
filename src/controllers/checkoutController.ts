import { Request, Response, NextFunction } from 'express';
import { dbAsync } from '../database/connection.js';
import { getCurrentTimestamp } from '../database/setup.js';
import { NotFoundError } from '../utils/errors.js';
import { CheckoutInput } from '../models/checkoutSchema.js';

/**
 * Create a new checkout record
 */
export const createCheckout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const checkoutData: CheckoutInput = req.body;
    
    // Verify the category exists
    const category = await dbAsync.get(
      'SELECT * FROM ItemCategory WHERE id = ?',
      [checkoutData.itemCategoryId]
    );
    
    if (!category) {
      throw new NotFoundError(`Category with ID ${checkoutData.itemCategoryId} not found`);
    }
    
    const timestamp = getCurrentTimestamp();
    
    // Convert allegations array to JSON string for storage
    const allegationsJson = JSON.stringify(checkoutData.allegations);
    
    // Insert the checkout record
    const result = await dbAsync.run(`
      INSERT INTO RainbowRoomCheckout (
        checkoutDate, location, workerFirstName, workerLastName, department,
        caseNumber, allegations, parentGuardianFirstName, parentGuardianLastName,
        zipCode, allegedPerpetratorFirstName, allegedPerpetratorLastName,
        numberOfChildren, itemCategoryId, itemsRemovedCount, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      checkoutData.checkoutDate,
      checkoutData.location,
      checkoutData.workerFirstName,
      checkoutData.workerLastName,
      checkoutData.department,
      checkoutData.caseNumber,
      allegationsJson,
      checkoutData.parentGuardianFirstName || null,
      checkoutData.parentGuardianLastName || null,
      checkoutData.zipCode || null,
      checkoutData.allegedPerpetratorFirstName || null,
      checkoutData.allegedPerpetratorLastName || null,
      checkoutData.numberOfChildren,
      checkoutData.itemCategoryId,
      checkoutData.itemsRemovedCount,
      timestamp,
      timestamp
    ]);
    
    // Get the created checkout record with category info
    const createdCheckout = await dbAsync.get(`
      SELECT 
        c.*,
        cat.name as categoryName
      FROM RainbowRoomCheckout c
      LEFT JOIN ItemCategory cat ON c.itemCategoryId = cat.id
      WHERE c.id = ?
    `, [result.lastID]);
    
    // Parse allegations back to array for response
    if (createdCheckout) {
      createdCheckout.allegations = JSON.parse(createdCheckout.allegations);
    }
    
    res.status(201).json({
      success: true,
      message: 'Checkout record created successfully',
      checkout: createdCheckout
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all checkout records with optional filtering
 */
export const getAllCheckouts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { 
      startDate, 
      endDate, 
      location, 
      department,
      categoryId 
    } = req.query;
    
    let sql = `
      SELECT 
        c.*,
        cat.name as categoryName
      FROM RainbowRoomCheckout c
      LEFT JOIN ItemCategory cat ON c.itemCategoryId = cat.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    // Add filters if provided
    if (startDate) {
      sql += ' AND c.checkoutDate >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ' AND c.checkoutDate <= ?';
      params.push(endDate);
    }
    
    if (location) {
      sql += ' AND c.location = ?';
      params.push(location);
    }
    
    if (department) {
      sql += ' AND c.department = ?';
      params.push(department);
    }
    
    if (categoryId) {
      sql += ' AND c.itemCategoryId = ?';
      params.push(categoryId);
    }
    
    sql += ' ORDER BY c.createdAt DESC';
    
    const checkouts = await dbAsync.all(sql, params);
    
    // Parse allegations for all records
    const parsedCheckouts = checkouts.map(checkout => ({
      ...checkout,
      allegations: JSON.parse(checkout.allegations)
    }));
    
    res.json(parsedCheckouts);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single checkout record by ID
 */
export const getCheckoutById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    
    const checkout = await dbAsync.get(`
      SELECT 
        c.*,
        cat.name as categoryName
      FROM RainbowRoomCheckout c
      LEFT JOIN ItemCategory cat ON c.itemCategoryId = cat.id
      WHERE c.id = ?
    `, [id]);
    
    if (!checkout) {
      throw new NotFoundError(`Checkout record with ID ${id} not found`);
    }
    
    // Parse allegations back to array
    checkout.allegations = JSON.parse(checkout.allegations);
    
    res.json(checkout);
  } catch (error) {
    next(error);
  }
};