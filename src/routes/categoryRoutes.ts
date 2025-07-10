import { Router } from 'express';
import { 
  getAllCategories, 
  createCategory, 
  getCategoryById, 
  getCategoryByQrCode,
  updateCategory, 
  deleteCategory,
  getCategorySizes,
  addSizeToCategory,
  removeSizeFromCategory
} from '../controllers/categoryController.js';
import { validate } from '../middleware/validationMiddleware.js';
import { 
  ItemCategorySchema, 
  ItemCategoryUpdateSchema,
  CategorySizeSchema 
} from '../models/itemCategorySchema.js';

const router = Router();

// GET all categories
router.get('/', getAllCategories);

// POST new category
router.post('/', validate(ItemCategorySchema), createCategory);

// GET category by QR code
router.get('/qr/:qrCodeValue', getCategoryByQrCode);

// GET a single category by ID
router.get('/:id', getCategoryById);

// PUT update a category
router.put('/:id', validate(ItemCategoryUpdateSchema), updateCategory);

// DELETE a category
router.delete('/:id', deleteCategory);

// GET all sizes for a category
router.get('/:id/sizes', getCategorySizes);

// POST add a size to a category
router.post('/:id/sizes', validate(CategorySizeSchema), addSizeToCategory);

// DELETE remove a size from a category
router.delete('/:categoryId/sizes/:sizeId', removeSizeFromCategory);

export default router;