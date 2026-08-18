/**
 * =========================================================================================
 * FILE: log.service.ts
 * VỊ TRÍ: backend/src/services/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Tầng Dịch vụ Nghiệp vụ (Business Logic Layer) truy vấn Nhật ký Hệ thống (UC-ADM-08: Xem Nhật ký Hệ thống).
 *   - Phục vụ tính năng Audit Log / Giám sát hoạt động quản trị:
 *       1. `getSystemLogs`: Truy vấn lịch sử thao tác hệ thống, hỗ trợ tìm kiếm (tên admin, action, object_id, log_id),
 *          lọc theo loại đối tượng (objectType: USER, VOUCHER, ORDER...), kết quả (SUCCESS / FAILED), khoảng ngày và phân trang.
 *       2. `getSystemLogById`: Xem chi tiết 1 bản ghi log (bao gồm JSON oldValue và newValue để so sánh trước/sau khi sửa).
 * =========================================================================================
 */

import pool from '../../config/db.js';

export interface GetSystemLogsFilter {
  search?: string;      // Tìm kiếm (Tên người thực hiện, Action, Object ID, Log ID)
  objectType?: string;  // Loại đối tượng (USER, PARTNER, VOUCHER, ORDER, APPROVAL_REQUEST...)
  result?: string;      // Kết quả (SUCCESS / FAILED hoặc ALL)
  startDate?: string;   // Ngày thực hiện từ
  endDate?: string;     // Ngày thực hiện đến
  page?: number;        // Trang hiện tại
  limit?: number;       // Số dòng trên 1 trang
}

/**
 * -----------------------------------------------------------------------------------------
 * HÀM: getSystemLogs
 * MỤC ĐÍCH: Lấy danh sách nhật ký kiểm toán hệ thống có phân trang và bộ lọc linh hoạt.
 * -----------------------------------------------------------------------------------------
 */
export async function getSystemLogs(filter: GetSystemLogsFilter = {}) {
  const page = Math.max(1, Number(filter.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(filter.limit) || 10));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  // Lọc theo từ khóa tìm kiếm
  if (filter.search && filter.search.trim()) {
    const s = `%${filter.search.trim()}%`;
    conditions.push(`(
      u.full_name ILIKE $${paramIdx} OR
      sl.action ILIKE $${paramIdx} OR
      sl.object_id ILIKE $${paramIdx} OR
      sl.log_id::text ILIKE $${paramIdx}
    )`);
    params.push(s);
    paramIdx++;
  }

  // Lọc theo loại đối tượng tác động (object_type)
  if (filter.objectType && filter.objectType !== 'ALL') {
    conditions.push(`sl.object_type = $${paramIdx}`);
    params.push(filter.objectType);
    paramIdx++;
  }

  // Lọc theo kết quả thực hiện (SUCCESS / FAILED)
  if (filter.result && filter.result !== 'ALL') {
    conditions.push(`sl.result = $${paramIdx}`);
    params.push(filter.result);
    paramIdx++;
  }

  // Lọc theo khoảng ngày thực hiện
  if (filter.startDate) {
    conditions.push(`sl.performed_at >= $${paramIdx}::date`);
    params.push(filter.startDate);
    paramIdx++;
  }

  if (filter.endDate) {
    conditions.push(`sl.performed_at <= ($${paramIdx}::date + INTERVAL '1 day')`);
    params.push(filter.endDate);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 1. Đếm tổng số bản ghi log
  const countQuery = `
    SELECT COUNT(*) as total
    FROM system_logs sl
    JOIN users u ON u.user_id = sl.user_id
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0]?.total ?? '0', 10);

  // 2. Lấy danh sách log sắp xếp theo thời gian mới nhất (performed_at DESC)
  const dataQuery = `
    SELECT 
      sl.log_id,
      sl.user_id,
      sl.action,
      sl.object_id,
      sl.object_type,
      sl.old_value,
      sl.new_value,
      sl.performed_at,
      sl.result,
      u.full_name as user_name,
      u.role as user_role
    FROM system_logs sl
    JOIN users u ON u.user_id = sl.user_id
    ${whereClause}
    ORDER BY sl.performed_at DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;
  const dataRes = await pool.query(dataQuery, [...params, limit, offset]);

  return {
    logs: dataRes.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * -----------------------------------------------------------------------------------------
 * HÀM: getSystemLogById
 * MỤC ĐÍCH: Lấy chi tiết 1 bản ghi nhật ký hệ thống theo ID.
 * -----------------------------------------------------------------------------------------
 */
export async function getSystemLogById(id: string | number) {
  const query = `
    SELECT 
      sl.log_id,
      sl.user_id,
      sl.action,
      sl.object_id,
      sl.object_type,
      sl.old_value,
      sl.new_value,
      sl.performed_at,
      sl.result,
      u.full_name as user_name,
      u.role as user_role
    FROM system_logs sl
    JOIN users u ON u.user_id = sl.user_id
    WHERE sl.log_id = $1
  `;
  const res = await pool.query(query, [id]);
  if (res.rows.length === 0) {
    return null;
  }
  return res.rows[0];
}
