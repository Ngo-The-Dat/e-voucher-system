import pool from '../../config/db.js';
import bcrypt from 'bcrypt';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UpdateProfileInput {
  full_name?: string;
  phone?: string;
  identity_no?: string;
  gender?: string;
  nationality?: string;
  business_name?: string;
  // Thông tin pháp lý
  business_license_no?: string;
  license_issue_date?: string;
  license_issue_place?: string;
  // Chức danh người đại diện; thông tin định danh dùng từ users
  representative_title?: string;
  brand_logo?: string | null;
}

// ─── Service ──────────────────────────────────────────────────────────────────

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

export const updateProfile = async (partnerId: number, input: UpdateProfileInput) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Cập nhật bảng users
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

    // Cập nhật bảng partners
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

export const changePassword = async (
  partnerId: number,
  old_password: string,
  new_password: string
) => {
  // Lấy hash hiện tại
  const result = await pool.query(
    'SELECT password_hash FROM users WHERE user_id = $1',
    [partnerId]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy người dùng.' };
  }

  const isValid = await bcrypt.compare(old_password, result.rows[0].password_hash);
  if (!isValid) {
    throw { status: 400, message: 'Mật khẩu cũ không đúng.' };
  }

  const new_hash = await bcrypt.hash(new_password, 10);
  await pool.query(
    'UPDATE users SET password_hash = $1 WHERE user_id = $2',
    [new_hash, partnerId]
  );
};
