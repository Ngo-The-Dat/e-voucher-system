/**
 * @file profile.service.ts
 * @description Service xử lý nghiệp vụ truy xuất và cập nhật hồ sơ doanh nghiệp Đối tác (Partner Profile):
 * kết hợp dữ liệu cá nhân từ bảng `users`, dữ liệu pháp lý & thương hiệu từ bảng `partners`,
 * và trạng thái phê duyệt mới nhất từ bảng `partner_approval_requests`.
 */

import pool from '../../config/db.js';
import bcrypt from 'bcrypt';

// ─── Types & Interfaces ───────────────────────────────────────────────────────

/** Dữ liệu cập nhật hồ sơ đối tác */
interface UpdateProfileInput {
  full_name?: string;            // Họ tên người đại diện
  phone?: string;                // Số điện thoại liên hệ
  identity_no?: string;          // Số CCCD/CMND người đại diện
  gender?: string;               // Giới tính (MALE | FEMALE | OTHER)
  nationality?: string;          // Quốc tịch
  business_name?: string;        // Tên doanh nghiệp / thương hiệu
  // Thông tin pháp lý doanh nghiệp
  business_license_no?: string;  // Số giấy phép kinh doanh
  license_issue_date?: string;   // Ngày cấp GPKD (YYYY-MM-DD)
  license_issue_place?: string;  // Nơi cấp GPKD
  // Chức danh và nhận diện thương hiệu
  representative_title?: string; // Chức danh người đại diện (VD: Giám đốc, Đại diện pháp luật)
  brand_logo?: string | null;    // URL ảnh logo thương hiệu
}

// ─── Service Methods ──────────────────────────────────────────────────────────

/**
 * Lấy toàn bộ thông tin chi tiết hồ sơ của đối tác.
 * 
 * @description
 * Thực hiện phép JOIN giữa `users` và `partners`, đồng thời sử dụng `LEFT JOIN LATERAL`
 * để lấy bản ghi phê duyệt mới nhất (`partner_approval_requests`) của đối tác.
 * 
 * @param partnerId User ID của đối tác
 * @returns Đối tượng chứa đầy đủ thông tin hồ sơ
 * @throws {Object} Lỗi HTTP 404 nếu không tìm thấy dữ liệu đối tác
 */
export const getProfile = async (partnerId: number) => {
  const result = await pool.query(
    `SELECT
       u.user_id, u.full_name, u.email, u.phone, u.gender, u.identity_no,
       u.nationality, u.status, u.created_at, u.last_login_at,
       p.business_name, p.tax_code, COALESCE(par.approval_status, 'PENDING') as approval_status, p.activity_status, p.registered_at,
       p.business_license_no, p.license_issue_date, p.license_issue_place,
       p.representative_title, p.brand_logo
     FROM users u
     JOIN partners p ON u.user_id = p.user_id
     LEFT JOIN LATERAL (
       SELECT approval_status
       FROM partner_approval_requests
       WHERE partner_id = p.user_id
       ORDER BY submitted_at DESC, approval_request_id DESC
       LIMIT 1
     ) par ON TRUE
     WHERE u.user_id = $1`,
    [partnerId]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy thông tin đối tác.' };
  }

  return result.rows[0];
};

/**
 * Cập nhật thông tin hồ sơ đối tác với giao dịch Transaction an toàn.
 * 
 * @description
 * - Cập nhật thông tin đại diện trong bảng `users` (dùng hàm COALESCE để giữ nguyên các giá trị không đổi).
 * - Cập nhật thông tin doanh nghiệp & pháp lý trong bảng `partners`.
 * - Bắt lỗi vi phạm ràng buộc Unique 23505 (nếu SĐT hoặc CCCD đã được tài khoản khác sử dụng).
 * 
 * @param partnerId User ID của đối tác
 * @param input Các trường cần cập nhật
 * @returns Hồ sơ đối tác sau khi cập nhật thành công
 */
export const updateProfile = async (partnerId: number, input: UpdateProfileInput) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Cập nhật thông tin người đại diện ở bảng users
    if (input.full_name !== undefined || input.phone !== undefined ||
        input.identity_no !== undefined || input.gender !== undefined ||
        input.nationality !== undefined) {
      await client.query(
        `UPDATE users SET
           full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           identity_no = COALESCE($3, identity_no),
           gender = COALESCE($4, gender),
           nationality = COALESCE($5, nationality)
         WHERE user_id = $6`,
        [input.full_name, input.phone, input.identity_no, input.gender, input.nationality, partnerId]
      );
    }

    // 2. Cập nhật thông tin doanh nghiệp và pháp lý ở bảng partners
    await client.query(
      `UPDATE partners SET
         business_name = COALESCE($1, business_name),
         business_license_no = COALESCE($2, business_license_no),
         license_issue_date = COALESCE($3, license_issue_date),
         license_issue_place = COALESCE($4, license_issue_place),
         representative_title = COALESCE($5, representative_title),
         brand_logo = CASE WHEN $6::boolean THEN $7 ELSE brand_logo END
       WHERE user_id = $8`,
      [
        input.business_name,
        input.business_license_no,
        input.license_issue_date,
        input.license_issue_place,
        input.representative_title,
        input.brand_logo !== undefined,
        input.brand_logo ?? null,
        partnerId,
      ]
    );

    await client.query('COMMIT');
    return getProfile(partnerId);
  } catch (err) {
    await client.query('ROLLBACK');
    if ((err as { code?: string }).code === '23505') {
      throw { status: 409, message: 'Số điện thoại hoặc CCCD/CMND đã được sử dụng.' };
    }
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Thay đổi mật khẩu đăng nhập cho tài khoản Đối tác.
 * 
 * @param partnerId User ID của đối tác
 * @param old_password Mật khẩu cũ
 * @param new_password Mật khẩu mới (từ 8 đến 128 ký tự)
 * @throws {Object} Lỗi HTTP 400 nếu mật khẩu cũ không đúng
 */
export const changePassword = async (
  partnerId: number,
  old_password: string,
  new_password: string
) => {
  // 1. Lấy mật khẩu hash hiện tại trong database
  const result = await pool.query(
    'SELECT password_hash FROM users WHERE user_id = $1',
    [partnerId]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy người dùng.' };
  }

  // 2. So sánh mật khẩu cũ bằng bcrypt
  const isValid = await bcrypt.compare(old_password, result.rows[0].password_hash);
  if (!isValid) {
    throw { status: 400, message: 'Mật khẩu cũ không đúng.' };
  }

  // 3. Băm mật khẩu mới và lưu vào database
  const new_hash = await bcrypt.hash(new_password, 10);
  await pool.query(
    'UPDATE users SET password_hash = $1 WHERE user_id = $2',
    [new_hash, partnerId]
  );
};
