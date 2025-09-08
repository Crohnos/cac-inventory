import { Router } from 'express';
import { ItemController } from '../controllers/itemController.js';
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
  ItemController.getAllItems
);

// GET /api/items/:id - Get item by ID
router.get('/:id', 
  validateParams(itemParamsSchema), 
  ItemController.getItemById
);

// GET /api/items/qr/:qrCode - Get item by QR code
router.get('/qr/:qrCode', 
  validateParams(qrCodeParamsSchema), 
  ItemController.getItemByQrCode
);

// GET /api/items/:itemId/sizes - Get sizes for an item (optionally filtered by location)
router.get('/:itemId/sizes',
  validateParams(itemSizeParamsSchema),
  validateQuery(itemQuerySchema),
  ItemController.getItemSizes
);

// POST /api/items - Create new item
router.post('/', 
  validateBody(createItemSchema), 
  ItemController.createItem
);

// PUT /api/item-sizes/:sizeId/quantity - Update quantity for a specific size
router.put('/sizes/:sizeId/quantity',
  validateParams(sizeParamsSchema),
  validateBody(updateQuantitySchema),
  ItemController.updateQuantity
);

// PATCH /api/item-sizes/:sizeId/adjust - Adjust quantity for a specific size
router.patch('/sizes/:sizeId/adjust',
  validateParams(sizeParamsSchema),
  validateBody(adjustQuantitySchema),
  ItemController.adjustQuantity
);

export { router as itemRoutes };