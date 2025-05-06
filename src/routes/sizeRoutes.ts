import { Router } from 'express';
import { 
  getAllSizes, 
  createSize, 
  getSizeById, 
  updateSize, 
  deleteSize 
} from '../controllers/sizeController.js';
import { validate } from '../middleware/validationMiddleware.js';
import { SizeSchema, SizeUpdateSchema } from '../models/sizeSchema.js';

const router = Router();

// GET all sizes
router.get('/', getAllSizes);

// POST new size
router.post('/', validate(SizeSchema), createSize);

// GET a single size by ID
router.get('/:id', getSizeById);

// PUT update a size
router.put('/:id', validate(SizeUpdateSchema), updateSize);

// DELETE a size
router.delete('/:id', deleteSize);

export default router;