import pool from '../../config/db.js';
import bcrypt from 'bcrypt';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UpdateProfileInput {
  full_name?: string;
  phone?: string;
  gender?: string;
  nationality?: string;
  business_name?: string;
  // Thông tin pháp lý
  business_license_no?: string;
  license_issue_date?: string;
  license_issue_place?: string;
  // Thông tin người đại diện
  representative_full_name?: string;
  representative_title?: string;
  representative_identity_no?: string;
  representative_phone?: string;
  representative_email?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const getProfile = async (partnerId: number) => {
  const result = await pool.query(
    `SELECT
       u.user_id, u.full_name, u.email, u.phone, u.gender, u.identity_no,
       u.nationality, u.status, u.created_at, u.last_login_at,
       p.business_name, p.tax_code, p.approval_status, p.activity_status, p.registered_at,
       p.business_license_no, p.license_issue_date, p.license_issue_place,
       p.representative_full_name, p.representative_title,
       p.representative_identity_no, p.representative_phone, p.representative_email
     FROM users u
     JOIN partners p ON u.user_id = p.user_id
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
    if (input.full_name || input.phone || input.gender || input.nationality) {
      await client.query(
        `UPDATE users SET
           full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           gender = COALESCE($3, gender),
           nationality = COALESCE($4, nationality)
         WHERE user_id = $5`,
        [input.full_name, input.phone, input.gender, input.nationality, partnerId]
      );
    }

    // Cập nhật bảng partners
    await client.query(
      `UPDATE partners SET
         business_name = COALESCE($1, business_name),
         business_license_no = COALESCE($2, business_license_no),
         license_issue_date = COALESCE($3, license_issue_date),
         license_issue_place = COALESCE($4, license_issue_place),
         representative_full_name = COALESCE($5, representative_full_name),
         representative_title = COALESCE($6, representative_title),
         representative_identity_no = COALESCE($7, representative_identity_no),
         representative_phone = COALESCE($8, representative_phone),
         representative_email = COALESCE($9, representative_email)
       WHERE user_id = $10`,
      [
        input.business_name,
        input.business_license_no,
        input.license_issue_date,
        input.license_issue_place,
        input.representative_full_name,
        input.representative_title,
        input.representative_identity_no,
        input.representative_phone,
        input.representative_email,
        partnerId,
      ]
    );

    await client.query('COMMIT');
    return getProfile(partnerId);
  } catch (err) {
    await client.query('ROLLBACK');
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
