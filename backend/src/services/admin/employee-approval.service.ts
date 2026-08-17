/**
 * =========================================================================================
 * FILE: employee-approval.service.ts
 * VỊ TRÍ: backend/src/services/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Tầng Dịch vụ Nghiệp vụ (Business Logic Layer) chuyên trách quản lý hồ sơ nhân viên đối tác.
 *   - Xử lý các nghiệp vụ:
 *       1. Lấy danh sách hồ sơ nhân viên đối tác (có phân trang, tìm kiếm, lọc theo ngày/trạng thái).
 *       2. Xem thông tin chi tiết của 1 nhân viên (kèm chi nhánh làm việc & doanh nghiệp đối tác).
 *       3. Phê duyệt hồ sơ nhân viên (sử dụng Database Transaction + ghi System Log).
 *       4. Từ chối hồ sơ nhân viên kèm lý do (sử dụng Database Transaction + ghi System Log).
 * =========================================================================================
 */

import pool from '../../config/db.js';
import { logAdminAction } from './system-log.service.js';

/**
 * Interface định nghĩa các tham số bộ lọc đầu vào khi tra cứu danh sách nhân viên
 */
export interface GetEmployeesFilter {
  search?: string;      // Từ khóa tìm kiếm (tên nhân viên, email, SĐT, CCCD, tên công ty, tên chi nhánh)
  status?: string;      // Trạng thái phê duyệt (PENDING, APPROVED, REJECTED hoặc ALL)
  startDate?: string;   // Ngày bắt đầu gửi duyệt (YYYY-MM-DD)
  endDate?: string;     // Ngày kết thúc gửi duyệt (YYYY-MM-DD)
  page?: number;        // Trang hiện tại (mặc định 1)
  limit?: number;       // Số bản ghi trên 1 trang (mặc định 10, tối đa 100)
}

/**
 * -----------------------------------------------------------------------------------------
 * HÀM: getPendingEmployees
 * MỤC ĐÍCH: 
 *   Lấy danh sách nhân viên đối tác kèm thông tin chi nhánh & đối tác theo điều kiện lọc và phân trang.
 * 
 * ĐẦU VÀO (Input):
 *   - filter: GetEmployeesFilter (các điều kiện tìm kiếm và phân trang từ Controller)
 * 
 * LUỒNG XỬ LÝ (Step-by-step):
 *   1. Chuẩn hóa tham số phân trang: tính `offset = (page - 1) * limit`.
 *   2. Xây dựng mảng `conditions` (điều kiện WHERE) và mảng `params` chứa giá trị thực tế:
 *      - Mặc định chỉ lọc user có vai trò `PARTNER_EMPLOYEE`.
 *      - Thêm điều kiện lọc trạng thái (mặc định lấy PENDING nếu không chọn).
 *      - Tìm kiếm không phân biệt hoa thường (`ILIKE`) trên nhiều trường (họ tên, email, CCCD, tên công ty...).
 *      - Lọc theo khoảng ngày nộp hồ sơ (`startDate`, `endDate`).
 *   3. Sử dụng `LEFT JOIN LATERAL` trong PostgreSQL:
 *      - Để lấy đúng 1 bản ghi yêu cầu duyệt mới nhất (`ORDER BY submitted_at DESC LIMIT 1`) cho mỗi nhân viên.
 *   4. Chạy `countQuery` để lấy tổng số lượng bản ghi (`total`) phục vụ tính số trang (`totalPages`).
 *   5. Chạy `dataQuery` với `LIMIT` và `OFFSET` để lấy đúng trang dữ liệu hiện tại.
 * 
 * ĐẦU RA (Output):
 *   - Object chứa mảng `employees` và đối tượng `pagination` (page, limit, total, totalPages).
 * -----------------------------------------------------------------------------------------
 */
export async function getPendingEmployees(filter: GetEmployeesFilter = {}) {
  // Bước 1: Tính toán phân trang
  const page = Math.max(1, Number(filter.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(filter.limit) || 10));
  const offset = (page - 1) * limit;

  // Bước 2: Xây dựng các điều kiện lọc động (Dynamic Query) dùng tham số $1, $2 tránh SQL Injection
  const conditions: string[] = ["u.role = 'PARTNER_EMPLOYEE'"];
  const params: any[] = [];
  let paramIdx = 1;

  // Lọc theo trạng thái phê duyệt
  if (filter.status && filter.status !== 'ALL') {
    conditions.push(`COALESCE(pear.approval_status, 'PENDING') = $${paramIdx}`);
    params.push(filter.status);
    paramIdx++;
  } else if (!filter.status) {
    // Mặc định hiển thị danh sách hồ sơ đang CHỜ DUYỆT (PENDING)
    conditions.push(`COALESCE(pear.approval_status, 'PENDING') = 'PENDING'`);
  }

  // Tìm kiếm từ khóa theo nhiều tiêu chí
  if (filter.search && filter.search.trim()) {
    const s = `%${filter.search.trim()}%`;
    conditions.push(`(
      u.full_name ILIKE $${paramIdx} OR
      u.email ILIKE $${paramIdx} OR
      u.phone ILIKE $${paramIdx} OR
      u.identity_no ILIKE $${paramIdx} OR
      p.business_name ILIKE $${paramIdx} OR
      b.branch_name ILIKE $${paramIdx}
    )`);
    params.push(s);
    paramIdx++;
  }

  // Lọc theo ngày bắt đầu nộp hồ sơ
  if (filter.startDate) {
    conditions.push(`COALESCE(pear.submitted_at, u.created_at) >= $${paramIdx}::date`);
    params.push(filter.startDate);
    paramIdx++;
  }

  // Lọc theo ngày kết thúc nộp hồ sơ (+1 ngày để lấy trọn vẹn 23:59:59 của ngày đó)
  if (filter.endDate) {
    conditions.push(`COALESCE(pear.submitted_at, u.created_at) <= ($${paramIdx}::date + INTERVAL '1 day')`);
    params.push(filter.endDate);
    paramIdx++;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  // Bước 3: Truy vấn đếm tổng số bản ghi thỏa điều kiện
  const countQuery = `
    SELECT COUNT(*) as total
    FROM users u
    JOIN partner_employees pe ON u.user_id = pe.user_id
    JOIN branches b ON pe.branch_id = b.branch_id
    JOIN partners p ON b.partner_id = p.user_id
    LEFT JOIN LATERAL (
      SELECT approval_request_id, approval_status, submitted_at, reviewed_at, admin_feedback
      FROM partner_employee_approval_requests
      WHERE user_id = u.user_id
      ORDER BY submitted_at DESC, approval_request_id DESC
      LIMIT 1
    ) pear ON TRUE
    ${whereClause}
  `;

  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0]?.total ?? '0', 10);

  // Bước 4: Truy vấn lấy danh sách nhân viên kèm thông tin chi tiết theo trang
  const dataQuery = `
    SELECT 
      u.user_id,
      u.full_name,
      u.email,
      u.phone,
      u.identity_no,
      u.gender,
      u.nationality,
      u.status as account_status,
      u.created_at,
      pear.approval_request_id,
      COALESCE(pear.approval_status, 'PENDING') as approval_status,
      COALESCE(pear.submitted_at, u.created_at) as submitted_at,
      pear.reviewed_at,
      pear.admin_feedback,
      b.branch_id,
      b.branch_name,
      b.address as branch_address,
      b.phone as branch_phone,
      p.user_id as partner_id,
      p.business_name,
      p.tax_code
    FROM users u
    JOIN partner_employees pe ON u.user_id = pe.user_id
    JOIN branches b ON pe.branch_id = b.branch_id
    JOIN partners p ON b.partner_id = p.user_id
    LEFT JOIN LATERAL (
      SELECT approval_request_id, approval_status, submitted_at, reviewed_at, admin_feedback
      FROM partner_employee_approval_requests
      WHERE user_id = u.user_id
      ORDER BY submitted_at DESC, approval_request_id DESC
      LIMIT 1
    ) pear ON TRUE
    ${whereClause}
    ORDER BY COALESCE(pear.submitted_at, u.created_at) DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  const dataRes = await pool.query(dataQuery, [...params, limit, offset]);

  // Bước 5: Trả kết quả chuẩn về cho Controller
  return {
    employees: dataRes.rows,
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
 * HÀM: getPendingEmployeeById
 * MỤC ĐÍCH:
 *   Lấy thông tin đầy đủ và chi tiết của một hồ sơ nhân viên đối tác cụ thể theo ID.
 * 
 * ĐẦU VÀO (Input):
 *   - employeeId: number (ID của nhân viên cần xem)
 * 
 * LUỒNG XỬ LÝ (Step-by-step):
 *   1. JOIN 4 bảng: `users`, `partner_employees`, `branches`, `partners`.
 *   2. Sử dụng `LATERAL JOIN` để lấy thông tin yêu cầu duyệt gần nhất kèm tên của Quản trị viên (Admin) đã duyệt/từ chối.
 *   3. Kiểm tra nếu không tìm thấy bản ghi thì trả về `null`.
 * 
 * ĐẦU RA (Output):
 *   - Object chứa toàn bộ thông tin cá nhân nhân viên, chi nhánh làm việc và doanh nghiệp đối tác, hoặc `null`.
 * -----------------------------------------------------------------------------------------
 */
export async function getPendingEmployeeById(employeeId: number) {
  const query = `
    SELECT 
      u.user_id,
      u.full_name,
      u.email,
      u.phone,
      u.identity_no,
      u.gender,
      u.nationality,
      u.status as account_status,
      u.created_at,
      u.last_login_at,
      pear.approval_request_id,
      COALESCE(pear.approval_status, 'PENDING') as approval_status,
      COALESCE(pear.submitted_at, u.created_at) as submitted_at,
      pear.reviewed_at,
      pear.admin_feedback,
      admin_user.full_name as reviewer_name,
      b.branch_id,
      b.branch_name,
      b.address as branch_address,
      b.region as branch_region,
      b.phone as branch_phone,
      b.status as branch_status,
      p.user_id as partner_id,
      p.business_name,
      p.tax_code,
      p.brand_logo,
      p.activity_status as partner_activity_status,
      p.business_license_no
    FROM users u
    JOIN partner_employees pe ON u.user_id = pe.user_id
    JOIN branches b ON pe.branch_id = b.branch_id
    JOIN partners p ON b.partner_id = p.user_id
    LEFT JOIN LATERAL (
      SELECT approval_request_id, approval_status, submitted_at, reviewed_at, admin_feedback, admin_id
      FROM partner_employee_approval_requests
      WHERE user_id = u.user_id
      ORDER BY submitted_at DESC, approval_request_id DESC
      LIMIT 1
    ) pear ON TRUE
    LEFT JOIN users admin_user ON pear.admin_id = admin_user.user_id
    WHERE u.user_id = $1 AND u.role = 'PARTNER_EMPLOYEE'
  `;

  const res = await pool.query(query, [employeeId]);
  if (res.rows.length === 0) return null;

  return res.rows[0];
}

/**
 * -----------------------------------------------------------------------------------------
 * HÀM: approveEmployee
 * MỤC ĐÍCH:
 *   Phê duyệt hồ sơ nhân viên đối tác và kích hoạt tài khoản nhân viên hoạt động.
 * 
 * ĐẦU VÀO (Input):
 *   - employeeId: number (ID nhân viên được duyệt)
 *   - adminId: number (ID của Quản trị viên đang thực hiện thao tác)
 * 
 * TẠI SAO DÙNG DATABASE TRANSACTION (BEGIN / COMMIT / ROLLBACK)?
 *   - Thao tác này cần cập nhật đồng thời 2 bảng: `partner_employee_approval_requests` và `users`.
 *   - Transaction đảm bảo tính toàn vẹn dữ liệu (ACID): Nếu 1 trong 2 bước bị lỗi thì toàn bộ thay đổi
 *     sẽ được hoàn tác (`ROLLBACK`), không để lại trạng thái dữ liệu rác (dở dang).
 * 
 * LUỒNG XỬ LÝ (Step-by-step):
 *   1. Mở kết nối riêng từ pool và gọi `BEGIN` để mở Transaction.
 *   2. Kiểm tra xem hồ sơ nhân viên có tồn tại trong hệ thống hay không.
 *   3. Cập nhật yêu cầu duyệt sang trạng thái `APPROVED`, gán `reviewed_at = CURRENT_TIMESTAMP` và `admin_id`.
 *   4. Cập nhật bảng `users` kích hoạt trạng thái tài khoản `status = 'ACTIVE'`.
 *   5. Gọi `COMMIT` để lưu vĩnh viễn dữ liệu vào CSDL.
 *   6. Ghi nhật ký hệ thống (`logAdminAction`) với hành động `APPROVE_PARTNER_EMPLOYEE`.
 * -----------------------------------------------------------------------------------------
 */
export async function approveEmployee(employeeId: number, adminId: number) {
  const client = await pool.connect();
  try {
    // Bước 1: Mở Database Transaction
    await client.query('BEGIN');

    // Bước 2: Kiểm tra sự tồn tại của nhân viên
    const checkRes = await client.query(
      `SELECT u.user_id, u.full_name, u.email, pear.approval_request_id, pear.approval_status
       FROM users u
       LEFT JOIN LATERAL (
         SELECT approval_request_id, approval_status
         FROM partner_employee_approval_requests
         WHERE user_id = u.user_id
         ORDER BY submitted_at DESC, approval_request_id DESC
         LIMIT 1
       ) pear ON TRUE
       WHERE u.user_id = $1 AND u.role = 'PARTNER_EMPLOYEE'`,
      [employeeId]
    );

    if (checkRes.rows.length === 0) {
      throw new Error('Hồ sơ nhân viên đối tác không tồn tại');
    }

    const oldEmp = checkRes.rows[0];

    // Bước 3: Cập nhật bản ghi phê duyệt
    if (oldEmp.approval_request_id) {
      await client.query(
        `UPDATE partner_employee_approval_requests 
         SET approval_status = 'APPROVED', reviewed_at = CURRENT_TIMESTAMP, admin_id = $2, admin_feedback = NULL
         WHERE approval_request_id = $1`,
        [oldEmp.approval_request_id, adminId]
      );
    } else {
      await client.query(
        `INSERT INTO partner_employee_approval_requests (user_id, admin_id, approval_status, reviewed_at)
         VALUES ($1, $2, 'APPROVED', CURRENT_TIMESTAMP)`,
        [employeeId, adminId]
      );
    }

    // Bước 4: Kích hoạt tài khoản nhân viên (ACTIVE)
    await client.query(
      `UPDATE users 
       SET status = 'ACTIVE' 
       WHERE user_id = $1`,
      [employeeId]
    );

    // Bước 5: Xác nhận Transaction thành công
    await client.query('COMMIT');

    // Bước 6: Ghi nhật ký thao tác quản trị viên vào bảng system_logs
    await logAdminAction({
      userId: adminId,
      action: 'APPROVE_PARTNER_EMPLOYEE',
      objectId: employeeId,
      objectType: 'PARTNER_EMPLOYEE',
      oldValue: { approval_status: oldEmp.approval_status },
      newValue: { approval_status: 'APPROVED', account_status: 'ACTIVE' },
      result: 'SUCCESS',
    });

    return { message: 'Phê duyệt hồ sơ nhân viên thành công', employee_id: employeeId };
  } catch (err) {
    // Nếu có lỗi, hoàn tác lại toàn bộ thay đổi
    await client.query('ROLLBACK');
    await logAdminAction({
      userId: adminId,
      action: 'APPROVE_PARTNER_EMPLOYEE',
      objectId: employeeId,
      objectType: 'PARTNER_EMPLOYEE',
      result: 'FAILED',
    });
    throw err;
  } finally {
    // Luôn giải phóng kết nối trả về cho Connection Pool
    client.release();
  }
}

/**
 * -----------------------------------------------------------------------------------------
 * HÀM: rejectEmployee
 * MỤC ĐÍCH:
 *   Từ chối hồ sơ nhân viên đối tác và lưu lý do từ chối phản hồi cho đối tác/nhân viên.
 * 
 * ĐẦU VÀO (Input):
 *   - employeeId: number (ID nhân viên bị từ chối)
 *   - reason: string (Lý do từ chối hồ sơ do Admin nhập vào)
 *   - adminId: number (ID của Quản trị viên thực hiện thao tác)
 * 
 * LUỒNG XỬ LÝ (Step-by-step):
 *   1. Mở Transaction với `BEGIN`.
 *   2. Kiểm tra sự tồn tại của nhân viên.
 *   3. Cập nhật `approval_status = 'REJECTED'`, lưu lý do vào `admin_feedback`, gán `admin_id` và `reviewed_at`.
 *   4. Gọi `COMMIT` để lưu dữ liệu.
 *   5. Ghi nhật ký hệ thống (`logAdminAction`) với hành động `REJECT_PARTNER_EMPLOYEE` kèm lý do từ chối.
 * -----------------------------------------------------------------------------------------
 */
export async function rejectEmployee(employeeId: number, reason: string, adminId: number) {
  const client = await pool.connect();
  try {
    // Bước 1: Mở Database Transaction
    await client.query('BEGIN');

    // Bước 2: Kiểm tra hồ sơ nhân viên
    const checkRes = await client.query(
      `SELECT u.user_id, u.full_name, u.email, pear.approval_request_id, pear.approval_status
       FROM users u
       LEFT JOIN LATERAL (
         SELECT approval_request_id, approval_status
         FROM partner_employee_approval_requests
         WHERE user_id = u.user_id
         ORDER BY submitted_at DESC, approval_request_id DESC
         LIMIT 1
       ) pear ON TRUE
       WHERE u.user_id = $1 AND u.role = 'PARTNER_EMPLOYEE'`,
      [employeeId]
    );

    if (checkRes.rows.length === 0) {
      throw new Error('Hồ sơ nhân viên đối tác không tồn tại');
    }

    const oldEmp = checkRes.rows[0];

    // Bước 3: Cập nhật trạng thái từ chối (REJECTED) và lưu lý do phản hồi (admin_feedback)
    if (oldEmp.approval_request_id) {
      await client.query(
        `UPDATE partner_employee_approval_requests 
         SET approval_status = 'REJECTED', reviewed_at = CURRENT_TIMESTAMP, admin_id = $2, admin_feedback = $3
         WHERE approval_request_id = $1`,
        [oldEmp.approval_request_id, adminId, reason || '']
      );
    } else {
      await client.query(
        `INSERT INTO partner_employee_approval_requests (user_id, admin_id, approval_status, reviewed_at, admin_feedback)
         VALUES ($1, $2, 'REJECTED', CURRENT_TIMESTAMP, $3)`,
        [employeeId, adminId, reason || '']
      );
    }

    // Bước 4: Xác nhận Transaction
    await client.query('COMMIT');

    // Bước 5: Ghi vết kiểm toán vào system_logs
    await logAdminAction({
      userId: adminId,
      action: 'REJECT_PARTNER_EMPLOYEE',
      objectId: employeeId,
      objectType: 'PARTNER_EMPLOYEE',
      oldValue: { approval_status: oldEmp.approval_status },
      newValue: { approval_status: 'REJECTED', reason },
      result: 'SUCCESS',
    });

    return { message: 'Từ chối hồ sơ nhân viên thành công', employee_id: employeeId, reason };
  } catch (err) {
    // Hoàn tác nếu có lỗi
    await client.query('ROLLBACK');
    await logAdminAction({
      userId: adminId,
      action: 'REJECT_PARTNER_EMPLOYEE',
      objectId: employeeId,
      objectType: 'PARTNER_EMPLOYEE',
      result: 'FAILED',
    });
    throw err;
  } finally {
    // Giải phóng kết nối CSDL
    client.release();
  }
}
