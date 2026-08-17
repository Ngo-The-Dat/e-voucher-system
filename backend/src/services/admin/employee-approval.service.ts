import pool from '../../config/db.js';
import { logAdminAction } from './system-log.service.js';

export interface GetEmployeesFilter {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export async function getPendingEmployees(filter: GetEmployeesFilter = {}) {
  const page = Math.max(1, Number(filter.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(filter.limit) || 10));
  const offset = (page - 1) * limit;

  const conditions: string[] = ["u.role = 'PARTNER_EMPLOYEE'"];
  const params: any[] = [];
  let paramIdx = 1;

  if (filter.status && filter.status !== 'ALL') {
    conditions.push(`COALESCE(pear.approval_status, 'PENDING') = $${paramIdx}`);
    params.push(filter.status);
    paramIdx++;
  } else if (!filter.status) {
    conditions.push(`COALESCE(pear.approval_status, 'PENDING') = 'PENDING'`);
  }

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

  if (filter.startDate) {
    conditions.push(`COALESCE(pear.submitted_at, u.created_at) >= $${paramIdx}::date`);
    params.push(filter.startDate);
    paramIdx++;
  }

  if (filter.endDate) {
    conditions.push(`COALESCE(pear.submitted_at, u.created_at) <= ($${paramIdx}::date + INTERVAL '1 day')`);
    params.push(filter.endDate);
    paramIdx++;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

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

export async function approveEmployee(employeeId: number, adminId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

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

    await client.query(
      `UPDATE users 
       SET status = 'ACTIVE' 
       WHERE user_id = $1`,
      [employeeId]
    );

    await client.query('COMMIT');

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
    client.release();
  }
}

export async function rejectEmployee(employeeId: number, reason: string, adminId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

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

    await client.query('COMMIT');

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
    client.release();
  }
}
