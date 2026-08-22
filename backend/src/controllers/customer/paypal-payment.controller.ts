/**
 * =========================================================================================
 * FILE: paypal-payment.controller.ts
 * VỊ TRÍ: backend/src/controllers/customer/
 * VAI TRÒ:
 *   - Controller xử lý các yêu cầu HTTP liên quan đến cổng thanh toán PayPal.
 * =========================================================================================
 */

import type { Request, Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as paypalService from '../../services/customer/paypal-payment.service.js';
import { sendHttpError } from '../../utils/http-error.js';

/**
 * 2. Khởi tạo thanh toán PayPal
 */
export async function createOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const customerId = req.user!.id;
    const orderId = Number(req.body?.order_id);
    const result = await paypalService.createPayPalOrder(customerId, orderId);
    res.status(201).json(result);
  } catch (error) {
    sendHttpError(res, error);
  }
}

/**
 * 3. Hoàn tất (Capture) thanh toán PayPal
 */
export async function captureOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const customerId = req.user!.id;
    const { order_id, paypal_order_id, payer_info } = req.body || {};
    const orderId = Number(order_id);
    const result = await paypalService.capturePayPalOrder(customerId, orderId, paypal_order_id, payer_info);
    res.status(200).json(result);
  } catch (error) {
    sendHttpError(res, error);
  }
}

/**
 * 4. Mô phỏng các kịch bản kiểm thử PayPal (Simulate)
 */
export async function simulate(req: AuthRequest, res: Response): Promise<void> {
  try {
    const customerId = req.user!.id;
    const { order_id, scenario, paypal_order_id, payer_info } = req.body || {};
    const orderId = Number(order_id);
    const result = await paypalService.simulatePayPalScenario(
      customerId,
      orderId,
      scenario,
      paypal_order_id,
      payer_info
    );
    res.status(200).json(result);
  } catch (error) {
    sendHttpError(res, error);
  }
}

/**
 * 5. Tra cứu trạng thái thanh toán PayPal của đơn hàng
 */
export async function getStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const customerId = req.user!.id;
    const orderId = Number(req.params.orderId);
    const result = await paypalService.getPayPalStatus(customerId, orderId);
    res.status(200).json(result);
  } catch (error) {
    sendHttpError(res, error);
  }
}
