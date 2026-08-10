import { type Request, type Response } from 'express';
import * as authService from '../../services/partner/auth.service.js';
import { sendHttpError } from '../../utils/http-error.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, email, phone, identity_no, password, business_name, tax_code } = req.body;

    // Validate required fields
    if (![full_name, email, password, business_name, tax_code]
      .every((value) => typeof value === 'string' && value.trim().length > 0)) {
      res.status(400).json({
        message: 'Vui lòng điền đầy đủ thông tin: họ tên, email, mật khẩu, tên doanh nghiệp, mã số thuế.',
      });
      return;
    }

    if (password.length < 8 || password.length > 128) {
      res.status(400).json({ message: 'Mật khẩu phải có từ 8 đến 128 ký tự.' });
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
    sendHttpError(res, err);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });
      return;
    }

    const result = await authService.login({ email, password });

    res.status(200).json(result);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};
