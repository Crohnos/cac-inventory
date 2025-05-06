import { Request, Response, NextFunction } from 'express';
import { dbAsync } from '../database/connection.js';
import { getCurrentTimestamp } from '../database/setup.js';
import Papa from 'papaparse';
import fs from 'fs';
import { z } from 'zod';
import { generateUniqueQrValue } from '../utils/qrCode.js';

// Schema for validating import data
const ItemImportSchema = z.object({
  categoryName: z.string().min(1, { message: 'Category name is required' }),
  sizeName: z.string().optional(),
  condition: z.enum(['New', 'Gently Used', 'Heavily Used']).default('New'),
  location: z.enum(['McKinney', 'Plano']),
  receivedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Received date must be in YYYY-MM-DD format' }),
  donorInfo: z.string().optional(),
  approxPrice: z.union([z.string(), z.number()]).optional().transform(val => {
    if (typeof val === 'string' && val.trim() === '') return null;
    return typeof val === 'string' ? parseFloat(val) : val;
  }),
  isActive: z.union([
    z.boolean(),
    z.string().transform(val => {
      if (val.toLowerCase() === 'yes' || val.toLowerCase() === 'true' || val === '1') return true;
      if (val.toLowerCase() === 'no' || val.toLowerCase() === 'false' || val === '0') return false;
      return true; // Default to active
    })
  ]).default(true)
});

type ItemImport = z.infer<typeof ItemImportSchema>;

/**
 * Import inventory data from a CSV file
 */
export const importData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        details: 'Please upload a CSV file'
      });
    }
    
    // Parse the CSV file
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const { data, errors } = Papa.parse(fileContent, { 
      header: true,
      skipEmptyLines: true
    });
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'CSV parsing error',
        details: errors
      });
    }
    
    if (data.length === 0) {
      return res.status(400).json({ 
        error: 'Empty CSV file',
        details: 'The CSV file contains no data'
      });
    }
    
    // Process the imported data
    const results = {
      successCount: 0,
      errorCount: 0,
      errors: [] as string[]
    };
    
    const timestamp = getCurrentTimestamp();
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // +2 because of 0-indexing and header row
      
      try {
        // Validate the row data
        const validData = ItemImportSchema.parse(row);
        
        // Find or create the category
        let categoryId: number;
        const existingCategory = await dbAsync.get(
          'SELECT id FROM ItemCategory WHERE name = ?',
          [validData.categoryName]
        );
        
        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          // Create a new category
          const categoryResult = await dbAsync.run(
            'INSERT INTO ItemCategory (name, lowStockThreshold, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
            [validData.categoryName, 5, timestamp, timestamp]
          );
          categoryId = categoryResult.lastID!;
        }
        
        // Find or create the size if provided
        let sizeId: number | null = null;
        if (validData.sizeName) {
          const existingSize = await dbAsync.get(
            'SELECT id FROM Size WHERE name = ?',
            [validData.sizeName]
          );
          
          if (existingSize) {
            sizeId = existingSize.id;
          } else {
            // Create a new size
            const sizeResult = await dbAsync.run(
              'INSERT INTO Size (name, createdAt, updatedAt) VALUES (?, ?, ?)',
              [validData.sizeName, timestamp, timestamp]
            );
            sizeId = sizeResult.lastID!;
          }
          
          // Associate the size with the category if not already associated
          const existingAssociation = await dbAsync.get(
            'SELECT id FROM ItemSize WHERE itemCategoryId = ? AND sizeId = ?',
            [categoryId, sizeId]
          );
          
          if (!existingAssociation) {
            await dbAsync.run(
              'INSERT INTO ItemSize (itemCategoryId, sizeId, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
              [categoryId, sizeId, timestamp, timestamp]
            );
          }
        }
        
        // Generate a unique QR code value
        const qrCodeValue = await generateUniqueQrValue();
        
        // Create the item
        await dbAsync.run(
          `INSERT INTO ItemDetail (
            itemCategoryId, sizeId, condition, location, qrCodeValue, 
            receivedDate, donorInfo, approxPrice, isActive, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            categoryId,
            sizeId,
            validData.condition,
            validData.location,
            qrCodeValue,
            validData.receivedDate,
            validData.donorInfo || null,
            validData.approxPrice,
            validData.isActive ? 1 : 0,
            timestamp,
            timestamp
          ]
        );
        
        results.successCount++;
      } catch (error) {
        results.errorCount++;
        if (error instanceof z.ZodError) {
          const errorDetails = error.errors.map(e => 
            `[Row ${rowNum}] ${e.path.join('.')}: ${e.message}`
          );
          results.errors.push(...errorDetails);
        } else {
          results.errors.push(`[Row ${rowNum}] ${(error as Error).message}`);
        }
      }
    }
    
    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json(results);
  } catch (error) {
    // Clean up the uploaded file if it exists
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};