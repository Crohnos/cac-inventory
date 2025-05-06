import { Router } from 'express';
import { 
  getAllDetails, 
  createDetail, 
  getDetailById, 
  getDetailByQrCode,
  updateDetail, 
  deactivateDetail,
  transferDetail
} from '../controllers/detailController.js';
import { validate } from '../middleware/validationMiddleware.js';
import { 
  ItemDetailSchema, 
  ItemDetailUpdateSchema,
  ItemTransferSchema
} from '../models/itemDetailSchema.js';

const router = Router();

// GET all item details with optional filters
router.get('/', getAllDetails);

// POST new item detail
router.post('/', validate(ItemDetailSchema), createDetail);

// GET item detail by QR code
router.get('/qr/:qrCodeValue', getDetailByQrCode);

// GET item detail by ID
router.get('/:id', getDetailById);

// PUT update item detail
router.put('/:id', validate(ItemDetailUpdateSchema), updateDetail);

// PATCH deactivate item detail
router.patch('/:id/deactivate', deactivateDetail);

// PATCH transfer item to new location
router.patch('/:id/transfer', validate(ItemTransferSchema), transferDetail);

export default router;