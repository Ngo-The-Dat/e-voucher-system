import { type Request, type Response } from 'express';
import * as authService from '../../services/partner/auth.service.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, email, phone, identity_no, password, business_name, tax_code } = req.body;

    // Validate required fields
    if (!full_name || !email || !password || !business_name || !tax_code) {
      res.status(400).json({
        message: 'Vui lòng điền đầy đủ thông tin: họ tên, email, mật khẩu, tên doanh nghiệp, mã số thuế.',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
      return;
    }

    const user = await authService.register({
      full_name, email, phone, identity_no, password, business_name, tax_code,
    });

    res.status(201).json({
      message: 'Đăng ký thành công! Tài khoản đang chờ Admin phê duyệt.',
      user,
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    res.status(error.status || 500).json({ message: error.message || 'Lỗi hệ thống.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });
      return;
    }

    const result = await authService.login({ email, password });

    res.status(200).json(result);
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    res.status(error.status || 500).json({ message: error.message || 'Lỗi hệ thống.' });
  }
};
