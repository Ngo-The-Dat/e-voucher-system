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

  // Lọc theo từ khóa tìm kiếm
  if (query.search && query.search.trim()) {
    const searchPattern = `%${query.search.trim()}%`;
    conditions.push(`(full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`);
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
 * MỤC ĐÍCH: Lấy chi tiết hồ sơ người dùng kèm lý do khóa (nếu có) và thông tin doanh nghiệp.
 * -----------------------------------------------------------------------------------------
 */
export async function getUserById(userId: number): Promise<UserDetail | null> {
  const sql = `
    SELECT 
      u.user_id, u.full_name, u.email, u.phone, u.role, u.status, 
      u.gender, u.nationality, u.identity_no, u.created_at, u.last_login_at,
      ul.reason as lock_reason,
      p.business_name, p.tax_code
    FROM users u
    LEFT JOIN user_locks ul ON ul.user_id = u.user_id
    LEFT JOIN partners p ON p.user_id = u.user_id
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
 * -----------------------------------------------------------------------------------------
 */
export async function changeUserRole(userId: number, newRole: string, adminId: number) {
  const validRoles = ['CUSTOMER', 'PARTNER', 'ADMIN', 'PARTNER_EMPLOYEE'];
  if (!validRoles.includes(newRole)) {
    throw new Error('Vai trò không hợp lệ');
  }

  const userRes = await pool.query('SELECT user_id, role FROM users WHERE user_id = $1', [userId]);
  if (userRes.rows.length === 0) {
    throw new Error('Người dùng không tồn tại');
  }
  const oldRole = userRes.rows[0].role;

  await pool.query('UPDATE users SET role = $1 WHERE user_id = $2', [newRole, userId]);

  // Ghi System Log
  await logAdminAction({
    userId: adminId,
    action: 'CHANGE_USER_ROLE',
    objectType: 'USER',
    objectId: userId,
    oldValue: { role: oldRole },
    newValue: { role: newRole },
    result: 'SUCCESS',
  });

  return { message: 'Cập nhật vai trò thành công', user_id: userId, role: newRole };
}
