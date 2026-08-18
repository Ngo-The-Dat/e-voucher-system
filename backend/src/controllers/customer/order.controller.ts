import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as orderService from '../../services/customer/order.service.js';
import { sendHttpError } from '../../utils/http-error.js';

export async function createOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const customerId = req.user!.id;
    const result = await orderService.createCustomerOrder(customerId, req.body);
    res.status(201).json(result);
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function payOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const customerId = req.user!.id;
    const orderId = Number(req.params.orderId);
    if (!orderId) {
      res.status(400).json({ message: 'Mã đơn hàng không hợp lệ.' });
      return;
    }
    const { payment_method } = req.body || {};
    const result = await orderService.payCustomerOrder(customerId, orderId, payment_method);
    res.status(200).json(result);
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function getOrders(req: AuthRequest, res: Response): Promise<void> {
  try {
    const customerId = req.user!.id;
    const result = await orderService.getCustomerOrders(customerId, req.query);
    res.status(200).json(result);
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function getOrderById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const customerId = req.user!.id;
    const orderId = Number(req.params.orderId);
    if (!orderId) {
      res.status(400).json({ message: 'Mã đơn hàng không hợp lệ.' });
      return;
    }
    const result = await orderService.getCustomerOrderById(customerId, orderId);
    res.status(200).json(result);
  } catch (error) {
    sendHttpError(res, error);
  }
}
