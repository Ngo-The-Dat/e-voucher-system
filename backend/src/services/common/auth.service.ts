import pool from '../../config/db.js';
import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';

export interface UnifiedLoginInput {
  email: string;
  password: string;
}

export const unifiedLogin = async (input: UnifiedLoginInput) => {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email || !password) {
    throw { status: 400, message: 'Vui lòng nhập email và mật khẩu.' };
  }

  // 1. Tìm user theo email (không phân biệt role)
  const userResult = await pool.query(
    `SELECT user_id, full_name, email, phone, password_hash, role, status
     FROM users
     WHERE email = $1`,
    [email]
  );

  if (userResult.rows.length === 0) {
    throw { status: 401, message: 'Email hoặc mật khẩu không chính xác.' };
  }

  const user = userResult.rows[0];

  // 2. Trạng thái hoạt động chung của user
  if (user.status === 'LOCKED') {
    throw { status: 403, message: 'Tài khoản của bạn hiện đã bị khóa.' };
  }

  // 3. Verify mật khẩu
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw { status: 401, message: 'Email hoặc mật khẩu không chính xác.' };
  }

  // 4. Kiểm tra thêm thông tin phụ trợ nếu là PARTNER
  let business_name: string | undefined;
  let approval_status: string | undefined;

  if (user.role === 'PARTNER') {
    const partnerResult = await pool.query(
      `SELECT business_name, approval_status, activity_status
       FROM partners
       WHERE user_id = $1`,
      [user.user_id]
    );

    if (partnerResult.rows.length > 0) {
      const partner = partnerResult.rows[0];
      const { business_name: bName, approval_status: aStatus } = partner;
      business_name = bName;
      approval_status = aStatus;

      if (aStatus === 'PENDING') {
        throw { status: 403, message: 'Tài khoản đang chờ được Admin phê duyệt.' };
      }
      if (aStatus === 'REJECTED') {
        throw { status: 403, message: 'Tài khoản đã bị từ chối phê duyệt.' };
      }
      if (partner.activity_status === 'LOCKED') {
        throw { status: 403, message: 'Tài khoản Đối tác đã bị khóa. Vui lòng liên hệ hỗ trợ.' };
      }
    }
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
  await pool.query('UPDATE users SET last_login_at = NOW() WHERE user_id = $1', [user.user_id]);

  // Trả về thông tin user đã format
  return {
    token,
    user: {
      id: Number(user.user_id),
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      ...(business_name ? { business_name } : {}),
      ...(approval_status ? { approval_status } : {}),
    },
  };
};
