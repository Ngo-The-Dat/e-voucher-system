/**
 * =========================================================================================
 * FILE: user.service.ts
 * VỊ TRÍ: backend/src/services/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Tầng Dịch vụ Nghiệp vụ (Business Logic Layer) quản trị Người dùng Toàn Hệ Thống (UC-ADM-01: Quản lý Người dùng).
 *   - Các chức năng chính:
 *       1. `getUsers`: Truy vấn danh sách người dùng (CUSTOMER, PARTNER, PARTNER_EMPLOYEE), lọc theo từ khóa, vai trò, trạng thái.
 *       2. `getUserById`: Lấy chi tiết hồ sơ người dùng (kèm lý do khóa trong user_locks và thông tin doanh nghiệp nếu có).
 *       3. `lockUser`: Khóa tài khoản người dùng, lưu lý do khóa vào bảng `user_locks (user_id, reason)` và ghi System Log.
 *       4. `unlockUser`: Mở khóa tài khoản người dùng (`status = 'ACTIVE'`), xóa bản ghi khóa trong `user_locks` và ghi System Log.
 *       5. `changeUserRole`: Thay đổi vai trò người dùng (CUSTOMER, PARTNER, ADMIN, PARTNER_EMPLOYEE) kèm ghi nhật ký.
 * =========================================================================================
 */

import pool from '../../config/db.js';
import { logAdminAction } from './system-log.service.js';

export interface GetUsersQuery {
  search?: string;  // Tìm kiếm theo Họ tên, Email, Số điện thoại
  role?: string;    // Vai trò: CUSTOMER, PARTNER, PARTNER_EMPLOYEE
  status?: string;  // Trạng thái: ACTIVE, LOCKED, INACTIVE
  page?: number;    // Trang hiện tại
  limit?: number;   // Số dòng trên 1 trang
}

export interface UserListItem {
  user_id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  gender: string | null;
  nationality: string | null;
  identity_no: string | null;
  created_at: string;
  last_login_at: string | null;
}

export interface UserDetail extends UserListItem {
  lock_reason: string | null;
  business_name?: string | null;
  tax_code?: string | null;
  branch_id?: number | null;
  branch_name?: string | null;
  branch_address?: string | null;
  branch_partner_id?: number | null;
}

export interface ChangeUserRoleInput {
  role: string;
  business_name?: string;
  tax_code?: string;
  branch_id?: number;
}

export interface ActiveBranchOption {
  branch_id: number;
  branch_name: string;
  address: string;
  partner_id: number;
  business_name: string;
}

/**
 * -----------------------------------------------------------------------------------------
 * HÀM: getActiveBranchesForAssignment
 * MỤC ĐÍCH: Lấy danh sách các chi nhánh đang hoạt động để Admin chọn khi phân quyền nhân viên.
 * -----------------------------------------------------------------------------------------
 */
export async function getActiveBranchesForAssignment(): Promise<ActiveBranchOption[]> {
  const sql = `
    SELECT 
      b.branch_id, 
      b.branch_name, 
      b.address, 
      p.user_id AS partner_id, 
      p.business_name
    FROM branches b
    JOIN partners p ON b.partner_id = p.user_id
    WHERE b.status = 'ACTIVE' AND p.activity_status = 'ACTIVE'
    ORDER BY p.business_name ASC, b.branch_name ASC
  `;
  const result = await pool.query(sql);
  return result.rows.map((r) => ({
    branch_id: Number(r.branch_id),
    branch_name: r.branch_name,
    address: r.address,
    partner_id: Number(r.partner_id),
    business_name: r.business_name,
  }));
}

/**
 * -----------------------------------------------------------------------------------------
 * HÀM: getUsers
 * MỤC ĐÍCH: Lấy danh sách người dùng có phân trang và bộ lọc linh hoạt.
 * -----------------------------------------------------------------------------------------
 */
export async function getUsers(query: GetUsersQuery) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  // Lọc theo từ khóa tìm kiếm (chỉ tìm theo họ tên hoặc email)
  if (query.search && query.search.trim()) {
    const searchPattern = `%${query.search.trim()}%`;
    conditions.push(`(full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
    params.push(searchPattern);
    paramIndex++;
  }

  // Lọc theo vai trò (chỉ hiển thị CUSTOMER, PARTNER và PARTNER_EMPLOYEE)
  if (query.role && (query.role.trim() === 'CUSTOMER' || query.role.trim() === 'PARTNER' || query.role.trim() === 'PARTNER_EMPLOYEE')) {
    conditions.push(`role = $${paramIndex}`);
    params.push(query.role.trim());
    paramIndex++;
  } else {
    conditions.push(`role IN ('CUSTOMER', 'PARTNER', 'PARTNER_EMPLOYEE')`);
  }

  // Lọc theo trạng thái tài khoản
  if (query.status && query.status.trim()) {
    conditions.push(`status = $${paramIndex}`);
    params.push(query.status.trim());
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 1. Đếm tổng số bản ghi
  const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`;
  const countResult = await pool.query(countSql, params);
  const total = Number(countResult.rows[0]?.total || 0);

  // 2. Lấy dữ liệu người dùng cho trang hiện tại
  const listSql = `
    SELECT user_id, full_name, email, phone, role, status, gender, nationality, identity_no, created_at, last_login_at
    FROM users
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  const listParams = [...params, limit, offset];
  const listResult = await pool.query(listSql, listParams);

  return {
    users: listResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * -----------------------------------------------------------------------------------------
 * HÀM: getUserById
 * MỤC ĐÍCH: Lấy chi tiết hồ sơ người dùng kèm lý do khóa (nếu có), thông tin doanh nghiệp và chi nhánh.
 * -----------------------------------------------------------------------------------------
 */
export async function getUserById(userId: number): Promise<UserDetail | null> {
  const sql = `
    SELECT 
      u.user_id, u.full_name, u.email, u.phone, u.role, u.status, 
      u.gender, u.nationality, u.identity_no, u.created_at, u.last_login_at,
      ul.reason as lock_reason,
      CASE 
        WHEN u.role = 'PARTNER_EMPLOYEE' THEN ep_partner.business_name 
        ELSE p.business_name 
      END AS business_name,
      CASE 
        WHEN u.role = 'PARTNER_EMPLOYEE' THEN ep_partner.tax_code 
        ELSE p.tax_code 
      END AS tax_code,
      pe.branch_id,
      b.branch_name,
      b.address AS branch_address,
      b.partner_id AS branch_partner_id
    FROM users u
    LEFT JOIN user_locks ul ON ul.user_id = u.user_id
    LEFT JOIN partners p ON p.user_id = u.user_id
    LEFT JOIN partner_employees pe ON pe.user_id = u.user_id
    LEFT JOIN branches b ON b.branch_id = pe.branch_id
    LEFT JOIN partners ep_partner ON ep_partner.user_id = b.partner_id
    WHERE u.user_id = $1
  `;
  const result = await pool.query(sql, [userId]);
  if (result.rows.length === 0) return null;
  return result.rows[0];
}

/**
 * -----------------------------------------------------------------------------------------
 * HÀM: lockUser
 * MỤC ĐÍCH: 
 *   Khóa tài khoản người dùng và lưu lý do vào bảng `user_locks`.
 *   Chạy trong Database Transaction để đảm bảo tính toàn vẹn và ghi System Log.
 * -----------------------------------------------------------------------------------------
 */
export async function lockUser(userId: number, reason: string, adminId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Kiểm tra người dùng tồn tại và khóa dòng (Pessimistic Locking FOR UPDATE)
    const userRes = await client.query('SELECT user_id, status FROM users WHERE user_id = $1 FOR UPDATE', [userId]);
    if (userRes.rows.length === 0) {
      throw new Error('Người dùng không tồn tại');
    }
    const oldStatus = userRes.rows[0].status;

    // Cập nhật trạng thái thành LOCKED
    await client.query("UPDATE users SET status = 'LOCKED' WHERE user_id = $1", [userId]);

    // Lưu hoặc cập nhật lý do khóa vào bảng user_locks
    await client.query(
      `INSERT INTO user_locks (user_id, reason) 
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET reason = EXCLUDED.reason`,
      [userId, reason]
    );

    await client.query('COMMIT');

    // Ghi System Log
    await logAdminAction({
      userId: adminId,
      action: 'LOCK_USER',
      objectType: 'USER',
      objectId: userId,
      oldValue: { status: oldStatus },
      newValue: { status: 'LOCKED', reason },
      result: 'SUCCESS',
    });

    return { message: 'Khóa tài khoản thành công', user_id: userId };
  } catch (error) {
    await client.query('ROLLBACK');
    await logAdminAction({
      userId: adminId,
      action: 'LOCK_USER',
      objectType: 'USER',
      objectId: userId,
      newValue: { reason },
      result: 'FAILED',
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * -----------------------------------------------------------------------------------------
 * HÀM: unlockUser
 * MỤC ĐÍCH: Mở khóa tài khoản người dùng, chuyển trạng thái về `ACTIVE` và xóa bản ghi trong `user_locks`.
 * -----------------------------------------------------------------------------------------
 */
export async function unlockUser(userId: number, adminId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userRes = await client.query('SELECT user_id, status FROM users WHERE user_id = $1 FOR UPDATE', [userId]);
    if (userRes.rows.length === 0) {
      throw new Error('Người dùng không tồn tại');
    }
    const oldStatus = userRes.rows[0].status;

    // Cập nhật trạng thái thành ACTIVE
    await client.query("UPDATE users SET status = 'ACTIVE' WHERE user_id = $1", [userId]);

    // Xóa lý do khóa
    await client.query('DELETE FROM user_locks WHERE user_id = $1', [userId]);

    await client.query('COMMIT');

    // Ghi System Log
    await logAdminAction({
      userId: adminId,
      action: 'UNLOCK_USER',
      objectType: 'USER',
      objectId: userId,
      oldValue: { status: oldStatus },
      newValue: { status: 'ACTIVE' },
      result: 'SUCCESS',
    });

    return { message: 'Mở khóa tài khoản thành công', user_id: userId };
  } catch (error) {
    await client.query('ROLLBACK');
    await logAdminAction({
      userId: adminId,
      action: 'UNLOCK_USER',
      objectType: 'USER',
      objectId: userId,
      result: 'FAILED',
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * -----------------------------------------------------------------------------------------
 * HÀM: changeUserRole
 * MỤC ĐÍCH: Thay đổi vai trò người dùng (CUSTOMER / PARTNER / ADMIN / PARTNER_EMPLOYEE).
 *   - Khi chuyển sang PARTNER: Yêu cầu Tên doanh nghiệp & Mã số thuế, tạo hoặc cập nhật hồ sơ
 *     bảng partners với trạng thái ACTIVE và tạo bản ghi duyệt APPROVED trong partner_approval_requests.
 *   - Khi chuyển sang PARTNER_EMPLOYEE: Yêu cầu branch_id, gán chi nhánh vào bảng partner_employees
 *     và tạo bản ghi duyệt APPROVED trong partner_employee_approval_requests.
 *   - Khi chuyển về CUSTOMER: Xóa liên kết nhân viên chi nhánh và cập nhật trạng thái partner INACTIVE.
 * -----------------------------------------------------------------------------------------
 */
export async function changeUserRole(
  userId: number,
  input: ChangeUserRoleInput,
  adminId: number
) {
  const newRole = input.role?.trim().toUpperCase();
  const validRoles = ['CUSTOMER', 'PARTNER', 'ADMIN', 'PARTNER_EMPLOYEE'];
  if (!validRoles.includes(newRole)) {
    throw new Error('Vai trò không hợp lệ');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Kiểm tra và khóa dòng người dùng
    const userRes = await client.query(
      'SELECT user_id, role, full_name, email FROM users WHERE user_id = $1 FOR UPDATE',
      [userId]
    );
    if (userRes.rows.length === 0) {
      throw new Error('Người dùng không tồn tại');
    }
    const oldRole = userRes.rows[0].role;

    // 2. Xử lý theo từng vai trò mục tiêu
    if (newRole === 'PARTNER') {
      const businessName = input.business_name?.trim();
      const taxCode = input.tax_code?.trim();

      if (!businessName) {
        throw new Error('Vui lòng nhập tên doanh nghiệp / thương hiệu cho Đối tác');
      }
      if (!taxCode || !/^[0-9]{10,13}$/.test(taxCode)) {
        throw new Error('Mã số thuế không hợp lệ. Mã số thuế phải gồm 10 đến 13 chữ số');
      }

      // Kiểm tra trùng mã số thuế với đối tác khác
      const taxCheck = await client.query(
        'SELECT user_id FROM partners WHERE tax_code = $1 AND user_id <> $2',
        [taxCode, userId]
      );
      if (taxCheck.rows.length > 0) {
        throw new Error('Mã số thuế này đã được đăng ký bởi một đối tác khác');
      }

      // Upsert vào bảng partners và kích hoạt trạng thái ACTIVE
      await client.query(
        `INSERT INTO partners (user_id, business_name, tax_code, activity_status)
         VALUES ($1, $2, $3, 'ACTIVE')
         ON CONFLICT (user_id) DO UPDATE 
         SET business_name = EXCLUDED.business_name,
             tax_code = EXCLUDED.tax_code,
             activity_status = 'ACTIVE'`,
        [userId, businessName, taxCode]
      );

      // Thêm bản ghi phê duyệt APPROVED
      await client.query(
        `INSERT INTO partner_approval_requests (partner_id, admin_id, reviewed_at, approval_status, admin_feedback)
         VALUES ($1, $2, NOW(), 'APPROVED', 'Quản trị viên phân quyền trực tiếp thành Đối tác')`,
        [userId, adminId]
      );

      // Xóa sạch liên kết nhân viên cũ nếu có
      await client.query('DELETE FROM partner_employee_approval_requests WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM partner_employees WHERE user_id = $1', [userId]);

    } else if (newRole === 'PARTNER_EMPLOYEE') {
      const branchId = Number(input.branch_id);
      if (!Number.isSafeInteger(branchId) || branchId <= 0) {
        throw new Error('Vui lòng chọn chi nhánh làm việc cho Nhân viên đối tác');
      }

      // Kiểm tra chi nhánh tồn tại và đang hoạt động
      const branchCheck = await client.query(
        `SELECT b.branch_id, b.status, p.activity_status
         FROM branches b
         JOIN partners p ON b.partner_id = p.user_id
         WHERE b.branch_id = $1`,
        [branchId]
      );
      if (branchCheck.rows.length === 0) {
        throw new Error('Chi nhánh được chọn không tồn tại');
      }
      if (branchCheck.rows[0].status !== 'ACTIVE' || branchCheck.rows[0].activity_status !== 'ACTIVE') {
        throw new Error('Chi nhánh hoặc đối tác chủ quản hiện không ở trạng thái hoạt động');
      }

      // Xóa sạch bản ghi đối tác cũ nếu có
      await client.query('DELETE FROM partner_approval_requests WHERE partner_id = $1', [userId]);
      await client.query('DELETE FROM partners WHERE user_id = $1', [userId]);

      // Upsert vào bảng partner_employees
      await client.query(
        `INSERT INTO partner_employees (user_id, branch_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET branch_id = EXCLUDED.branch_id`,
        [userId, branchId]
      );

      // Thêm bản ghi phê duyệt APPROVED
      await client.query(
        `INSERT INTO partner_employee_approval_requests (user_id, admin_id, reviewed_at, approval_status, admin_feedback)
         VALUES ($1, $2, NOW(), 'APPROVED', 'Quản trị viên phân quyền trực tiếp thành Nhân viên đối tác')`,
        [userId, adminId]
      );

    } else if (newRole === 'CUSTOMER') {
      // Xóa sạch bản ghi đối tác cũ nếu có
      await client.query('DELETE FROM partner_approval_requests WHERE partner_id = $1', [userId]);
      await client.query('DELETE FROM partners WHERE user_id = $1', [userId]);

      // Xóa sạch bản ghi nhân viên cũ nếu có
      await client.query('DELETE FROM partner_employee_approval_requests WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM partner_employees WHERE user_id = $1', [userId]);
    }

    // 3. Cập nhật role trong bảng users
    await client.query('UPDATE users SET role = $1 WHERE user_id = $2', [newRole, userId]);

    await client.query('COMMIT');

    // 4. Ghi System Log
    await logAdminAction({
      userId: adminId,
      action: 'CHANGE_USER_ROLE',
      objectType: 'USER',
      objectId: userId,
      oldValue: { role: oldRole },
      newValue: { 
        role: newRole,
        ...(newRole === 'PARTNER' ? { business_name: input.business_name, tax_code: input.tax_code } : {}),
        ...(newRole === 'PARTNER_EMPLOYEE' ? { branch_id: input.branch_id } : {}),
      },
      result: 'SUCCESS',
    });

    return { 
      message: 'Cập nhật vai trò thành công', 
      user_id: userId, 
      role: newRole 
    };
  } catch (error) {
    await client.query('ROLLBACK');
    await logAdminAction({
      userId: adminId,
      action: 'CHANGE_USER_ROLE',
      objectType: 'USER',
      objectId: userId,
      newValue: { role: newRole },
      result: 'FAILED',
    });
    throw error;
  } finally {
    client.release();
  }
}

