import type { Request, Response } from 'express';
import * as catalogService from '../../services/customer/catalog.service.js';
import { sendHttpError } from '../../utils/http-error.js';

export async function getVouchers(req: Request, res: Response): Promise<void> {
  try {
    const result = await catalogService.getPublicVouchers(req.query);
    res.status(200).json(result);
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function getVoucherById(req: Request, res: Response): Promise<void> {
  try {
    const programId = Number(req.params.id);
    if (!programId || isNaN(programId)) {
      res.status(400).json({ message: 'Mã voucher không hợp lệ.' });
      return;
    }
    const voucher = await catalogService.getPublicVoucherById(programId);
    res.status(200).json(voucher);
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function getCategories(_req: Request, res: Response): Promise<void> {
  try {
    const categories = await catalogService.getPublicCategories();
    res.status(200).json({ categories });
  } catch (error) {
    sendHttpError(res, error);
  }
}
