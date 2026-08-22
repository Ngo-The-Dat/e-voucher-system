import type { Request, Response } from 'express';
import { sendHttpError } from '../../utils/http-error.js';
import { createVNPayPaymentUrl, processVNPayIpn, verifyVNPayReturn } from '../../services/customer/vnpay-payment.service.js';

export async function createVNPayPayment(req: Request, res: Response): Promise<void> {
  try {
    const customerId = Number((req as any).user?.id);
    const { orderId } = req.body;
    
    // Fallback if req.ip is undefined or format is weird. VNPay requires a valid IP.
    let ipAddr = req.headers['x-forwarded-for'] || 
                 req.socket.remoteAddress || 
                 '127.0.0.1';
                 
    if (Array.isArray(ipAddr)) {
      ipAddr = ipAddr[0];
    }
    
    // IPAddr shouldn't be ::1 for vnpay, must be IPv4 or IPv6 standard format without port.
    if (ipAddr === '::1') {
      ipAddr = '127.0.0.1';
    }

    const result = await createVNPayPaymentUrl(customerId, Number(orderId), ipAddr);
    res.status(200).json(result);
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function vnpayIpn(req: Request, res: Response): Promise<void> {
  try {
    const result = await processVNPayIpn(req.query);
    res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi khi xử lý VNPay IPN:', error);
    // VNPAY requires returning a valid format even if error
    res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
}

export async function vnpayReturn(req: Request, res: Response): Promise<void> {
  try {
    const result = await verifyVNPayReturn(req.query);
    res.status(200).json(result);
  } catch (error) {
    sendHttpError(res, error);
  }
}
