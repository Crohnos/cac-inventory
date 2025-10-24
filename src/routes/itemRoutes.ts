import { Router, Request, Response } from 'express';
import { ItemService, CreateItemData } from '../services/itemService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.js';
import {
  createItemSchema,
  updateQuantitySchema,
  adjustQuantitySchema,
  itemParamsSchema,
  sizeParamsSchema,
  itemSizeParamsSchema,
  qrCodeParamsSchema,
  itemQuerySchema
} from '../schemas/itemSchemas.js';

const router = Router();

// GET /api/items - Get all items (optionally filtered by location)
router.get('/',
  validateQuery(itemQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    // Use validatedQuery if available (when validation middleware was used), otherwise fallback to req.query
    const query = (req as any).validatedQuery || req.query;
    const locationId = query.location_id ? parseInt(query.location_id as string) : null;

    let items;
    if (locationId) {
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
  })
);

// GET /api/items/:id - Get item by ID
router.get('/:id',
  validateParams(itemParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
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
  })
);

// GET /api/items/qr/:qrCode - Get item by QR code
router.get('/qr/:qrCode',
  validateParams(qrCodeParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const qrCode = req.params.qrCode;
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
  })
);

// GET /api/items/:itemId/sizes - Get sizes for an item (optionally filtered by location)
router.get('/:itemId/sizes',
  validateParams(itemSizeParamsSchema),
  validateQuery(itemQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const itemId = parseInt(req.params.itemId);
    // Use validatedQuery if available (when validation middleware was used), otherwise fallback to req.query
    const query = (req as any).validatedQuery || req.query;
    const locationId = query.location_id ? parseInt(query.location_id as string) : null;

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
  })
);

// POST /api/items - Create new item
router.post('/',
  validateBody(createItemSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data: CreateItemData = req.body;

    const item = ItemService.create(data);

    res.status(201).json({
      success: true,
      data: item,
      message: 'Item created successfully'
    });
  })
);

// PUT /api/item-sizes/:sizeId/quantity - Update quantity for a specific size
router.put('/sizes/:sizeId/quantity',
  validateParams(sizeParamsSchema),
  validateBody(updateQuantitySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sizeId = parseInt(req.params.sizeId);
    const { quantity } = req.body;

    const updatedSize = ItemService.updateQuantity(sizeId, quantity);

    res.json({
      success: true,
      data: updatedSize,
      message: 'Quantity updated successfully'
    });
  })
);

// PATCH /api/item-sizes/:sizeId/adjust - Adjust quantity for a specific size
router.patch('/sizes/:sizeId/adjust',
  validateParams(sizeParamsSchema),
  validateBody(adjustQuantitySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sizeId = parseInt(req.params.sizeId);
    const { adjustment, admin_name, reason } = req.body;

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
  })
);

export { router as itemRoutes };
