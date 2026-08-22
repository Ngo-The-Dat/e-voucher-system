import type { Request, Response } from 'express';
import { sendHttpError } from '../../utils/http-error.js';

export interface PaymentMethodItem {
  code: string;
  name: string;
  description: string;
  currency: string;
  is_active: boolean;
}

function getAvailablePaymentMethods(): PaymentMethodItem[] {
  return [
    {
      code: 'VNPAY',
      name: 'Cổng thanh toán VNPay',
      description: 'Quét mã QR VNPay / Thẻ ATM nội địa',
      currency: 'VND',
      is_active: true,
    },
    {
      code: 'ZALOPAY',
      name: 'Ví điện tử ZaloPay',
      description: 'Thanh toán quét mã QR ZaloPay / Thẻ ATM nội địa',
      currency: 'VND',
      is_active: true,
    },
    {
      code: 'STRIPE',
      name: 'Thẻ Visa / Mastercard (Stripe)',
      description: 'Thanh toán thẻ tín dụng / ghi nợ quốc tế qua Stripe',
      currency: 'VND',
      is_active: true,
    },
    {
      code: 'PAYPAL',
      name: 'Ví điện tử PayPal (USD)',
      description: 'Thanh toán quốc tế bảo mật qua cổng PayPal',
      currency: 'USD',
      is_active: true,
    },
  ];
}

export async function getPaymentMethods(_req: Request, res: Response): Promise<void> {
  try {
    res.status(200).json({
      success: true,
      payment_methods: getAvailablePaymentMethods(),
    });
  } catch (error) {
    sendHttpError(res, error);
  }
}
