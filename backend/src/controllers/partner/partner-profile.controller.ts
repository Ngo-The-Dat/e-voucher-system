/**
 * @file profile.controller.ts
 * @description Controller quản lý hồ sơ doanh nghiệp Đối tác (Partner Profile):
 * xem thông tin chi tiết, cập nhật thông tin pháp lý / đại diện, upload ảnh logo thương hiệu lên R2 storage,
 * và đổi mật khẩu tài khoản đối tác.
 */

import { type Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as profileService from '../../services/partner/partner-profile.service.js';
import { sendHttpError } from '../../utils/http-error.js';

/**
 * [GET] /api/partner/profile
 * Lấy toàn bộ thông tin hồ sơ của Đối tác đang đăng nhập.
 * Bao gồm thông tin đại diện pháp luật, thông tin pháp lý doanh nghiệp, danh sách chi nhánh và trạng thái phê duyệt.
 * 
 * @param req AuthRequest chứa user token đã xác thực
 * @param res Express Response trả về JSON thông tin hồ sơ
 */
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    const profile = await profileService.getProfile(partnerId);
    res.status(200).json(profile);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

/**
 * [PUT] /api/partner/profile
 * Cập nhật thông tin hồ sơ đối tác (họ tên đại diện, SĐT, CCCD, quốc tịch, tên doanh nghiệp, số GPKD, chức vụ, logo).
 * 
 * @description
 * - Kiểm tra danh sách trường hợp lệ và độ dài tối đa cho từng trường.
 * - Kiểm tra định dạng giới tính (`MALE`, `FEMALE`, `OTHER`) và ngày cấp GPKD.
 * 
 * @param req AuthRequest chứa dữ liệu cần cập nhật
 * @param res Express Response trả về hồ sơ đối tác sau khi cập nhật
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      res.status(400).json({ message: 'Nội dung cập nhật hồ sơ không hợp lệ.' });
      return;
    }

    // Danh sách các trường chuỗi: [tên trường, độ dài tối đa, cho phép rỗng]
    const stringFields: Array<[string, number, boolean]> = [
      ['full_name', 150, false],
      ['phone', 20, false],
      ['identity_no', 30, false],
      ['nationality', 100, true],
      ['business_name', 255, false],
      ['business_license_no', 100, true],
      ['license_issue_place', 255, true],
      ['representative_title', 100, true],
      ['brand_logo', 500, true],
    ];
    const allowedFields = new Set([
      ...stringFields.map(([field]) => field),
      'gender',
      'license_issue_date',
    ]);
    const providedFields = Object.keys(req.body).filter((field) => allowedFields.has(field));
    if (providedFields.length === 0) {
      res.status(400).json({ message: 'Không có trường hồ sơ hợp lệ để cập nhật.' });
      return;
    }
    for (const [field, maxLength, allowEmpty] of stringFields) {
      const value = req.body[field];
      if (value !== undefined &&
          (typeof value !== 'string' || (!allowEmpty && !value.trim()) || value.length > maxLength)) {
        res.status(400).json({ message: `${field} không hợp lệ hoặc vượt quá ${maxLength} ký tự.` });
        return;
      }
    }
    if (req.body.gender !== undefined && !['MALE', 'FEMALE', 'OTHER'].includes(req.body.gender)) {
      res.status(400).json({ message: 'Giới tính không hợp lệ.' });
      return;
    }
    if (req.body.license_issue_date !== undefined && req.body.license_issue_date !== null &&
        (typeof req.body.license_issue_date !== 'string' ||
         !req.body.license_issue_date.trim() ||
         Number.isNaN(new Date(req.body.license_issue_date).getTime()))) {
      res.status(400).json({ message: 'Ngày cấp giấy phép không hợp lệ.' });
      return;
    }
    const updated = await profileService.updateProfile(partnerId, req.body);
    res.status(200).json({ message: 'Cập nhật hồ sơ thành công.', profile: updated });
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

/**
 * [POST] /api/partner/profile/logo
 * Tải lên ảnh logo thương hiệu của đối tác (lưu trữ trên Cloudflare R2).
 * 
 * @param req AuthRequest dạng multipart/form-data chứa file ảnh
 * @param res Express Response trả về URL ảnh logo sau khi upload thành công
 */
export const uploadLogo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    if (!req.file) {
      res.status(400).json({ message: 'Vui lòng chọn một ảnh logo để upload.' });
      return;
    }

    const { uploadBrandLogo } = await import('../../services/storage/r2.service.js');
    const logoUrl = await uploadBrandLogo(partnerId, req.file);
    const updated = await profileService.updateProfile(partnerId, { brand_logo: logoUrl });

    res.status(200).json({
      message: 'Upload logo thành công.',
      logo_url: logoUrl,
      profile: updated,
    });
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

/**
 * [POST] /api/partner/profile/change-password
 * Đổi mật khẩu đăng nhập cho tài khoản Đối tác.
 * 
 * @param req AuthRequest chứa { old_password, new_password }
 * @param res Express Response thông báo đổi mật khẩu thành công
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      res.status(400).json({ message: 'Vui lòng nhập mật khẩu cũ và mật khẩu mới.' });
      return;
    }

    if (typeof old_password !== 'string' || typeof new_password !== 'string' ||
        new_password.length < 8 || new_password.length > 128) {
      res.status(400).json({ message: 'Mật khẩu mới phải có từ 8 đến 128 ký tự.' });
      return;
    }

    await profileService.changePassword(partnerId, old_password, new_password);
    res.status(200).json({ message: 'Đổi mật khẩu thành công.' });
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};
