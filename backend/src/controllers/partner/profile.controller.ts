import { type Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as profileService from '../../services/partner/profile.service.js';
import { sendHttpError } from '../../utils/http-error.js';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    const profile = await profileService.getProfile(partnerId);
    res.status(200).json(profile);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      res.status(400).json({ message: 'Nội dung cập nhật hồ sơ không hợp lệ.' });
      return;
    }

    const stringFields: Array<[string, number, boolean]> = [
      ['full_name', 150, false],
      ['phone', 20, false],
      ['identity_no', 30, false],
      ['nationality', 100, true],
      ['business_name', 255, false],
      ['business_license_no', 100, true],
      ['license_issue_place', 255, true],
      ['representative_title', 100, true],
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
