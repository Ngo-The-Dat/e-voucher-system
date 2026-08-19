/**
 * @file auth.service.ts
 * @description Service xử lý nghiệp vụ xác thực cho Đối tác (Partner) và Nhân viên đối tác (Partner Employee),
 * bao gồm kiểm tra trùng lặp thông tin đăng ký, xử lý giao dịch tạo tài khoản, xác thực mật khẩu bcrypt,
 * kiểm tra các trạng thái phê duyệt / trạng thái hoạt động và phát hành JWT access token.
 */

import pool from '../../config/db.js';
import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import {
  beginOtpConsumption,
  completeOtpConsumption,
  releaseOtpConsumption,
} from './registration-otp.service.js';

// ─── Types & Interfaces ───────────────────────────────────────────────────────

/** Dữ liệu đầu vào yêu cầu khi đăng ký tài khoản Đối tác mới */
interface RegisterInput {
  full_name: string;
  email: string;
  phone: string;
  identity_no: string;       // Số CCCD/CMND của người đại diện pháp luật
  password: string;
  business_name: string;     // Tên thương hiệu / doanh nghiệp đối tác
  tax_code: string;          // Mã số thuế doanh nghiệp (10-13 chữ số)
  otp_challenge_id: string;  // Challenge ID đã xác thực OTP email thành công
}

/** Dữ liệu đầu vào khi đăng nhập */
interface LoginInput {
  email: string;
  password: string;
}

/** Dữ liệu đầu vào khi kiểm tra tính khả dụng của thông tin đăng ký */
export interface RegistrationCheckInput {
  email: string;
  identity_no: string;
  tax_code: string;
}

// ─── Regular Expressions ──────────────────────────────────────────────────────
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TAX_CODE_PATTERN = /^[0-9]{10,13}$/;

// ─── Service Methods ──────────────────────────────────────────────────────────

/**
 * Kiểm tra tính hợp lệ và sự khả dụng của Email, CCCD/CMND và Mã số thuế trên toàn hệ thống.
 * 
 * @param input Thông tin gồm email, identity_no, tax_code
 * @throws {Object} Lỗi HTTP 400 nếu dữ liệu không đúng định dạng regex (email, tax code)
 * @throws {Object} Lỗi HTTP 409 nếu email, CCCD hoặc mã số thuế đã tồn tại trong database
 */
export const checkRegistrationAvailability = async (input: RegistrationCheckInput): Promise<void> => {
  const email = input.email.trim().toLowerCase();
  const identityNo = input.identity_no.trim();
  const taxCode = input.tax_code.trim();

  // 1. Kiểm tra định dạng dữ liệu đầu vào
  if (!EMAIL_PATTERN.test(email)) {
    throw { status: 400, field: 'email', message: 'Định dạng email không hợp lệ.' };
  }
  if (!identityNo) {
    throw { status: 400, field: 'identity_no', message: 'Vui lòng nhập số CCCD/CMND.' };
  }
  if (!TAX_CODE_PATTERN.test(taxCode)) {
    throw { status: 400, field: 'tax_code', message: 'Mã số thuế phải gồm 10 đến 13 chữ số.' };
  }

  // 2. Chạy đồng thời các truy vấn kiểm tra trùng lặp để tối ưu hiệu năng
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

/**
 * Đăng ký tài khoản Đối tác doanh nghiệp mới với cơ chế giao dịch (Transaction) an toàn.
 * 
 * @description
 * Quy trình xử lý:
 * 1. Validate mã số thuế và bắt đầu tiêu thụ mã OTP challenge (`beginOtpConsumption`).
 * 2. Kiểm tra lại trùng lặp email, CCCD/CMND và mã số thuế.
 * 3. Băm mật khẩu bằng thuật toán bcrypt (cost factor = 10).
 * 4. Mở Database Transaction:
 *    - Tạo người dùng trong bảng `users` với vai trò `PARTNER`.
 *    - Tạo hồ sơ đối tác trong bảng `partners` (trạng thái `INACTIVE`).
 *    - Tạo yêu cầu phê duyệt trong bảng `partner_approval_requests` (trạng thái `PENDING`).
 * 5. Commit Transaction, hoàn tất OTP challenge (`completeOtpConsumption`) và trả về thông tin user.
 * 6. Rollback nếu có lỗi xảy ra và nhả lại OTP challenge (`releaseOtpConsumption`).
 * 
 * @param input Thông tin đăng ký đối tác
 * @returns Thông tin tài khoản người dùng vừa tạo
 */
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

  // Khóa tiêu thụ OTP challenge để chống việc dùng lại một challenge cho nhiều request
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

    // 4. Hash mật khẩu người dùng
    const password_hash = await bcrypt.hash(password, 10);

    // 5. Mở transaction để tạo dữ liệu đối tác toàn vẹn
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 5.1 Tạo bản ghi trong bảng users (role: PARTNER)
      const userResult = await client.query(
        `INSERT INTO users (full_name, email, phone, identity_no, password_hash, role)
         VALUES ($1, $2, $3, $4, $5, 'PARTNER')
         RETURNING user_id, full_name, email, phone, identity_no, role, status, created_at`,
        [full_name, email, phone, identity_no, password_hash]
      );
      const user = userResult.rows[0];

      // 5.2 Tạo bản ghi partner (mặc định INACTIVE khi chưa được Admin duyệt)
      await client.query(
        `INSERT INTO partners (user_id, business_name, tax_code, activity_status)
         VALUES ($1, $2, $3, 'INACTIVE')`,
        [user.user_id, business_name, tax_code]
      );

      // 5.3 Tạo yêu cầu phê duyệt đối tác mới (trạng thái PENDING)
      await client.query(
        `INSERT INTO partner_approval_requests (partner_id, approval_status)
         VALUES ($1, 'PENDING')`,
        [user.user_id]
      );

      // Hoàn tất transaction
      await client.query('COMMIT');
      completeOtpConsumption(email, otp_challenge_id);
      return user;
    } catch (err) {
      await client.query('ROLLBACK');
      const databaseError = err as { code?: string; constraint?: string };
      // Xử lý các lỗi vi phạm ràng buộc duy nhất (Unique Constraint Violation: 23505)
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
    // Nhả lại trạng thái challenge OTP nếu quá trình đăng ký gặp lỗi
    releaseOtpConsumption(email, otp_challenge_id);
    throw err;
  }
};

/**
 * Đăng nhập dành cho Đối tác (PARTNER) và Nhân viên chi nhánh đối tác (PARTNER_EMPLOYEE).
 * 
 * @description
 * Quy trình xử lý:
 * 1. Truy vấn thông tin tài khoản người dùng kèm theo:
 *    - Nếu là PARTNER: thông tin doanh nghiệp, trạng thái phê duyệt từ `partner_approval_requests`.
 *    - Nếu là PARTNER_EMPLOYEE: thông tin chi nhánh công tác, doanh nghiệp chủ quản, và trạng thái phê duyệt từ `partner_employee_approval_requests`.
 * 2. So sánh mật khẩu băm bcrypt.
 * 3. Kiểm tra điều kiện phê duyệt và hoạt động:
 *    - Nhân viên phải được gán vào chi nhánh đang ACTIVE.
 *    - Tài khoản không được ở trạng thái PENDING hoặc REJECTED.
 *    - Tài khoản không bị khóa (LOCKED).
 * 4. Phát hành JWT token có chứa user id, role và email.
 * 5. Cập nhật thời điểm đăng nhập gần nhất (`last_login_at`).
 * 
 * @param input Thông tin đăng nhập { email, password }
 * @returns Token xác thực JWT và thông tin người dùng / chi nhánh
 */
export const login = async (input: LoginInput) => {
  const email = input.email.trim().toLowerCase();
  const { password } = input;

  // 1. Tìm user theo email với role PARTNER hoặc PARTNER_EMPLOYEE
  const userResult = await pool.query(
    `SELECT u.user_id, u.full_name, u.email, u.phone, u.password_hash, u.role, u.status,
            CASE WHEN u.role = 'PARTNER_EMPLOYEE' THEN ep_partner.business_name ELSE p.business_name END AS business_name,
            CASE 
              WHEN u.role = 'PARTNER_EMPLOYEE' THEN 
                CASE 
                  WHEN emp_pear.approval_status = 'REJECTED' THEN 'REJECTED'
                  WHEN emp_pear.approval_status = 'PENDING' THEN 'PENDING'
                  WHEN COALESCE(ep_par.approval_status, 'APPROVED') <> 'APPROVED' THEN ep_par.approval_status
                  ELSE 'APPROVED'
                END
              ELSE COALESCE(par.approval_status, 'PENDING') 
            END AS approval_status,
            CASE WHEN u.role = 'PARTNER_EMPLOYEE' THEN ep_partner.activity_status ELSE p.activity_status END AS activity_status,
            b.branch_id, b.branch_name, b.address as branch_address, b.status as branch_status
     FROM users u
     LEFT JOIN partners p ON u.user_id = p.user_id
     LEFT JOIN LATERAL (
       SELECT approval_status
       FROM partner_approval_requests
       WHERE partner_id = p.user_id
       ORDER BY submitted_at DESC, approval_request_id DESC
       LIMIT 1
     ) par ON TRUE
     LEFT JOIN partner_employees pe ON u.user_id = pe.user_id
     LEFT JOIN LATERAL (
       SELECT approval_status
       FROM partner_employee_approval_requests
       WHERE user_id = u.user_id
       ORDER BY submitted_at DESC, approval_request_id DESC
       LIMIT 1
     ) emp_pear ON TRUE
     LEFT JOIN branches b ON pe.branch_id = b.branch_id
     LEFT JOIN partners ep_partner ON b.partner_id = ep_partner.user_id
     LEFT JOIN LATERAL (
       SELECT approval_status
       FROM partner_approval_requests
       WHERE partner_id = ep_partner.user_id
       ORDER BY submitted_at DESC, approval_request_id DESC
       LIMIT 1
     ) ep_par ON TRUE
     WHERE u.email = $1 AND u.role IN ('PARTNER', 'PARTNER_EMPLOYEE')`,
    [email]
  );

  if (userResult.rows.length === 0) {
    throw { status: 401, message: 'Email hoặc mật khẩu không đúng.' };
  }

  const user = userResult.rows[0];

  // 2. Verify mật khẩu bcrypt
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw { status: 401, message: 'Email hoặc mật khẩu không đúng.' };
  }

  // 3. Kiểm tra tính hợp lệ của chi nhánh đối với Nhân viên
  if (user.role === 'PARTNER_EMPLOYEE') {
    if (!user.branch_id) {
      throw { status: 403, message: 'Nhân viên chưa được gán vào chi nhánh nào.' };
    }
    if (user.branch_status !== 'ACTIVE') {
      throw { status: 403, message: 'Chi nhánh được phân công đã bị vô hiệu hóa.' };
    }
  }

  // 4. Kiểm tra trạng thái phê duyệt của tài khoản
  if (user.approval_status === 'PENDING') {
    throw { status: 403, message: 'Tài khoản đang chờ được Admin phê duyệt.' };
  }
  if (user.approval_status === 'REJECTED') {
    throw { status: 403, message: 'Tài khoản đã bị từ chối. Vui lòng liên hệ hỗ trợ.' };
  }

  // 5. Kiểm tra tài khoản có bị khóa không
  if (user.status === 'LOCKED' || user.activity_status === 'LOCKED') {
    throw { status: 403, message: 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.' };
  }

  // 6. Phát hành JWT token
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET chưa được cấu hình');

  const jwtOptions = { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' } as SignOptions;
  const token = jwt.sign(
    { id: Number(user.user_id), role: user.role, email: user.email },
    secret,
    jwtOptions
  );

  // 7. Cập nhật thời điểm đăng nhập gần nhất
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
      branch: user.branch_id ? {
        id: Number(user.branch_id),
        name: user.branch_name,
        address: user.branch_address,
      } : undefined,
    },
  };
};
