import { Request, Response } from 'express';
import { ItemService, CreateItemData } from '../services/itemService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export class ItemController {
  static getAllItems = asyncHandler(async (req: Request, res: Response) => {
    // Use validatedQuery if available (when validation middleware was used), otherwise fallback to req.query
    const query = (req as any).validatedQuery || req.query;
    const locationId = query.location_id ? parseInt(query.location_id as string) : null;
    
    let items;
    if (locationId) {
      if (isNaN(locationId)) {
        return res.status(400).json({
          error: {
            message: 'Invalid location_id - must be a number'
          }
        });
      }
      items = ItemService.getItemsByLocation(locationId);
    } else {
      items = ItemService.getAllItems();
    }
    
    res.json({
      success: true,
      data: items,
      count: items.length,
      location_id: locationId
    });
  });

  static getItemById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        error: {
          message: 'Invalid item ID - must be a number'
        }
      });
    }

    const item = ItemService.getById(id);
    
    if (!item) {
      return res.status(404).json({
        error: {
          message: `Item with ID ${id} not found`
        }
      });
    }

    res.json({
      success: true,
      data: item
    });
  });

  static getItemByQrCode = asyncHandler(async (req: Request, res: Response) => {
    const qrCode = req.params.qrCode;
    
    if (!qrCode || qrCode.trim().length === 0) {
      return res.status(400).json({
        error: {
          message: 'QR code is required'
        }
      });
    }

    const item = ItemService.getByQrCode(qrCode);
    
    if (!item) {
      return res.status(404).json({
        error: {
          message: `Item with QR code '${qrCode}' not found`
        }
      });
    }

    res.json({
      success: true,
      data: item
    });
  });

  static getItemSizes = asyncHandler(async (req: Request, res: Response) => {
    const itemId = parseInt(req.params.itemId);
    // Use validatedQuery if available (when validation middleware was used), otherwise fallback to req.query
    const query = (req as any).validatedQuery || req.query;
    const locationId = query.location_id ? parseInt(query.location_id as string) : null;
    
    if (isNaN(itemId)) {
      return res.status(400).json({
        error: {
          message: 'Invalid item ID - must be a number'
        }
      });
    }

    // Check if item exists
    const item = ItemService.getById(itemId);
    if (!item) {
      return res.status(404).json({
        error: {
          message: `Item with ID ${itemId} not found`
        }
      });
    }

    let sizes;
    if (locationId) {
      if (isNaN(locationId)) {
        return res.status(400).json({
          error: {
            message: 'Invalid location_id - must be a number'
          }
        });
      }
      sizes = ItemService.getItemSizesByLocation(itemId, locationId);
    } else {
      sizes = ItemService.getItemSizes(itemId);
    }

    res.json({
      success: true,
      data: sizes,
      count: sizes.length,
      item_id: itemId,
      location_id: locationId
    });
  });

  static createItem = asyncHandler(async (req: Request, res: Response) => {
    const data: CreateItemData = req.body;
    
    const item = ItemService.create(data);
    
    res.status(201).json({
      success: true,
      data: item,
      message: 'Item created successfully'
    });
  });

  static updateQuantity = asyncHandler(async (req: Request, res: Response) => {
    const sizeId = parseInt(req.params.sizeId);
    const { quantity } = req.body;
    
    if (isNaN(sizeId)) {
      return res.status(400).json({
        error: {
          message: 'Invalid size ID - must be a number'
        }
      });
    }

    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({
        error: {
          message: 'Quantity must be a non-negative number'
        }
      });
    }

    const updatedSize = ItemService.updateQuantity(sizeId, quantity);
    
    res.json({
      success: true,
      data: updatedSize,
      message: 'Quantity updated successfully'
    });
  });

  static adjustQuantity = asyncHandler(async (req: Request, res: Response) => {
    const sizeId = parseInt(req.params.sizeId);
    const { adjustment, admin_name, reason } = req.body;
    
    if (isNaN(sizeId)) {
      return res.status(400).json({
        error: {
          message: 'Invalid size ID - must be a number'
        }
      });
    }

    if (typeof adjustment !== 'number') {
      return res.status(400).json({
        error: {
          message: 'Adjustment must be a number (positive to add, negative to subtract)'
        }
      });
    }

    const updatedSize = ItemService.adjustQuantity(
      sizeId, 
      adjustment, 
      admin_name || 'Unknown Admin', 
      reason || 'Manual inventory correction'
    );
    
    res.json({
      success: true,
      data: updatedSize,
      message: `Manual adjustment completed: ${adjustment >= 0 ? 'added' : 'removed'} ${Math.abs(adjustment)} item(s)`
    });
  });
}