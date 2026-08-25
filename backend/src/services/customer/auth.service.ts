import pool from '../../config/db.js';
import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';

export interface CustomerRegisterInput {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  challenge_id?: string;
}

export interface CustomerLoginInput {
  email: string;
  password: string;
}

import * as regOtpService from './registration-otp.service.js';

export const requestRegistrationOtp = async (emailOrPhone: string) => {
  const normalizedStr = emailOrPhone.trim().toLowerCase();
  if (!normalizedStr) {
    throw { status: 400, message: 'Vui lòng cung cấp email hoặc số điện thoại.' };
  }

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedStr);

  if (isEmail) {
    const emailCheck = await pool.query('SELECT user_id FROM users WHERE email = $1', [normalizedStr]);
    if (emailCheck.rows.length > 0) throw { status: 409, message: 'Email này đã được đăng ký trên hệ thống.' };
  } else {
    const phoneCheck = await pool.query('SELECT user_id FROM users WHERE phone = $1', [normalizedStr]);
    if (phoneCheck.rows.length > 0) throw { status: 409, message: 'Số điện thoại này đã được đăng ký trên hệ thống.' };
  }

  return await regOtpService.requestRegistrationOtp(normalizedStr);
};

export const verifyRegistrationOtp = async (email: string, challengeId: string, code: string) => {
  if (!email || !challengeId || !code) {
    throw { status: 400, message: 'Thiếu thông tin xác thực OTP.' };
  }
  return await regOtpService.verifyRegistrationOtp(email, challengeId, code);
};

export const register = async (input: CustomerRegisterInput) => {
  const full_name = input.full_name?.trim();
  let email = input.email ? input.email.trim().toLowerCase() : null;
  const phone = input.phone ? input.phone.trim() : null;
  const password = input.password;
  const gender = input.gender || null;

  if (!full_name || (!email && !phone) || !password) {
    throw { status: 400, message: 'Vui lòng nhập đầy đủ họ tên, mật khẩu và Email hoặc Số điện thoại.' };
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    throw { status: 400, message: 'Mật khẩu phải dài tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.' };
  }

  // 1. Kiểm tra email & phone đã được đăng ký chưa
  if (email) {
    const emailCheck = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      throw { status: 409, message: 'Email này đã được đăng ký trên hệ thống.' };
    }
  }

  if (phone) {
    const phoneCheck = await pool.query('SELECT user_id FROM users WHERE phone = $1', [phone]);
    if (phoneCheck.rows.length > 0) {
      throw { status: 409, message: 'Số điện thoại này đã được đăng ký trên hệ thống.' };
    }
  }

  // 2. Hash mật khẩu
  const password_hash = await bcrypt.hash(password, 10);

  if (email && input.challenge_id) {
    regOtpService.beginOtpConsumption(email, input.challenge_id);
  }

  // 3. Thêm user mới với role CUSTOMER
  let result;
  try {
    result = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, gender, role, status)
       VALUES ($1, $2, $3, $4, $5, 'CUSTOMER', 'ACTIVE')
       RETURNING user_id, full_name, email, phone, gender, role, status, created_at`,
      [full_name, email, phone, password_hash, gender]
    );

    if (email && input.challenge_id) {
      regOtpService.completeOtpConsumption(email, input.challenge_id);
    }
  } catch (err: any) {
    if (email && input.challenge_id) {
      regOtpService.releaseOtpConsumption(email, input.challenge_id);
    }
    if (err.code === '23505') {
      if (err.constraint?.includes('phone')) {
        throw { status: 409, message: 'Số điện thoại này đã được sử dụng.' };
      }
      throw { status: 409, message: 'Email hoặc số điện thoại đã được đăng ký.' };
    }
    throw err;
  }

  const user = result.rows[0];

  // 4. Tạo JWT token
  const secret = process.env.JWT_SECRET || 'defaultsecret';
  const jwtOptions = { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' } as SignOptions;
  const token = jwt.sign(
    { id: Number(user.user_id), role: user.role, email: user.email },
    secret,
    jwtOptions
  );

  return {
    message: 'Đăng ký tài khoản thành công!',
    token,
    user: {
      id: Number(user.user_id),
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  };
};

export const login = async (input: CustomerLoginInput) => {
  const loginIdentifier = input.email?.trim().toLowerCase();
  const password = input.password;

  if (!loginIdentifier || !password) {
    throw { status: 400, message: 'Vui lòng nhập Email/Số điện thoại và mật khẩu.' };
  }

  // 1. Tìm user role CUSTOMER bằng email hoặc SĐT
  const userResult = await pool.query(
    `SELECT user_id, full_name, email, phone, password_hash, role, status
     FROM users
     WHERE (email = $1 OR phone = $1) AND role = 'CUSTOMER'`,
    [loginIdentifier]
  );

  if (userResult.rows.length === 0) {
    throw { status: 401, message: 'Tài khoản hoặc mật khẩu không chính xác.' };
  }

  const user = userResult.rows[0];

  // 2. Trạng thái hoạt động
  if (user.status !== 'ACTIVE') {
    throw { status: 403, message: 'Tài khoản của bạn hiện đã bị khóa.' };
  }

  // 3. Verify mật khẩu
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw { status: 401, message: 'Email hoặc mật khẩu không chính xác.' };
  }

  // 4. Tạo JWT token
  const secret = process.env.JWT_SECRET || 'defaultsecret';
  const jwtOptions = { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' } as SignOptions;
  const token = jwt.sign(
    { id: Number(user.user_id), role: user.role, email: user.email },
    secret,
    jwtOptions
  );

  // 5. Cập nhật last_login_at
  await pool.query('UPDATE users SET last_login_at = NOW() WHERE user_id = $1', [user.user_id]);

  return {
    token,
    user: {
      id: Number(user.user_id),
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  };
};

export const getMe = async (userId: number) => {
  const result = await pool.query(
    `SELECT 
       user_id, full_name, email, phone, role, status, created_at,
       gender, identity_no, nationality
     FROM users
     WHERE user_id = $1 AND role = 'CUSTOMER'`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy thông tin tài khoản.' };
  }

  const user = result.rows[0];
  return {
    id: Number(user.user_id),
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    gender: user.gender,
    identity_no: user.identity_no,
    nationality: user.nationality,
    status: user.status,
    created_at: user.created_at,
  };
};

import {
  requestResetOtp,
  verifyResetOtp,
  beginOtpConsumption,
  releaseOtpConsumption,
  completeOtpConsumption
} from '../common/password-reset-otp.service.js';

export const requestPasswordReset = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw { status: 400, message: 'Vui lòng cung cấp email.' };
  }

  // 1. Kiểm tra email có tồn tại và thuộc về CUSTOMER hay không
  const userResult = await pool.query(
    `SELECT user_id, status FROM users WHERE email = $1 AND role = 'CUSTOMER'`,
    [normalizedEmail]
  );

  if (userResult.rows.length === 0) {
    // Để bảo mật, không nên trả về lỗi 404 cho email không tồn tại trong flow reset password, 
    // nhưng ở đây ta cứ báo chung chung hoặc báo rõ tùy yêu cầu. Chọn báo rõ để UX tốt.
    throw { status: 404, message: 'Email này không được đăng ký tài khoản Khách hàng.' };
  }

  const user = userResult.rows[0];
  if (user.status !== 'ACTIVE') {
    throw { status: 403, message: 'Tài khoản của bạn hiện đã bị khóa, không thể khôi phục mật khẩu.' };
  }

  // 2. Yêu cầu gửi OTP
  return await requestResetOtp(normalizedEmail);
};

export const verifyPasswordResetOtp = async (email: string, challengeId: string, code: string) => {
  if (!email || !challengeId || !code) {
    throw { status: 400, message: 'Thiếu thông tin xác thực OTP.' };
  }
  return await verifyResetOtp(email, challengeId, code);
};

export const resetPassword = async (email: string, challengeId: string, newPassword: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  
  if (!newPassword || newPassword.length < 6) {
    throw { status: 400, message: 'Mật khẩu mới phải chứa ít nhất 6 ký tự.' };
  }

  // 1. Bắt đầu tiêu thụ OTP (Lock logic)
  beginOtpConsumption(normalizedEmail, challengeId);

  try {
    // 2. Hash mật khẩu mới
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 3. Cập nhật DB
    const updateResult = await pool.query(
      `UPDATE users SET password_hash = $1 WHERE email = $2 AND role = 'CUSTOMER' RETURNING user_id`,
      [passwordHash, normalizedEmail]
    );

    if (updateResult.rows.length === 0) {
      throw { status: 404, message: 'Không tìm thấy tài khoản Khách hàng.' };
    }

    // 4. Hoàn tất tiêu thụ OTP (Xóa khỏi bộ nhớ)
    completeOtpConsumption(normalizedEmail, challengeId);

    return { message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' };
  } catch (error) {
    // Nếu có lỗi trong quá trình update, release để có thể thử lại
    releaseOtpConsumption(normalizedEmail, challengeId);
    throw error;
  }
};

export const changePassword = async (userId: number, currentPassword: string, newPassword: string) => {
  if (!newPassword || newPassword.length < 6) {
    throw { status: 400, message: 'Mật khẩu mới phải chứa ít nhất 6 ký tự.' };
  }

  // Lấy password_hash hiện tại
  const userResult = await pool.query(
    `SELECT password_hash FROM users WHERE user_id = $1 AND role = 'CUSTOMER'`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy tài khoản Khách hàng.' };
  }

  const { password_hash } = userResult.rows[0];

  // Kiểm tra mật khẩu hiện tại
  const isMatch = await bcrypt.compare(currentPassword, password_hash);
  if (!isMatch) {
    throw { status: 400, message: 'Mật khẩu hiện tại không đúng.' };
  }

  // Tránh việc đặt lại mật khẩu cũ
  const isSamePassword = await bcrypt.compare(newPassword, password_hash);
  if (isSamePassword) {
    throw { status: 400, message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.' };
  }

  // Hash mật khẩu mới và lưu
  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  await pool.query(
    `UPDATE users SET password_hash = $1 WHERE user_id = $2`,
    [newPasswordHash, userId]
  );

  return { message: 'Đổi mật khẩu thành công.' };
};

export interface UpdateProfileInput {
  full_name: string;
  phone?: string;
  gender?: string;
  identity_no?: string;
  nationality?: string;
}

export const updateProfile = async (userId: number, input: UpdateProfileInput) => {
  const full_name = input.full_name?.trim();
  const phone = input.phone?.trim() || null;
  const gender = input.gender?.trim() || null;
  const identity_no = input.identity_no?.trim() || null;
  const nationality = input.nationality?.trim() || null;

  if (!full_name) {
    throw { status: 400, message: 'Họ và tên không được để trống.' };
  }

  // Kiểm tra số điện thoại nếu có
  if (phone) {
    const phoneCheck = await pool.query(
      'SELECT user_id FROM users WHERE phone = $1 AND user_id != $2',
      [phone, userId]
    );
    if (phoneCheck.rows.length > 0) {
      throw { status: 409, message: 'Số điện thoại này đã được tài khoản khác sử dụng.' };
    }
  }

  // Kiểm tra CCCD nếu có
  if (identity_no) {
    const identityCheck = await pool.query(
      'SELECT user_id FROM users WHERE identity_no = $1 AND user_id != $2',
      [identity_no, userId]
    );
    if (identityCheck.rows.length > 0) {
      throw { status: 409, message: 'Số CCCD/CMND này đã được tài khoản khác sử dụng.' };
    }
  }

  // Cập nhật thông tin
  const result = await pool.query(
    `UPDATE users 
     SET full_name = $1, phone = $2, gender = $3, identity_no = $4, nationality = $5
     WHERE user_id = $6 AND role = 'CUSTOMER'
     RETURNING user_id, full_name, email, phone, role, status, created_at, gender, identity_no, nationality`,
    [full_name, phone, gender, identity_no, nationality, userId]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy tài khoản Khách hàng.' };
  }

  const user = result.rows[0];
  return {
    id: Number(user.user_id),
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    gender: user.gender,
    identity_no: user.identity_no,
    nationality: user.nationality,
    status: user.status,
    created_at: user.created_at,
  };
};

