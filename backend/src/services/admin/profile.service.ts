/**
 * @file profile.service.ts
 * @description Service xử lý nghiệp vụ hồ sơ cá nhân và đổi mật khẩu của Quản trị viên (Admin):
 * tra cứu thông tin tài khoản, cập nhật thông tin cá nhân và thay đổi mật khẩu đăng nhập với bcrypt.
 */

import pool from '../../config/db.js';
import bcrypt from 'bcrypt';

// ─── Types & Interfaces ───────────────────────────────────────────────────────

/** Dữ liệu đầu vào khi Quản trị viên tự cập nhật thông tin cá nhân */
export interface UpdateAdminProfileInput {
  full_name?: string;
  phone?: string;
  gender?: string;
  nationality?: string;
  identity_no?: string;
}

// ─── Service Methods ──────────────────────────────────────────────────────────

/**
 * Lấy toàn bộ thông tin chi tiết hồ sơ của Quản trị viên đang đăng nhập.
 * 
 * @param userId User ID của admin (role = 'ADMIN')
 * @returns Đối tượng thông tin hồ sơ admin
 * @throws {Object} Lỗi HTTP 404 nếu không tìm thấy người dùng
 */
export const getAdminProfile = async (userId: number) => {
  const result = await pool.query(
    `SELECT
       user_id, full_name, email, phone, gender, identity_no,
       nationality, status, role, created_at, last_login_at
     FROM users
     WHERE user_id = $1 AND role = 'ADMIN'`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy thông tin tài khoản Quản trị viên.' };
  }

  const row = result.rows[0];
  return {
    user_id: Number(row.user_id),
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    gender: row.gender,
    identity_no: row.identity_no,
    nationality: row.nationality,
    status: row.status,
    role: row.role,
    created_at: row.created_at,
    last_login_at: row.last_login_at,
  };
};

/**
 * Cập nhật thông tin cá nhân của Quản trị viên vào cơ sở dữ liệu.
 * 
 * @param userId User ID admin
 * @param input Các thông tin cần thay đổi (họ tên, SĐT, giới tính, quốc tịch, CCCD)
 * @returns Hồ sơ admin sau khi cập nhật
 */
export const updateAdminProfile = async (userId: number, input: UpdateAdminProfileInput) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE users SET
         full_name = COALESCE($1, full_name),
         phone = COALESCE($2, phone),
         gender = COALESCE($3, gender),
         nationality = COALESCE($4, nationality),
         identity_no = COALESCE($5, identity_no)
       WHERE user_id = $6 AND role = 'ADMIN'`,
      [
        input.full_name !== undefined ? input.full_name.trim() || null : null,
        input.phone !== undefined ? input.phone.trim() || null : null,
        input.gender !== undefined ? input.gender.trim() || null : null,
        input.nationality !== undefined ? input.nationality.trim() || null : null,
        input.identity_no !== undefined ? input.identity_no.trim() || null : null,
        userId,
      ]
    );

    await client.query('COMMIT');
    return getAdminProfile(userId);
  } catch (err) {
    await client.query('ROLLBACK');
    if ((err as { code?: string }).code === '23505') {
      throw { status: 409, message: 'Số điện thoại hoặc CCCD này đã được sử dụng.' };
    }
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Đổi mật khẩu tài khoản Quản trị viên.
 * 
 * @param userId User ID admin
 * @param old_password Mật khẩu cũ hiện tại
 * @param new_password Mật khẩu mới (8-128 ký tự)
 */
export const changeAdminPassword = async (
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
    `SELECT password_hash FROM users WHERE user_id = $1 AND role = 'ADMIN'`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy tài khoản Quản trị viên.' };
  }

  const isValid = await bcrypt.compare(old_password, result.rows[0].password_hash);
  if (!isValid) {
    throw { status: 400, message: 'Mật khẩu hiện tại không chính xác.' };
  }

  const new_hash = await bcrypt.hash(new_password, 10);
  await pool.query(
    'UPDATE users SET password_hash = $1 WHERE user_id = $2 AND role = $3',
    [new_hash, userId, 'ADMIN']
  );
};
