/**
 * =========================================================================================
 * FILE: order.router.ts (Admin)
 * VỊ TRÍ: backend/src/routers/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Định tuyến (Routing Layer) cho phân hệ Quản lý & Tra cứu Đơn hàng Toàn Sàn (Order Management).
 *   - Nghiệp vụ liên quan: UC-ADM-04 (Quản lý đơn hàng), UC-ADM-09 (Tra cứu đơn hàng).
 *   - Các chức năng chính:
 *       1. Danh sách đơn hàng toàn sàn (lọc trạng thái đơn, trạng thái thanh toán, khoảng ngày, người mua/người nhận).
 *       2. Xem chi tiết đơn hàng (thông tin người mua, người nhận quà tặng, danh sách mã voucher phát hành).
 *       3. Hủy đơn hàng và xử lý hoàn trả trạng thái.
 * =========================================================================================
 */

import { Router } from 'express';
import * as orderController from '../../controllers/admin/order.controller.js';

const router = Router();

// ─── 1. Tra cứu & Chi tiết Đơn hàng ────────────────────────────────────────────────
// GET /api/admin/orders: Lấy danh sách đơn hàng toàn sàn có phân trang và bộ lọc nâng cao
router.get('/', orderController.getOrders);

// GET /api/admin/orders/:id: Lấy chi tiết đơn hàng theo ID (kèm chi tiết các voucher code đã cấp)
router.get('/:id', orderController.getOrderById);

// ─── 2. Thao tác Quản trị Đơn hàng ─────────────────────────────────────────────────
// POST /api/admin/orders/:id/cancel: Admin thực hiện hủy đơn hàng kèm lý do
router.post('/:id/cancel', orderController.cancelOrder);

export default router;

