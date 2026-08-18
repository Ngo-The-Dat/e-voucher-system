/**
 * @file employee.service.ts
 * @description Service xử lý nghiệp vụ thông tin cá nhân của Nhân viên chi nhánh đối tác (Partner Employee):
 * tra cứu hồ sơ kèm thông tin chi nhánh và đối tác chủ quản, cập nhật thông tin cá nhân,
 * và thay đổi mật khẩu đăng nhập với bcrypt.
 */

import pool from '../../config/db.js';
import bcrypt from 'bcrypt';

// ─── Types & Interfaces ───────────────────────────────────────────────────────

/** Dữ liệu đầu vào khi nhân viên tự cập nhật thông tin cá nhân */
export interface UpdateEmployeeProfileInput {
  full_name?: string;
  phone?: string;
  gender?: string;
  nationality?: string;
}

// ─── Service Methods ──────────────────────────────────────────────────────────

/**
 * Lấy toàn bộ thông tin chi tiết hồ sơ của nhân viên chi nhánh.
 * 
 * @description
 * Thực hiện phép JOIN qua 4 bảng:
 * `users` (u) -> `partner_employees` (pe) -> `branches` (b) -> `partners` (p).
 * 
 * @param userId User ID của nhân viên (role = 'PARTNER_EMPLOYEE')
 * @returns Đối tượng thông tin hồ sơ kèm branch và partner
 * @throws {Object} Lỗi HTTP 404 nếu không tìm thấy nhân viên
 */
export const getEmployeeProfile = async (userId: number) => {
  const result = await pool.query(
    `SELECT
       u.user_id, u.full_name, u.email, u.phone, u.gender, u.identity_no,
       u.nationality, u.status, u.created_at, u.last_login_at,
       b.branch_id, b.branch_name, b.address AS branch_address, b.phone AS branch_phone,
       b.region AS branch_region, b.status AS branch_status,
       p.user_id AS partner_id, p.business_name AS partner_business_name, p.brand_logo AS partner_brand_logo
     FROM users u
     JOIN partner_employees pe ON u.user_id = pe.user_id
     JOIN branches b ON pe.branch_id = b.branch_id
     JOIN partners p ON b.partner_id = p.user_id
     WHERE u.user_id = $1 AND u.role = 'PARTNER_EMPLOYEE'`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy thông tin nhân viên đối tác.' };
  }

  const row = result.rows[0];
  return {
    id: Number(row.user_id),
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    gender: row.gender,
    identity_no: row.identity_no,
    nationality: row.nationality,
    status: row.status,
    created_at: row.created_at,
    last_login_at: row.last_login_at,
    branch: {
      id: Number(row.branch_id),
      name: row.branch_name,
      address: row.branch_address,
      phone: row.branch_phone,
      region: row.branch_region,
      status: row.branch_status,
    },
    partner: {
      id: Number(row.partner_id),
      business_name: row.partner_business_name,
      brand_logo: row.partner_brand_logo,
    },
  };
};

/**
 * Cập nhật thông tin cá nhân của nhân viên đối tác (có Transaction).
 * 
 * @param userId User ID nhân viên
 * @param input Các thông tin cần thay đổi (họ tên, SĐT, giới tính, quốc tịch)
 * @returns Hồ sơ nhân viên sau cập nhật
 */
export const updateEmployeeProfile = async (userId: number, input: UpdateEmployeeProfileInput) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE users SET
         full_name = COALESCE($1, full_name),
         phone = COALESCE($2, phone),
         gender = COALESCE($3, gender),
         nationality = COALESCE($4, nationality)
       WHERE user_id = $5 AND role = 'PARTNER_EMPLOYEE'`,
      [
        input.full_name !== undefined ? input.full_name.trim() || null : null,
        input.phone !== undefined ? input.phone.trim() || null : null,
        input.gender !== undefined ? input.gender.trim() || null : null,
        input.nationality !== undefined ? input.nationality.trim() || null : null,
        userId,
      ]
    );

    await client.query('COMMIT');
    return getEmployeeProfile(userId);
  } catch (err) {
    await client.query('ROLLBACK');
    if ((err as { code?: string }).code === '23505') {
      throw { status: 409, message: 'Số điện thoại này đã được sử dụng.' };
    }
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Đổi mật khẩu tài khoản cho Nhân viên đối tác.
 * 
 * @param userId User ID nhân viên
 * @param old_password Mật khẩu cũ
 * @param new_password Mật khẩu mới (8-128 ký tự)
 */
export const changeEmployeePassword = async (
  userId: number,
  old_password: string,
  new_password: string
) => {
  if (!old_password || !new_password) {
    throw { status: 400, message: 'Vui lòng nhập mật khẩu cũ và mật khẩu mới.' };
  }

  if (new_password.length < 8 || new_password.length > 128) {
    throw { status: 400, message: 'Mật khẩu mới phải có từ 8 đến 128 ký tự.' };
  }

  const result = await pool.query(
    `SELECT password_hash FROM users WHERE user_id = $1 AND role = 'PARTNER_EMPLOYEE'`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy người dùng.' };
  }

  const isValid = await bcrypt.compare(old_password, result.rows[0].password_hash);
  if (!isValid) {
    throw { status: 400, message: 'Mật khẩu cũ không chính xác.' };
  }

  const new_hash = await bcrypt.hash(new_password, 10);
  await pool.query(
    'UPDATE users SET password_hash = $1 WHERE user_id = $2',
    [new_hash, userId]
  );
};
