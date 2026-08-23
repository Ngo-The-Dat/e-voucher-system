/**
 * =========================================================================================
 * FILE: zalopay-payment.controller.ts
 * VỊ TRÍ: backend/src/controllers/customer/
 * VAI TRÒ:
 *   - Tiếp nhận các yêu cầu HTTP liên quan đến cổng thanh toán ZaloPay Sandbox v2:
 *     1. `createPayment`: Khởi tạo phiên thanh toán ZaloPay.
 *     2. `captureOrder`: Xác thực và hoàn tất đơn hàng khi quay lại từ ZaloPay.
 *     3. `handleCallback`: Tiếp nhận Webhook Server-to-Server từ ZaloPay.
 *     4. `getStatus`: Tra cứu trạng thái đơn hàng.
 * =========================================================================================
 */

import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as zaloPayService from '../../services/customer/zalopay-payment.service.js';
import { sendHttpError } from '../../utils/http-error.js';

export async function createPayment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const customerId = req.user!.id;
    const { order_id, bank_code } = req.body || {};

    const result = await zaloPayService.createZaloPayOrder(
      customerId,
      Number(order_id),
      bank_code
    );

    res.status(200).json(result);
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function captureOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const customerId = req.user!.id;
    const { order_id, ...zaloPayParams } = req.body || {};

    let orderId = Number(order_id);
    if ((!orderId || isNaN(orderId)) && zaloPayParams.apptransid) {
      const parts = String(zaloPayParams.apptransid).split('_');
      if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
        orderId = Number(parts[1]);
      }
    }

    const result = await zaloPayService.verifyAndCaptureZaloPayOrder(
      customerId,
      orderId,
      zaloPayParams
    );

    res.status(200).json(result);
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function handleCallback(req: AuthRequest, res: Response): Promise<void> {
  try {
    const callbackBody = req.body || {};
    const result = await zaloPayService.processZaloPayCallback(callbackBody);
    res.status(200).json(result);
  } catch (error) {
    res.status(200).json({ return_code: 0, return_message: 'server error' });
  }
}

export async function getStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const orderId = Number(req.params.orderId);
    const result = await zaloPayService.getZaloPayStatus(orderId);
    res.status(200).json(result);
  } catch (error) {
    sendHttpError(res, error);
  }
}
