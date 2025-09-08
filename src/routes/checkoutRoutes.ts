import { Router } from 'express';
import { CheckoutController } from '../controllers/checkoutController.js';

const router = Router();

router.post('/', CheckoutController.createCheckout);
router.get('/', CheckoutController.getCheckouts);
router.get('/:id', CheckoutController.getCheckoutById);

export { router as checkoutRoutes };