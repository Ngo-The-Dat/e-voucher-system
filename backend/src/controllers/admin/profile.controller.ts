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

    if (full_name !== undefined && (typeof full_name !== 'string' || !full_name.trim())) {
      res.status(400).json({ message: 'Họ và tên không được để trống.' });
      return;
    }

    if (phone !== undefined && phone !== null && typeof phone === 'string' && phone.trim() !== '') {
      const cleanPhone = phone.trim().replace(/\s/g, '');
      const isPhoneValid = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(cleanPhone);
      if (!isPhoneValid) {
        res.status(400).json({
          message: 'Số điện thoại không đúng định dạng (yêu cầu 10 chữ số hợp lệ, bắt đầu bằng 03, 05, 07, 08, 09 hoặc +84).'
        });
        return;
      }
    }

    if (identity_no !== undefined && identity_no !== null && typeof identity_no === 'string' && identity_no.trim() !== '') {
      const cleanIdentity = identity_no.trim();
      const isIdentityValid = /^([0-9]{9}|[0-9]{12})$/.test(cleanIdentity);
      if (!isIdentityValid) {
        res.status(400).json({
          message: 'Số CCCD / CMND không hợp lệ (yêu cầu 9 chữ số CMND hoặc 12 chữ số CCCD).'
        });
        return;
      }
    }

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
