import type { Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as customerVoucherService from '../../services/customer/voucher.service.js';
import { sendHttpError } from '../../utils/http-error.js';

export async function getMyVouchers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const customerId = req.user!.id;
    const statusFilter = req.query.status as string | undefined;
    const vouchers = await customerVoucherService.getCustomerVouchers(customerId, statusFilter);
    res.status(200).json({ vouchers });
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function getMyVoucherById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const customerId = req.user!.id;
    const voucherId = Number(req.params.id);
    if (!voucherId) {
      res.status(400).json({ message: 'Mã voucher không hợp lệ.' });
      return;
    }
    const voucher = await customerVoucherService.getCustomerVoucherById(customerId, voucherId);
    res.status(200).json(voucher);
  } catch (error) {
    sendHttpError(res, error);
  }
}
