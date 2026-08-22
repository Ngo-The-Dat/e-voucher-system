/**
 * =========================================================================================
 * FILE: momo-payment.controller.ts
 * VỊ TRÍ: backend/src/controllers/customer/
 * VAI TRÒ:
 *   - Controller tiếp nhận và xử lý các yêu cầu HTTP liên quan đến cổng thanh toán MoMo Sandbox:
 *     1. POST /create-payment -> Khởi tạo phiên thanh toán MoMo (All-in-One Collection Link).
 *     2. POST /ipn -> Tiếp nhận Webhook IPN từ máy chủ MoMo.
 *     3. POST /capture-order -> Xác thực và hoàn tất giao dịch khi chuyển hướng về web.
 *     4. GET /order/:orderId/status -> Tra cứu trạng thái đơn hàng MoMo.
 * =========================================================================================
 */

import type { Request, Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as momoService from '../../services/customer/momo-payment.service.js';
import { sendHttpError } from '../../utils/http-error.js';

/**
 * 1. Khởi tạo phiên thanh toán MoMo Sandbox
 * Endpoint: POST /api/customer/payments/momo/create-payment
 */
export async function createPaymentSession(req: AuthRequest, res: Response): Promise<void> {
  try {
    const customerId = req.user!.id;
    const orderId = Number(req.body?.order_id);
    const requestType = req.body?.request_type || 'payWithATM';
    const result = await momoService.createMoMoPaymentSession(customerId, orderId, requestType);
    res.status(201).json(result);
  } catch (error) {
    sendHttpError(res, error);
  }
}

/**
 * 2. Tiếp nhận Webhook IPN từ MoMo Gateway (Server-to-Server)
 * Endpoint: POST /api/customer/payments/momo/ipn
 */
export async function handleIpn(req: Request, res: Response): Promise<void> {
  try {
    const ipnPayload = req.body;
    const result = await momoService.processMoMoIpn(ipnPayload);
    // MoMo yêu cầu phản hồi HTTP 204 No Content hoặc 200 JSON khi nhận IPN thành công
    res.status(200).json(result);
  } catch (error: any) {
    console.error('[MoMo Controller IPN Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi xử lý IPN MoMo' });
  }
}

/**
 * 3. Xác thực và Capture đơn hàng MoMo khi người dùng quay lại từ Redirect URL
 * Endpoint: POST /api/customer/payments/momo/capture-order
 */
export async function captureOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const customerId = req.user!.id;
    const { order_id, ...momoParams } = req.body || {};
    const orderId = Number(order_id);
    const result = await momoService.verifyAndCaptureMoMoOrder(customerId, orderId, momoParams);
    res.status(200).json(result);
  } catch (error) {
    sendHttpError(res, error);
  }
}

/**
 * 4. Tra cứu trạng thái thanh toán MoMo của đơn hàng
 * Endpoint: GET /api/customer/payments/momo/order/:orderId/status
 */
export async function getStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const customerId = req.user!.id;
    const orderId = Number(req.params.orderId);
    const result = await momoService.getMoMoStatus(customerId, orderId);
    res.status(200).json(result);
  } catch (error) {
    sendHttpError(res, error);
  }
}
