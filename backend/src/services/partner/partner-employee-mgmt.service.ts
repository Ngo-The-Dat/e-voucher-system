/**
 * @file partner-employee-mgmt.service.ts
 * @description Service xử lý nghiệp vụ quản lý nhân viên chi nhánh do Đối tác (Partner) thao tác:
 * - Lấy danh sách nhân viên thuộc các chi nhánh của đối tác kèm trạng thái phê duyệt từ Admin.
 * - Tạo tài khoản nhân viên mới: kiểm tra chi nhánh, kiểm tra trùng lặp email/SĐT/CCCD,
 *   băm mật khẩu, tạo user với role `PARTNER_EMPLOYEE`, gán `partner_employees`, và gửi yêu cầu duyệt `partner_employee_approval_requests` (`PENDING`).
 * - Cập nhật thông tin nhân viên hoặc chuyển chi nhánh công tác.
 */

import pool from '../../config/db.js';
import bcrypt from 'bcrypt';

// ─── Types & Interfaces ───────────────────────────────────────────────────────

/** Dữ liệu đầu vào khi Đối tác tạo tài khoản nhân viên mới */
export interface CreateEmployeeInput {
  full_name: string;      // Họ và tên nhân viên
  email: string;          // Email đăng nhập
  phone?: string;         // Số điện thoại liên hệ
  identity_no?: string;   // Số CCCD/CMND
  gender?: string;        // Giới tính (MALE | FEMALE | OTHER)
  nationality?: string;   // Quốc tịch
  password: string;       // Mật khẩu khởi tạo
  branch_id: number;      // ID chi nhánh làm việc được chỉ định
}

/** Dữ liệu cập nhật nhân viên chi nhánh */
export interface UpdateEmployeeInput {
  full_name?: string;
  phone?: string;
  identity_no?: string;
  gender?: string;
  nationality?: string;
  branch_id?: number;     // Điều chuyển sang chi nhánh mới
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Service Methods ──────────────────────────────────────────────────────────

/**
 * Lấy danh sách nhân viên làm việc tại tất cả các chi nhánh của đối tác.
 * 
 * @description
 * Sử dụng `LEFT JOIN LATERAL` để lấy bản ghi phê duyệt mới nhất từ bảng `partner_employee_approval_requests`.
 * 
 * @param partnerId User ID của đối tác chủ quản
 * @returns Danh sách nhân viên kèm chi nhánh và trạng thái duyệt
 */
export const getEmployees = async (partnerId: number) => {
  const result = await pool.query(
    `SELECT
       u.user_id, u.full_name, u.email, u.phone, u.gender, u.identity_no,
       u.nationality, u.status, u.created_at, u.last_login_at,
       COALESCE(pear.approval_status, 'APPROVED') AS approval_status,
       pear.admin_feedback,
       b.branch_id, b.branch_name, b.address AS branch_address, b.status AS branch_status
     FROM users u
     JOIN partner_employees pe ON u.user_id = pe.user_id
     JOIN branches b ON pe.branch_id = b.branch_id
     LEFT JOIN LATERAL (
       SELECT approval_status, admin_feedback
       FROM partner_employee_approval_requests
       WHERE user_id = u.user_id
       ORDER BY submitted_at DESC, approval_request_id DESC
       LIMIT 1
     ) pear ON TRUE
     WHERE b.partner_id = $1 AND u.role = 'PARTNER_EMPLOYEE'
     ORDER BY u.created_at DESC`,
    [partnerId]
  );

  return result.rows.map((row) => ({
    id: Number(row.user_id),
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    gender: row.gender,
    identity_no: row.identity_no,
    nationality: row.nationality,
    status: row.status,
    approval_status: row.approval_status,
    admin_feedback: row.admin_feedback,
    created_at: row.created_at,
    last_login_at: row.last_login_at,
    branch: {
      id: Number(row.branch_id),
      name: row.branch_name,
      address: row.branch_address,
      status: row.branch_status,
    },
  }));
};

/**
 * Tạo mới nhân viên chi nhánh (kèm giao dịch Transaction).
 * 
 * @description
 * Quy trình thực hiện:
 * 1. Kiểm tra chi nhánh chỉ định (`branch_id`) có thuộc quyền quản lý của đối tác hay không.
 * 2. Kiểm tra tính duy nhất của Email, Số điện thoại và CCCD/CMND trên toàn hệ thống.
 * 3. Băm mật khẩu bằng thuật toán bcrypt.
 * 4. Mở Transaction:
 *    - Thêm tài khoản vào bảng `users` (role = 'PARTNER_EMPLOYEE', status = 'ACTIVE').
 *    - Gán nhân viên vào chi nhánh trong bảng `partner_employees`.
 *    - Tạo yêu cầu phê duyệt nhân viên trong `partner_employee_approval_requests` (approval_status = 'PENDING').
 * 5. Commit Transaction và trả về thông tin nhân viên vừa tạo.
 * 
 * @param partnerId User ID của đối tác
 * @param input Thông tin tạo nhân viên
 * @returns Bản ghi nhân viên vừa tạo
 */
export const createEmployee = async (partnerId: number, input: CreateEmployeeInput) => {
  const full_name = input.full_name?.trim();
  const email = input.email?.trim().toLowerCase();
  const phone = input.phone?.trim() || null;
  const identity_no = input.identity_no?.trim() || null;
  const gender = input.gender?.trim() || null;
  const nationality = input.nationality?.trim() || null;
  const password = input.password;
  const branch_id = Number(input.branch_id);

  if (!full_name || !email || !password || !branch_id) {
    throw { status: 400, message: 'Vui lòng điền đầy đủ họ tên, email, mật khẩu và chi nhánh làm việc.' };
  }

  if (!EMAIL_PATTERN.test(email)) {
    throw { status: 400, message: 'Định dạng email không hợp lệ.' };
  }

  if (password.length < 8 || password.length > 128) {
    throw { status: 400, message: 'Mật khẩu phải có từ 8 đến 128 ký tự.' };
  }

  // 1. Kiểm tra branch thuộc sở hữu của partner và đang ACTIVE
  const branchCheck = await pool.query(
    'SELECT branch_id, branch_name, status FROM branches WHERE branch_id = $1 AND partner_id = $2',
    [branch_id, partnerId]
  );
  if (branchCheck.rows.length === 0) {
    throw { status: 400, message: 'Chi nhánh không hợp lệ hoặc không thuộc quyền quản lý của bạn.' };
  }

  // 2. Kiểm tra email đã tồn tại chưa
  const emailCheck = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
  if (emailCheck.rows.length > 0) {
    throw { status: 409, message: 'Email này đã được sử dụng trong hệ thống.' };
  }

  // 3. Kiểm tra phone & CCCD nếu có
  if (phone) {
    const phoneCheck = await pool.query('SELECT user_id FROM users WHERE phone = $1', [phone]);
    if (phoneCheck.rows.length > 0) {
      throw { status: 409, message: 'Số điện thoại này đã được đăng ký.' };
    }
  }

  if (identity_no) {
    const cccdCheck = await pool.query('SELECT user_id FROM users WHERE identity_no = $1', [identity_no]);
    if (cccdCheck.rows.length > 0) {
      throw { status: 409, message: 'Số CCCD/CMND này đã được đăng ký trên hệ thống.' };
    }
  }

  const password_hash = await bcrypt.hash(password, 10);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 4.1 Tạo bản ghi người dùng role PARTNER_EMPLOYEE
    const userRes = await client.query(
      `INSERT INTO users (full_name, email, phone, identity_no, gender, nationality, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PARTNER_EMPLOYEE', 'ACTIVE')
       RETURNING user_id, full_name, email, phone, gender, identity_no, nationality, status, created_at`,
      [full_name, email, phone, identity_no, gender, nationality, password_hash]
    );
    const user = userRes.rows[0];

    // 4.2 Gán nhân viên vào chi nhánh chỉ định
    await client.query(
      `INSERT INTO partner_employees (user_id, branch_id) VALUES ($1, $2)`,
      [user.user_id, branch_id]
    );

    // 4.3 Tạo yêu cầu phê duyệt nhân viên chờ Admin xét duyệt
    await client.query(
      `INSERT INTO partner_employee_approval_requests (user_id, approval_status, submitted_at)
       VALUES ($1, 'PENDING', CURRENT_TIMESTAMP)`,
      [user.user_id]
    );

    await client.query('COMMIT');

    return {
      id: Number(user.user_id),
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      identity_no: user.identity_no,
      nationality: user.nationality,
      status: user.status,
      approval_status: 'PENDING',
      created_at: user.created_at,
      branch: {
        id: branch_id,
        name: branchCheck.rows[0].branch_name,
      },
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Cập nhật thông tin nhân viên hoặc chuyển chi nhánh làm việc.
 * 
 * @param partnerId User ID của đối tác chủ quản
 * @param employeeId User ID của nhân viên cần cập nhật
 * @param input Dữ liệu cập nhật
 * @returns { success: true, message: string }
 */
export const updateEmployee = async (
  partnerId: number,
  employeeId: number,
  input: UpdateEmployeeInput
) => {
  // 1. Kiểm tra employee có thuộc phạm vi chi nhánh của đối tác không
  const empCheck = await pool.query(
    `SELECT pe.user_id, pe.branch_id
     FROM partner_employees pe
     JOIN branches b ON pe.branch_id = b.branch_id
     WHERE pe.user_id = $1 AND b.partner_id = $2`,
    [employeeId, partnerId]
  );

  if (empCheck.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy nhân viên trong phạm vi quản lý của bạn.' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 2. Cập nhật thông tin cá nhân trong bảng users
    if (
      input.full_name !== undefined ||
      input.phone !== undefined ||
      input.identity_no !== undefined ||
      input.gender !== undefined ||
      input.nationality !== undefined
    ) {
      await client.query(
        `UPDATE users SET
           full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           identity_no = COALESCE($3, identity_no),
           gender = COALESCE($4, gender),
           nationality = COALESCE($5, nationality)
         WHERE user_id = $6`,
        [
          input.full_name?.trim() || null,
          input.phone?.trim() || null,
          input.identity_no?.trim() || null,
          input.gender?.trim() || null,
          input.nationality?.trim() || null,
          employeeId,
        ]
      );
    }

    // 3. Chuyển chi nhánh nếu có yêu cầu
    if (input.branch_id !== undefined && input.branch_id !== null) {
      const branch_id = Number(input.branch_id);
      const branchCheck = await client.query(
        'SELECT branch_id FROM branches WHERE branch_id = $1 AND partner_id = $2',
        [branch_id, partnerId]
      );
      if (branchCheck.rows.length === 0) {
        throw { status: 400, message: 'Chi nhánh mới không thuộc quản lý của bạn.' };
      }

      await client.query(
        'UPDATE partner_employees SET branch_id = $1 WHERE user_id = $2',
        [branch_id, employeeId]
      );
    }

    await client.query('COMMIT');
    return { success: true, message: 'Cập nhật nhân viên thành công.' };
  } catch (err) {
    await client.query('ROLLBACK');
    if ((err as { code?: string }).code === '23505') {
      throw { status: 409, message: 'Số điện thoại hoặc CCCD/CMND đã được đăng ký.' };
    }
    throw err;
  } finally {
    client.release();
  }
};
