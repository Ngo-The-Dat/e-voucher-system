import { type Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as imageService from '../../services/partner/voucher-image.service.js';
import { sendHttpError } from '../../utils/http-error.js';

const parsePositiveId = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

export const uploadImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const programId = parsePositiveId(req.params.id);
    if (!programId) {
      res.status(400).json({ message: 'ID voucher không hợp lệ.' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ message: 'Vui lòng chọn một ảnh để upload.' });
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(req.file.mimetype)) {
      res.status(400).json({ message: 'Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.' });
      return;
    }

    const primaryValue = req.body.is_primary;
    if (primaryValue !== undefined && !['true', 'false'].includes(String(primaryValue))) {
      res.status(400).json({ message: 'is_primary phải là true hoặc false.' });
      return;
    }
    let sortOrder: number | undefined;
    if (req.body.sort_order !== undefined && req.body.sort_order !== '') {
      sortOrder = Number(req.body.sort_order);
      if (!Number.isSafeInteger(sortOrder) || sortOrder < 0) {
        res.status(400).json({ message: 'sort_order phải là số nguyên không âm.' });
        return;
      }
    }

    const image = await imageService.addVoucherImage(
      programId,
      req.user!.id,
      req.file,
      String(primaryValue) === 'true',
      sortOrder
    );
    res.status(201).json({ message: 'Upload ảnh voucher thành công.', image });
  } catch (error) {
    sendHttpError(res, error);
  }
};

export const setPrimary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const programId = parsePositiveId(req.params.id);
    const imageId = parsePositiveId(req.params.imageId);
    if (!programId || !imageId) {
      res.status(400).json({ message: 'ID voucher hoặc ID ảnh không hợp lệ.' });
      return;
    }
    const images = await imageService.setPrimaryImage(programId, imageId, req.user!.id);
    res.status(200).json({ message: 'Đã cập nhật ảnh chính.', images });
  } catch (error) {
    sendHttpError(res, error);
  }
};

export const reorder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const programId = parsePositiveId(req.params.id);
    if (!programId) {
      res.status(400).json({ message: 'ID voucher không hợp lệ.' });
      return;
    }
    const imageIds = req.body?.image_ids;
    if (!Array.isArray(imageIds) ||
        imageIds.some((id: unknown) => !parsePositiveId(id)) ||
        new Set(imageIds.map(Number)).size !== imageIds.length) {
      res.status(400).json({ message: 'Danh sách image_ids không hợp lệ hoặc bị trùng.' });
      return;
    }
    const images = await imageService.reorderVoucherImages(
      programId,
      req.user!.id,
      imageIds.map(Number)
    );
    res.status(200).json({ message: 'Đã cập nhật thứ tự ảnh.', images });
  } catch (error) {
    sendHttpError(res, error);
  }
};

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const programId = parsePositiveId(req.params.id);
    const imageId = parsePositiveId(req.params.imageId);
    if (!programId || !imageId) {
      res.status(400).json({ message: 'ID voucher hoặc ID ảnh không hợp lệ.' });
      return;
    }
    const images = await imageService.deleteVoucherImage(programId, imageId, req.user!.id);
    res.status(200).json({ message: 'Đã xóa ảnh voucher.', images });
  } catch (error) {
    sendHttpError(res, error);
  }
};

