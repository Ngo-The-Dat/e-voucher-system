import { type Request, type Response } from 'express';
import * as authService from '../../services/partner/auth.service.js';
import * as otpService from '../../services/partner/registration-otp.service.js';
import { sendHttpError } from '../../utils/http-error.js';

const getRegistrationIdentity = (body: unknown) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw { status: 400, message: 'Thông tin xác thực đăng ký không hợp lệ.' };
  }
  const { email, identity_no, tax_code } = body as Record<string, unknown>;
  if (![email, identity_no, tax_code].every((value) => typeof value === 'string')) {
    throw { status: 400, message: 'Thông tin xác thực đăng ký không hợp lệ.' };
  }
  return {
    email: email as string,
    identity_no: identity_no as string,
    tax_code: tax_code as string,
  };
};

export const checkRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    await authService.checkRegistrationAvailability(getRegistrationIdentity(req.body));
    res.status(200).json({ available: true });
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

export const sendRegistrationOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const identity = getRegistrationIdentity(req.body);
    await authService.checkRegistrationAvailability(identity);
    const result = await otpService.requestRegistrationOtp(identity.email);
    res.status(200).json({ message: 'Mã OTP đã được gửi tới email của bạn.', ...result });
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

export const verifyRegistrationOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      res.status(400).json({ message: 'Thông tin OTP không hợp lệ.' });
      return;
    }
    const { email, challenge_id, otp } = req.body as Record<string, unknown>;
    if (
      typeof email !== 'string'
      || typeof challenge_id !== 'string'
      || typeof otp !== 'string'
      || !/^\d{6}$/.test(otp)
    ) {
      res.status(400).json({ message: 'Thông tin OTP không hợp lệ.' });
      return;
    }
    const result = await otpService.verifyRegistrationOtp(email, challenge_id, otp);
    res.status(200).json({ message: 'Xác thực email thành công.', ...result });
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, email, phone, identity_no, password, business_name, tax_code, otp_challenge_id } = req.body;

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

    if (typeof otp_challenge_id !== 'string' || !otp_challenge_id) {
      res.status(400).json({ message: 'Vui lòng xác thực email bằng OTP trước khi đăng ký.' });
      return;
    }

    const user = await authService.register({
      full_name, email, phone, identity_no, password, business_name, tax_code, otp_challenge_id,
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
