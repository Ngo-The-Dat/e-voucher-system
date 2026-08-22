/**
 * @file profile.controller.ts
 * @description Controller tiếp nhận và điều phối các yêu cầu xem thông tin, cập nhật hồ sơ và đổi mật khẩu của Quản trị viên (Admin).
 */

import { type Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as profileService from '../../services/admin/profile.service.js';
import { sendHttpError } from '../../utils/http-error.js';

/**
 * [GET] /api/admin/profile
 * Lấy thông tin cá nhân của Quản trị viên đang đăng nhập.
 */
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await profileService.getAdminProfile(req.user!.id);
    res.status(200).json(profile);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

/**
 * [PUT] /api/admin/profile
 * Cập nhật thông tin cá nhân của Quản trị viên (họ tên, SĐT, giới tính, quốc tịch, CCCD).
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { full_name, phone, gender, nationality, identity_no } = req.body;
    const profile = await profileService.updateAdminProfile(req.user!.id, {
      full_name,
      phone,
      gender,
      nationality,
      identity_no,
    });
    res.status(200).json(profile);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

/**
 * [PUT] /api/admin/profile/change-password
 * Đổi mật khẩu tài khoản Quản trị viên.
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { old_password, new_password } = req.body;
    await profileService.changeAdminPassword(req.user!.id, old_password, new_password);
    res.status(200).json({ message: 'Đổi mật khẩu thành công.' });
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};
