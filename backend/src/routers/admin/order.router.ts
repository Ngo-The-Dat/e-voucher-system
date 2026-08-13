import { Router } from 'express';
import * as orderController from '../../controllers/admin/order.controller.js';

const router = Router();

router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.post('/:id/cancel', orderController.cancelOrder);

export default router;
