/**
 * @file voucher-image.controller.ts
 * @description Controller quản lý bộ sưu tập hình ảnh của chương trình voucher (Voucher Gallery):
 * upload ảnh mới lên Cloudflare R2 / Object Storage, thiết lập ảnh đại diện chính (Primary Image),
 * sắp xếp lại thứ tự ảnh hiển thị và xóa ảnh khỏi chương trình.
 */

import { type Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as imageService from '../../services/partner/voucher-image.service.js';
import { sendHttpError } from '../../utils/http-error.js';

/**
 * Hàm helper kiểm tra và chuyển đổi giá trị ID sang số nguyên dương an toàn.
 * 
 * @param value Giá trị đầu vào cần ép kiểu
 * @returns Số nguyên dương hoặc null nếu không hợp lệ
 */
const parsePositiveId = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

/**
 * [POST] /api/partner/vouchers/:id/images
 * Tải lên một ảnh mới cho chương trình voucher.
 * 
 * @description
 * - Kiểm tra định dạng ảnh (JPEG, PNG, WebP).
 * - Tùy chọn đặt làm ảnh chính (`is_primary`) và thứ tự sắp xếp (`sort_order`).
 * - Upload file lên R2 và lưu bản ghi vào bảng `voucher_images`.
 * 
 * @param req AuthRequest dạng multipart/form-data
 * @param res Express Response trả về thông tin ảnh vừa upload (HTTP 201 Created)
 */
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

/**
 * [PUT] /api/partner/vouchers/:id/images/:imageId/primary
 * Thiết lập một ảnh làm ảnh đại diện chính (Primary / Thumbnail) của voucher.
 * Tự động hủy cờ `is_primary` của các ảnh khác cùng voucher.
 * 
 * @param req AuthRequest chứa program ID và imageId
 * @param res Express Response trả về danh sách ảnh sau khi cập nhật
 */
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

/**
 * [PUT] /api/partner/vouchers/:id/images/reorder
 * Sắp xếp lại thứ tự hiển thị của toàn bộ ảnh trong bộ sưu tập voucher.
 * 
 * @param req AuthRequest chứa { image_ids: number[] } theo thứ tự mong muốn
 * @param res Express Response trả về danh sách ảnh đã được sắp xếp lại
 */
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

/**
 * [DELETE] /api/partner/vouchers/:id/images/:imageId
 * Xóa một hình ảnh khỏi chương trình voucher (đồng thời xóa file trên Cloudflare R2 nếu cần).
 * Nếu xóa trúng ảnh chính, hệ thống sẽ tự động chỉ định ảnh đầu tiên còn lại làm ảnh chính mới.
 * 
 * @param req AuthRequest chứa program ID và imageId
 * @param res Express Response trả về danh sách ảnh còn lại
 */
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
