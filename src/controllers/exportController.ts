import { Request, Response, NextFunction } from 'express';
import { dbAsync } from '../database/connection.js';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Export inventory data in various formats
 */
export const exportData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { format } = req.query;
    
    if (!format || !['csv', 'xlsx', 'txt'].includes(format as string)) {
      return res.status(400).json({ 
        error: 'Invalid format', 
        details: 'Format must be one of: csv, xlsx, txt' 
      });
    }
    
    // Fetch categories with items
    const categories = await dbAsync.all(`
      SELECT * FROM ItemCategory ORDER BY name
    `);
    
    // Fetch items with category and size names
    const items = await dbAsync.all(`
      SELECT 
        d.*,
        c.name as categoryName,
        s.name as sizeName
      FROM ItemDetail d
      LEFT JOIN ItemCategory c ON d.itemCategoryId = c.id
      LEFT JOIN Size s ON d.sizeId = s.id
      ORDER BY d.itemCategoryId, d.receivedDate DESC
    `);
    
    // Prepare data for export
    const exportData = items.map(item => ({
      itemId: item.id,
      categoryId: item.itemCategoryId,
      categoryName: item.categoryName,
      sizeName: item.sizeName || 'None',
      condition: item.condition,
      location: item.location,
      receivedDate: item.receivedDate,
      donorInfo: item.donorInfo || '',
      approxPrice: item.approxPrice !== null ? item.approxPrice : '',
      isActive: item.isActive ? 'Yes' : 'No'
    }));
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `inventory-export-${timestamp}`;
    
    // Handle export based on format
    switch (format) {
      case 'csv':
        // Generate CSV
        const csv = Papa.unparse(exportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        return res.send(csv);
        
      case 'xlsx':
        // Generate Excel file
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
        
        // Add categories sheet
        const categoriesWorksheet = XLSX.utils.json_to_sheet(categories);
        XLSX.utils.book_append_sheet(workbook, categoriesWorksheet, 'Categories');
        
        // Generate Excel buffer
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
        return res.send(excelBuffer);
        
      case 'txt':
        // Generate a tab-delimited text file
        const header = Object.keys(exportData[0]).join('\t');
        const rows = exportData.map(row => Object.values(row).join('\t'));
        const txt = [header, ...rows].join('\n');
        
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.txt"`);
        return res.send(txt);
        
      default:
        return res.status(400).json({ error: 'Invalid format' });
    }
  } catch (error) {
    next(error);
  }
};