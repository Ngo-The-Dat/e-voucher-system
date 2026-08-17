/**
 * =========================================================================================
 * FILE: order.controller.ts
 * VỊ TRÍ: backend/src/controllers/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Tầng Điều khiển (Controller Layer) tiếp nhận và điều phối các yêu cầu HTTP liên quan đến Đơn hàng.
 *   - Các Endpoint chính:
 *       1. GET /api/admin/orders: Lấy danh sách đơn hàng có phân trang, bộ lọc và thống kê trạng thái.
 *       2. GET /api/admin/orders/:id: Lấy chi tiết đơn hàng (người mua, người nhận, voucher phát hành, QR code).
 *       3. POST /api/admin/orders/:id/cancel: Quản trị viên hủy đơn hàng và hoàn tiền (kèm lý do).
 * =========================================================================================
 */

import { type Response, type NextFunction } from 'express';
import { type AuthRequest } from '../../middlewares/auth.middleware.js';
import * as orderService from '../../services/admin/order.service.js';

/**
 * GET /api/admin/orders
 * Lấy danh sách đơn hàng toàn sàn (hỗ trợ lọc theo từ khóa, trạng thái đơn, trạng thái thanh toán, khoảng ngày)
 */
export async function getOrders(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, order_status, payment_status, start_date, end_date, page, limit } = req.query;
    const result = await orderService.getOrders({
      search: search as string,
      orderStatus: order_status as string,
      paymentStatus: payment_status as string,
      startDate: start_date as string,
      endDate: end_date as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/orders/:id
 * Lấy chi tiết 1 đơn hàng theo ID
 */
export async function getOrderById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      res.status(400).json({ message: 'Mã đơn hàng không hợp lệ.' });
      return;
    }

    const order = await orderService.getOrderById(orderId);
    res.json(order);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}

/**
 * POST /api/admin/orders/:id/cancel
 * Hủy đơn hàng và hoàn tiền (Yêu cầu nhập lý do hủy)
 */
export async function cancelOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const orderId = Number(req.params.id);
    const adminId = req.user?.id || 1;
    const { reason } = req.body;

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      res.status(400).json({ message: 'Mã đơn hàng không hợp lệ.' });
      return;
    }

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      res.status(400).json({ message: 'Vui lòng nhập lý do hủy đơn hàng.' });
      return;
    }

    const result = await orderService.cancelOrder(orderId, adminId, reason);
    res.json(result);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}
