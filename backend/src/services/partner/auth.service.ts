import pool from '../../config/db.js';
import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import {
  beginOtpConsumption,
  completeOtpConsumption,
  releaseOtpConsumption,
} from './registration-otp.service.js';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegisterInput {
  full_name: string;
  email: string;
  phone: string;
  identity_no: string;       // Số CCCD/CMND
  password: string;
  business_name: string;
  tax_code: string;
  otp_challenge_id: string;
}

interface LoginInput {
  email: string;
  password: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export interface RegistrationCheckInput {
  email: string;
  identity_no: string;
  tax_code: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TAX_CODE_PATTERN = /^[0-9]{10,13}$/;

export const checkRegistrationAvailability = async (input: RegistrationCheckInput): Promise<void> => {
  const email = input.email.trim().toLowerCase();
  const identityNo = input.identity_no.trim();
  const taxCode = input.tax_code.trim();

  if (!EMAIL_PATTERN.test(email)) {
    throw { status: 400, field: 'email', message: 'Định dạng email không hợp lệ.' };
  }
  if (!identityNo) {
    throw { status: 400, field: 'identity_no', message: 'Vui lòng nhập số CCCD/CMND.' };
  }
  if (!TAX_CODE_PATTERN.test(taxCode)) {
    throw { status: 400, field: 'tax_code', message: 'Mã số thuế phải gồm 10 đến 13 chữ số.' };
  }

  const [emailCheck, identityCheck, taxCheck] = await Promise.all([
    pool.query('SELECT user_id FROM users WHERE email = $1', [email]),
    pool.query('SELECT user_id FROM users WHERE identity_no = $1', [identityNo]),
    pool.query('SELECT user_id FROM partners WHERE tax_code = $1', [taxCode]),
  ]);

  if (emailCheck.rows.length > 0) {
    throw { status: 409, field: 'email', message: 'Email này đã được đăng ký.' };
  }
  if (identityCheck.rows.length > 0) {
    throw { status: 409, field: 'identity_no', message: 'Số CCCD/CMND này đã được đăng ký trên hệ thống.' };
  }
  if (taxCheck.rows.length > 0) {
    throw { status: 409, field: 'tax_code', message: 'Mã số thuế này đã được đăng ký.' };
  }
};

export const register = async (input: RegisterInput) => {
  const full_name = input.full_name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = typeof input.phone === 'string' ? input.phone.trim() || null : null;
  const identity_no = typeof input.identity_no === 'string' ? input.identity_no.trim() || null : null;
  const password = input.password;
  const business_name = input.business_name.trim();
  const tax_code = input.tax_code.trim();
  const otp_challenge_id = input.otp_challenge_id;

  if (!TAX_CODE_PATTERN.test(tax_code)) {
    throw { status: 400, field: 'tax_code', message: 'Mã số thuế phải gồm 10 đến 13 chữ số.' };
  }

  beginOtpConsumption(email, otp_challenge_id);

  try {
    // 1. Kiểm tra email đã tồn tại chưa
    const emailCheck = await pool.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    );
    if (emailCheck.rows.length > 0) {
      throw { status: 409, field: 'email', message: 'Email này đã được đăng ký.' };
    }

    // 2. Kiểm tra CCCD/CMND đã tồn tại chưa
    if (identity_no) {
      const cccdCheck = await pool.query(
        'SELECT user_id FROM users WHERE identity_no = $1',
        [identity_no]
      );
      if (cccdCheck.rows.length > 0) {
        throw { status: 409, field: 'identity_no', message: 'Số CCCD/CMND này đã được đăng ký trên hệ thống.' };
      }
    }

    // 3. Kiểm tra mã số thuế đã tồn tại chưa
    const taxCheck = await pool.query(
      'SELECT user_id FROM partners WHERE tax_code = $1',
      [tax_code]
    );
    if (taxCheck.rows.length > 0) {
      throw { status: 409, field: 'tax_code', message: 'Mã số thuế này đã được đăng ký.' };
    }

    // 4. Hash mật khẩu
    const password_hash = await bcrypt.hash(password, 10);

    // 5. Tạo user với role PARTNER (dùng transaction)
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userResult = await client.query(
        `INSERT INTO users (full_name, email, phone, identity_no, password_hash, role)
         VALUES ($1, $2, $3, $4, $5, 'PARTNER')
         RETURNING user_id, full_name, email, phone, identity_no, role, status, created_at`,
        [full_name, email, phone, identity_no, password_hash]
      );
      const user = userResult.rows[0];

      // 6. Tạo bản ghi partner (activity_status INACTIVE) và tạo yêu cầu duyệt PENDING
      await client.query(
        `INSERT INTO partners (user_id, business_name, tax_code, activity_status)
         VALUES ($1, $2, $3, 'INACTIVE')`,
        [user.user_id, business_name, tax_code]
      );

      await client.query(
        `INSERT INTO partner_approval_requests (partner_id, approval_status)
         VALUES ($1, 'PENDING')`,
        [user.user_id]
      );

      await client.query('COMMIT');
      completeOtpConsumption(email, otp_challenge_id);
      return user;
    } catch (err) {
      await client.query('ROLLBACK');
      const databaseError = err as { code?: string; constraint?: string };
      if (databaseError.code === '23505') {
        if (databaseError.constraint?.includes('email')) {
          throw { status: 409, field: 'email', message: 'Email này đã được đăng ký.' };
        }
        if (databaseError.constraint?.includes('identity_no')) {
          throw { status: 409, field: 'identity_no', message: 'Số CCCD/CMND này đã được đăng ký trên hệ thống.' };
        }
        if (databaseError.constraint?.includes('phone')) {
          throw { status: 409, field: 'phone', message: 'Số điện thoại này đã được đăng ký.' };
        }
        if (databaseError.constraint?.includes('tax_code')) {
          throw { status: 409, field: 'tax_code', message: 'Mã số thuế này đã được đăng ký.' };
        }
        throw { status: 409, message: 'Email, số định danh hoặc mã số thuế đã được đăng ký.' };
      }
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    releaseOtpConsumption(email, otp_challenge_id);
    throw err;
  }
};

export const login = async (input: LoginInput) => {
  const email = input.email.trim().toLowerCase();
  const { password } = input;

  // 1. Tìm user theo email với role PARTNER
  const userResult = await pool.query(
    `SELECT u.user_id, u.full_name, u.email, u.phone, u.password_hash, u.role, u.status,
            p.business_name, COALESCE(par.approval_status, 'PENDING') as approval_status, p.activity_status
     FROM users u
     JOIN partners p ON u.user_id = p.user_id
     LEFT JOIN LATERAL (
       SELECT approval_status
       FROM partner_approval_requests
       WHERE partner_id = p.user_id
       ORDER BY submitted_at DESC, approval_request_id DESC
       LIMIT 1
     ) par ON TRUE
     WHERE u.email = $1 AND u.role = 'PARTNER'`,
    [email]
  );

  if (userResult.rows.length === 0) {
    throw { status: 401, message: 'Email hoặc mật khẩu không đúng.' };
  }

  const user = userResult.rows[0];

  // 2. Verify mật khẩu
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw { status: 401, message: 'Email hoặc mật khẩu không đúng.' };
  }

  // 3. Kiểm tra tài khoản đã được duyệt chưa
  if (user.approval_status === 'PENDING') {
    throw { status: 403, message: 'Tài khoản đang chờ được Admin phê duyệt.' };
  }
  if (user.approval_status === 'REJECTED') {
    throw { status: 403, message: 'Tài khoản đã bị từ chối. Vui lòng liên hệ hỗ trợ.' };
  }

  // 4. Kiểm tra tài khoản có bị khóa không
  if (user.status === 'LOCKED' || user.activity_status === 'LOCKED') {
    throw { status: 403, message: 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.' };
  }

  // 5. Tạo JWT token
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET chưa được cấu hình');

  const jwtOptions = { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' } as SignOptions;
  const token = jwt.sign(
    { id: Number(user.user_id), role: user.role, email: user.email },
    secret,
    jwtOptions
  );

  // 6. Cập nhật last_login_at
  await pool.query(
    'UPDATE users SET last_login_at = NOW() WHERE user_id = $1',
    [user.user_id]
  );

  return {
    token,
    user: {
      id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      business_name: user.business_name,
      approval_status: user.approval_status,
    },
  };
};
