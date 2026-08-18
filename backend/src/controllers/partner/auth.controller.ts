/**
 * @file auth.controller.ts
 * @description Controller xử lý các yêu cầu xác thực, kiểm tra thông tin, xác thực OTP email
 * và đăng ký / đăng nhập dành riêng cho Đối tác (Partner).
 */

import { type Request, type Response } from 'express';
import * as authService from '../../services/partner/auth.service.js';
import * as otpService from '../../services/partner/registration-otp.service.js';
import { sendHttpError } from '../../utils/http-error.js';

/**
 * Trích xuất và kiểm tra tính hợp lệ của thông tin định danh dùng cho quá trình đăng ký đối tác.
 * 
 * @param body Dữ liệu nhận được từ req.body
 * @returns Đối tượng chứa email, identity_no (CCCD/CMND) và tax_code (Mã số thuế) dạng chuỗi
 * @throws {Object} Lỗi HTTP 400 nếu dữ liệu truyền lên không đúng định dạng object hoặc thiếu trường chuỗi bắt buộc
 */
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

/**
 * [GET/POST] /api/partner/auth/check-registration
 * Kiểm tra xem Email, Số CCCD/CMND và Mã số thuế đã tồn tại trên hệ thống hay chưa trước khi thực hiện gửi OTP.
 * 
 * @param req Express Request chứa email, identity_no, tax_code trong body
 * @param res Express Response trả về { available: true } nếu tất cả thông tin đều chưa được sử dụng
 */
export const checkRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    await authService.checkRegistrationAvailability(getRegistrationIdentity(req.body));
    res.status(200).json({ available: true });
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

/**
 * [POST] /api/partner/auth/send-otp
 * Gửi mã OTP xác thực 6 chữ số tới địa chỉ email của đối tác đăng ký.
 * 
 * @description
 * 1. Kiểm tra tính khả dụng của email, số CCCD và mã số thuế.
 * 2. Tạo mã OTP ngẫu nhiên, lưu cache kèm challenge_id và gửi mail xác nhận.
 * 
 * @param req Express Request chứa thông tin đăng ký (email, identity_no, tax_code)
 * @param res Express Response trả về challenge_id và thời gian hiệu lực của OTP
 */
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

/**
 * [POST] /api/partner/auth/verify-otp
 * Xác thực mã OTP người dùng nhập vào so với challenge_id đã phát hành.
 * 
 * @param req Express Request chứa { email, challenge_id, otp }
 * @param res Express Response trả về kết quả xác thực thành công nếu mã OTP chính xác
 */
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

/**
 * [POST] /api/partner/auth/register
 * Đăng ký tài khoản Đối tác doanh nghiệp mới vào hệ thống.
 * 
 * @description
 * - Kiểm tra các trường bắt buộc: họ tên, email, mật khẩu (>= 8 ký tự), tên doanh nghiệp, mã số thuế, mã challenge OTP.
 * - Sau khi tạo thành công, tài khoản sẽ ở trạng thái PENDING chờ Quản trị viên (Admin) phê duyệt.
 * 
 * @param req Express Request chứa thông tin đăng ký đối tác đầy đủ
 * @param res Express Response trả về thông tin đối tác vừa tạo kèm mã HTTP 201 Created
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, email, phone, identity_no, password, business_name, tax_code, otp_challenge_id } = req.body;

    // Kiểm tra các trường thông tin bắt buộc
    if (![full_name, email, password, business_name, tax_code]
      .every((value) => typeof value === 'string' && value.trim().length > 0)) {
      res.status(400).json({
        message: 'Vui lòng điền đầy đủ thông tin: họ tên, email, mật khẩu, tên doanh nghiệp, mã số thuế.',
      });
      return;
    }

    // Kiểm tra độ dài mật khẩu bảo mật
    if (password.length < 8 || password.length > 128) {
      res.status(400).json({ message: 'Mật khẩu phải có từ 8 đến 128 ký tự.' });
      return;
    }

    // Yêu cầu bắt buộc phải có otp_challenge_id đã được xác thực trước đó
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

/**
 * [POST] /api/partner/auth/login
 * Đăng nhập vào hệ thống dành cho Đối tác (Partner) hoặc Nhân viên đối tác (Partner Employee).
 * 
 * @param req Express Request chứa { email, password }
 * @param res Express Response trả về thông tin user, hồ sơ đối tác/nhân viên và JWT access token
 */
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
