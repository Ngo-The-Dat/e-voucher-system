/**
 * =========================================================================================
 * FILE: stripe-payment.controller.ts
 * VỊ TRÍ: backend/src/controllers/customer/
 * VAI TRÒ:
 *   - Controller tiếp nhận và xử lý các yêu cầu HTTP liên quan đến cổng thanh toán Stripe:
 *     1. POST /create-checkout-session -> Khởi tạo phiên thanh toán Stripe
 *     2. POST /capture-order -> Xác thực và hoàn tất giao dịch
 *     3. GET /order/:orderId/status -> Tra cứu trạng thái đơn hàng Stripe
 * =========================================================================================
 */

import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as stripeService from '../../services/customer/stripe-payment.service.js';
import { sendHttpError } from '../../utils/http-error.js';

/**
 * 1. Khởi tạo Stripe Checkout Session
 * Endpoint: POST /api/customer/payments/stripe/create-checkout-session
 */
export async function createCheckoutSession(req: AuthRequest, res: Response): Promise<void> {
  try {
    const customerId = req.user!.id;
    const orderId = Number(req.body?.order_id);
    const result = await stripeService.createStripeCheckoutSession(customerId, orderId);
    res.status(201).json(result);
  } catch (error) {
    sendHttpError(res, error);
  }
}

/**
 * 2. Xác thực và Capture đơn hàng Stripe sau khi thanh toán
 * Endpoint: POST /api/customer/payments/stripe/capture-order
 */
export async function captureOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const customerId = req.user!.id;
    const { order_id, session_id } = req.body || {};
    const orderId = Number(order_id);
    const result = await stripeService.verifyAndCaptureStripeOrder(customerId, orderId, session_id);
    res.status(200).json(result);
  } catch (error) {
    sendHttpError(res, error);
  }
}

/**
 * 3. Tra cứu trạng thái đơn hàng Stripe
 * Endpoint: GET /api/customer/payments/stripe/order/:orderId/status
 */
export async function getStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const customerId = req.user!.id;
    const orderId = Number(req.params.orderId);
    const result = await stripeService.getStripeStatus(customerId, orderId);
    res.status(200).json(result);
  } catch (error) {
    sendHttpError(res, error);
  }
}
