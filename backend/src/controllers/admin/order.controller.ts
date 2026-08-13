import { type Response, type NextFunction } from 'express';
import { type AuthRequest } from '../../middlewares/auth.middleware.js';
import * as orderService from '../../services/admin/order.service.js';

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
