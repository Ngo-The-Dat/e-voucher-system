import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import * as cartController from '../../controllers/customer/cart.controller.js';

const router = Router();

// Tất cả các route giỏ hàng yêu cầu xác thực người dùng role CUSTOMER
router.use(authenticate, requireRole('CUSTOMER'));

router.get('/', cartController.getCart);
router.post('/', cartController.addToCart);
router.put('/:cartItemId', cartController.updateCartItem);
router.delete('/:cartItemId', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

export default router;
