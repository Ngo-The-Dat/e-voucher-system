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

export async function getBanners(req: Request, res: Response): Promise<void> {
  try {
    const position = req.query.position as string | undefined;
    const banners = await catalogService.getPublicBanners(position);
    res.status(200).json({ banners });
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function getActivePopups(_req: Request, res: Response): Promise<void> {
  try {
    const popups = await catalogService.getPublicActivePopups();
    res.status(200).json({ popups });
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function getContents(req: Request, res: Response): Promise<void> {
  try {
    const type = req.query.type as string | undefined;
    const programId = req.query.program_id ? Number(req.query.program_id) : undefined;
    const contents = await catalogService.getPublicContents({ type, program_id: programId });
    res.status(200).json({ contents });
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function getContentById(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      res.status(400).json({ message: 'Mã bài viết không hợp lệ.' });
      return;
    }
    const content = await catalogService.getPublicContentById(id);
    res.status(200).json(content);
  } catch (error) {
    sendHttpError(res, error);
  }
}
