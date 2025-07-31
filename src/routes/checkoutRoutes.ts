import { Router } from 'express';
import { 
  createCheckout,
  getAllCheckouts,
  getCheckoutById
} from '../controllers/checkoutController.js';
import { validate } from '../middleware/validationMiddleware.js';
import { CheckoutSchema } from '../models/checkoutSchema.js';

const router = Router();

// GET all checkout records with optional filters
router.get('/', getAllCheckouts);

// POST new checkout record
router.post('/', validate(CheckoutSchema), createCheckout);

// GET checkout record by ID
router.get('/:id', getCheckoutById);

export default router;