import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as profileService from '../../services/partner/profile.service.js';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    const profile = await profileService.getProfile(partnerId);
    res.status(200).json(profile);
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    res.status(error.status || 500).json({ message: error.message || 'Lỗi hệ thống.' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    const updated = await profileService.updateProfile(partnerId, req.body);
    res.status(200).json({ message: 'Cập nhật hồ sơ thành công.', profile: updated });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    res.status(error.status || 500).json({ message: error.message || 'Lỗi hệ thống.' });
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

    if (new_password.length < 6) {
      res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
      return;
    }

    await profileService.changePassword(partnerId, old_password, new_password);
    res.status(200).json({ message: 'Đổi mật khẩu thành công.' });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    res.status(error.status || 500).json({ message: error.message || 'Lỗi hệ thống.' });
  }
};
