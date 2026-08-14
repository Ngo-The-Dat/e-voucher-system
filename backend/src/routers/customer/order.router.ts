import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import * as orderController from '../../controllers/customer/order.controller.js';

const router = Router();

// Tất cả các route đơn hàng và voucher của khách hàng yêu cầu xác thực role CUSTOMER
router.use(authenticate, requireRole('CUSTOMER'));

router.post('/', orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/vouchers', orderController.getMyVouchers);
router.get('/vouchers/:id', orderController.getMyVoucherById);
router.get('/:orderId', orderController.getOrderById);

export default router;
