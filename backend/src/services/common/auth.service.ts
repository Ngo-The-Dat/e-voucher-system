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

  // 1. Tìm user theo email (không phân biệt role, lấy kèm thông tin phụ nếu có)
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
     WHERE u.email = $1`,
    [email]
  );

  if (userResult.rows.length === 0) {
    throw { status: 401, message: 'Email hoặc mật khẩu không chính xác.' };
  }

  const user = userResult.rows[0];

  // 2. Verify mật khẩu
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw { status: 401, message: 'Email hoặc mật khẩu không chính xác.' };
  }

  // 3. Trạng thái hoạt động chung của user
  if (user.status === 'LOCKED' || user.activity_status === 'LOCKED') {
    throw { status: 403, message: 'Tài khoản của bạn hiện đã bị khóa.' };
  }

  // 4. Kiểm tra thêm thông tin phụ trợ
  if (user.role === 'PARTNER_EMPLOYEE') {
    if (!user.branch_id) {
      throw { status: 403, message: 'Nhân viên chưa được gán vào chi nhánh nào.' };
    }
    if (user.branch_status !== 'ACTIVE') {
      throw { status: 403, message: 'Chi nhánh được phân công đã bị vô hiệu hóa.' };
    }
  }

  if (['PARTNER', 'PARTNER_EMPLOYEE'].includes(user.role)) {
    if (user.approval_status === 'PENDING') {
      throw { status: 403, message: 'Tài khoản đang chờ được Admin phê duyệt.' };
    }
    if (user.approval_status === 'REJECTED') {
      throw { status: 403, message: 'Tài khoản đã bị từ chối phê duyệt.' };
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
      ...(user.business_name ? { business_name: user.business_name } : {}),
      ...(user.approval_status ? { approval_status: user.approval_status } : {}),
      ...(user.branch_id ? { 
        branch: {
          id: Number(user.branch_id),
          name: user.branch_name,
          address: user.branch_address
        }
      } : {}),
    },
  };
};
