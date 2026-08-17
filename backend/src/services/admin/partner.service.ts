import pool from '../../config/db.js';
import { logAdminAction } from './system-log.service.js';

export interface GetPartnersFilter {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ─── 1. Pending Partners (Duyệt hồ sơ) ──────────────────────────────────────────

export async function getPendingPartners(filter: GetPartnersFilter = {}) {
  const page = Math.max(1, Number(filter.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(filter.limit) || 10));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (filter.status && filter.status !== 'ALL') {
    conditions.push(`COALESCE(par.approval_status, 'PENDING') = $${paramIdx}`);
    params.push(filter.status);
    paramIdx++;
  } else if (!filter.status) {
    conditions.push(`COALESCE(par.approval_status, 'PENDING') = 'PENDING'`);
  }

  if (filter.search && filter.search.trim()) {
    const s = `%${filter.search.trim()}%`;
    conditions.push(`(
      p.business_name ILIKE $${paramIdx} OR
      p.tax_code ILIKE $${paramIdx} OR
      u.full_name ILIKE $${paramIdx} OR
      u.email ILIKE $${paramIdx} OR
      u.phone ILIKE $${paramIdx}
    )`);
    params.push(s);
    paramIdx++;
  }

  if (filter.startDate) {
    conditions.push(`p.registered_at >= $${paramIdx}::date`);
    params.push(filter.startDate);
    paramIdx++;
  }

  if (filter.endDate) {
    conditions.push(`p.registered_at <= ($${paramIdx}::date + INTERVAL '1 day')`);
    params.push(filter.endDate);
    paramIdx++;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM partners p
    JOIN users u ON u.user_id = p.user_id
    LEFT JOIN LATERAL (
      SELECT approval_request_id, approval_status, submitted_at, reviewed_at, admin_feedback
      FROM partner_approval_requests par
      WHERE par.partner_id = p.user_id
      ORDER BY par.submitted_at DESC, par.approval_request_id DESC
      LIMIT 1
    ) par ON TRUE
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0]?.total ?? '0', 10);

  const dataQuery = `
    SELECT 
      p.user_id,
      p.business_name,
      p.tax_code,
      par.approval_request_id,
      COALESCE(par.approval_status, 'PENDING') as approval_status,
      p.activity_status,
      p.registered_at,
      par.submitted_at,
      par.reviewed_at,
      par.admin_feedback,
      p.business_license_no,
      p.license_issue_date,
      p.license_issue_place,
      u.full_name as representative_name,
      u.email,
      u.phone,
      (SELECT COUNT(*) FROM branches b WHERE b.partner_id = p.user_id) as branches_count
    FROM partners p
    JOIN users u ON u.user_id = p.user_id
    LEFT JOIN LATERAL (
      SELECT approval_request_id, approval_status, submitted_at, reviewed_at, admin_feedback
      FROM partner_approval_requests par
      WHERE par.partner_id = p.user_id
      ORDER BY par.submitted_at DESC, par.approval_request_id DESC
      LIMIT 1
    ) par ON TRUE
    ${whereClause}
    ORDER BY COALESCE(par.submitted_at, p.registered_at) DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;
  const dataRes = await pool.query(dataQuery, [...params, limit, offset]);

  return {
    partners: dataRes.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getPendingPartnerById(partnerId: number) {
  const query = `
    SELECT 
      p.user_id,
      p.business_name,
      p.tax_code,
      par.approval_request_id,
      COALESCE(par.approval_status, 'PENDING') as approval_status,
      p.activity_status,
      p.registered_at,
      par.submitted_at,
      par.reviewed_at,
      par.admin_feedback,
      p.business_license_no,
      p.license_issue_date,
      p.license_issue_place,
      u.full_name as representative_name,
      u.email,
      u.phone,
      u.identity_no,
      u.gender,
      u.nationality,
      (SELECT COUNT(*) FROM branches b WHERE b.partner_id = p.user_id) as branches_count
    FROM partners p
    JOIN users u ON u.user_id = p.user_id
    LEFT JOIN LATERAL (
      SELECT approval_request_id, approval_status, submitted_at, reviewed_at, admin_feedback
      FROM partner_approval_requests par
      WHERE par.partner_id = p.user_id
      ORDER BY par.submitted_at DESC, par.approval_request_id DESC
      LIMIT 1
    ) par ON TRUE
    WHERE p.user_id = $1
  `;
  const res = await pool.query(query, [partnerId]);
  if (res.rows.length === 0) return null;

  const partner = res.rows[0];

  const branchesRes = await pool.query(
    `SELECT branch_id, partner_id, branch_name, address, region, phone, status
     FROM branches WHERE partner_id = $1 ORDER BY branch_id ASC`,
    [partnerId]
  );
  partner.branches = branchesRes.rows;

  return partner;
}

export async function approvePartner(partnerId: number, adminId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkRes = await client.query(
      `SELECT p.user_id, p.business_name, p.activity_status, par.approval_request_id, par.approval_status
       FROM partners p
       LEFT JOIN LATERAL (
         SELECT approval_request_id, approval_status
         FROM partner_approval_requests
         WHERE partner_id = p.user_id
         ORDER BY submitted_at DESC, approval_request_id DESC
         LIMIT 1
       ) par ON TRUE
       WHERE p.user_id = $1`,
      [partnerId]
    );

    if (checkRes.rows.length === 0) {
      throw new Error('Đối tác không tồn tại');
    }

    const oldPartner = checkRes.rows[0];

    if (oldPartner.approval_request_id) {
      await client.query(
        `UPDATE partner_approval_requests 
         SET approval_status = 'APPROVED', reviewed_at = CURRENT_TIMESTAMP, admin_id = $2
         WHERE approval_request_id = $1`,
        [oldPartner.approval_request_id, adminId]
      );
    } else {
      await client.query(
        `INSERT INTO partner_approval_requests (partner_id, admin_id, approval_status, reviewed_at)
         VALUES ($1, $2, 'APPROVED', CURRENT_TIMESTAMP)`,
        [partnerId, adminId]
      );
    }

    await client.query(
      `UPDATE partners 
       SET activity_status = 'ACTIVE' 
       WHERE user_id = $1`,
      [partnerId]
    );

    await client.query('COMMIT');

    // Ghi system log
    await logAdminAction({
      userId: adminId,
      action: 'APPROVE_PARTNER',
      objectId: partnerId,
      objectType: 'PARTNER',
      oldValue: { approval_status: oldPartner.approval_status, activity_status: oldPartner.activity_status },
      newValue: { approval_status: 'APPROVED', activity_status: 'ACTIVE' },
      result: 'SUCCESS',
    });

    return { message: 'Phê duyệt đối tác thành công', partner_id: partnerId };
  } catch (err) {
    await client.query('ROLLBACK');

    await logAdminAction({
      userId: adminId,
      action: 'APPROVE_PARTNER',
      objectId: partnerId,
      objectType: 'PARTNER',
      result: 'FAILED',
    });

    throw err;
  } finally {
    client.release();
  }
}

export async function rejectPartner(partnerId: number, reason: string, adminId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkRes = await client.query(
      `SELECT p.user_id, p.business_name, par.approval_request_id, par.approval_status
       FROM partners p
       LEFT JOIN LATERAL (
         SELECT approval_request_id, approval_status
         FROM partner_approval_requests
         WHERE partner_id = p.user_id
         ORDER BY submitted_at DESC, approval_request_id DESC
         LIMIT 1
       ) par ON TRUE
       WHERE p.user_id = $1`,
      [partnerId]
    );

    if (checkRes.rows.length === 0) {
      throw new Error('Đối tác không tồn tại');
    }

    const oldPartner = checkRes.rows[0];

    if (oldPartner.approval_request_id) {
      await client.query(
        `UPDATE partner_approval_requests 
         SET approval_status = 'REJECTED', reviewed_at = CURRENT_TIMESTAMP, admin_id = $2, admin_feedback = $3
         WHERE approval_request_id = $1`,
        [oldPartner.approval_request_id, adminId, reason]
      );
    } else {
      await client.query(
        `INSERT INTO partner_approval_requests (partner_id, admin_id, approval_status, reviewed_at, admin_feedback)
         VALUES ($1, $2, 'REJECTED', CURRENT_TIMESTAMP, $3)`,
        [partnerId, adminId, reason]
      );
    }

    await client.query('COMMIT');

    // Ghi system log
    await logAdminAction({
      userId: adminId,
      action: 'REJECT_PARTNER',
      objectId: partnerId,
      objectType: 'PARTNER',
      oldValue: { approval_status: oldPartner.approval_status },
      newValue: { approval_status: 'REJECTED', reason },
      result: 'SUCCESS',
    });

    return { message: 'Từ chối đối tác thành công', partner_id: partnerId };
  } catch (err) {
    await client.query('ROLLBACK');

    await logAdminAction({
      userId: adminId,
      action: 'REJECT_PARTNER',
      objectId: partnerId,
      objectType: 'PARTNER',
      result: 'FAILED',
    });

    throw err;
  } finally {
    client.release();
  }
}

export async function requestRevisionPartner(partnerId: number, note: string, adminId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkRes = await client.query(
      `SELECT p.user_id, par.approval_request_id, par.approval_status
       FROM partners p
       LEFT JOIN LATERAL (
         SELECT approval_request_id, approval_status
         FROM partner_approval_requests
         WHERE partner_id = p.user_id
         ORDER BY submitted_at DESC, approval_request_id DESC
         LIMIT 1
       ) par ON TRUE
       WHERE p.user_id = $1`,
      [partnerId]
    );

    if (checkRes.rows.length === 0) {
      throw new Error('Đối tác không tồn tại');
    }

    const oldPartner = checkRes.rows[0];

    if (oldPartner.approval_request_id) {
      await client.query(
        `UPDATE partner_approval_requests 
         SET admin_feedback = $2, admin_id = $3
         WHERE approval_request_id = $1`,
        [oldPartner.approval_request_id, note, adminId]
      );
    } else {
      await client.query(
        `INSERT INTO partner_approval_requests (partner_id, admin_id, approval_status, admin_feedback)
         VALUES ($1, $2, 'PENDING', $3)`,
        [partnerId, adminId, note]
      );
    }

    await client.query('COMMIT');

    // Ghi system log
    await logAdminAction({
      userId: adminId,
      action: 'REQUEST_REVISION_PARTNER',
      objectId: partnerId,
      objectType: 'PARTNER',
      oldValue: { approval_status: oldPartner.approval_status },
      newValue: { approval_status: oldPartner.approval_status, note },
      result: 'SUCCESS',
    });

    return { message: 'Đã gửi yêu cầu bổ sung thông tin thành công', partner_id: partnerId };
  } catch (err) {
    await client.query('ROLLBACK');

    await logAdminAction({
      userId: adminId,
      action: 'REQUEST_REVISION_PARTNER',
      objectId: partnerId,
      objectType: 'PARTNER',
      result: 'FAILED',
    });

    throw err;
  } finally {
    client.release();
  }
}

// ─── 2. Managed Partners (Đối tác đã duyệt) ───────────────────────────────────

export async function getManagedPartners(filter: GetPartnersFilter = {}) {
  const page = Math.max(1, Number(filter.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(filter.limit) || 10));
  const offset = (page - 1) * limit;

  const conditions: string[] = ["par.approval_status = 'APPROVED'"];
  const params: any[] = [];
  let paramIdx = 1;

  if (filter.search && filter.search.trim()) {
    const s = `%${filter.search.trim()}%`;
    conditions.push(`(
      p.business_name ILIKE $${paramIdx} OR
      p.tax_code ILIKE $${paramIdx} OR
      u.full_name ILIKE $${paramIdx} OR
      u.email ILIKE $${paramIdx} OR
      u.phone ILIKE $${paramIdx}
    )`);
    params.push(s);
    paramIdx++;
  }

  if (filter.status && filter.status !== 'ALL') {
    conditions.push(`p.activity_status = $${paramIdx}`);
    params.push(filter.status);
    paramIdx++;
  }

  if (filter.startDate) {
    conditions.push(`p.registered_at >= $${paramIdx}::date`);
    params.push(filter.startDate);
    paramIdx++;
  }

  if (filter.endDate) {
    conditions.push(`p.registered_at <= ($${paramIdx}::date + INTERVAL '1 day')`);
    params.push(filter.endDate);
    paramIdx++;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM partners p
    JOIN users u ON u.user_id = p.user_id
    LEFT JOIN LATERAL (
      SELECT approval_status
      FROM partner_approval_requests par
      WHERE par.partner_id = p.user_id
      ORDER BY par.submitted_at DESC, par.approval_request_id DESC
      LIMIT 1
    ) par ON TRUE
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0]?.total ?? '0', 10);

  const dataQuery = `
    SELECT 
      p.user_id,
      p.business_name,
      p.tax_code,
      COALESCE(par.approval_status, 'APPROVED') as approval_status,
      p.activity_status,
      p.registered_at,
      p.business_license_no,
      p.license_issue_date,
      p.license_issue_place,
      u.full_name as representative_name,
      u.email,
      u.phone,
      u.status as user_status,
      (SELECT COUNT(*) FROM branches b WHERE b.partner_id = p.user_id) as branches_count,
      (SELECT COUNT(*) FROM voucher_programs vp WHERE vp.partner_id = p.user_id) as voucher_programs_count
    FROM partners p
    JOIN users u ON u.user_id = p.user_id
    LEFT JOIN LATERAL (
      SELECT approval_status
      FROM partner_approval_requests par
      WHERE par.partner_id = p.user_id
      ORDER BY par.submitted_at DESC, par.approval_request_id DESC
      LIMIT 1
    ) par ON TRUE
    ${whereClause}
    ORDER BY p.registered_at DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;
  const dataRes = await pool.query(dataQuery, [...params, limit, offset]);

  return {
    partners: dataRes.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getManagedPartnerById(partnerId: number) {
  // Query partner & user details
  const partnerQuery = `
    SELECT 
      p.user_id,
      p.business_name,
      p.tax_code,
      COALESCE(par.approval_status, 'APPROVED') as approval_status,
      p.activity_status,
      p.registered_at,
      p.business_license_no,
      p.license_issue_date,
      p.license_issue_place,
      u.full_name as representative_name,
      u.email,
      u.phone,
      u.identity_no,
      u.gender,
      u.nationality,
      u.status as user_status,
      ul.reason as lock_reason
    FROM partners p
    JOIN users u ON u.user_id = p.user_id
    LEFT JOIN user_locks ul ON ul.user_id = p.user_id
    LEFT JOIN LATERAL (
      SELECT approval_status
      FROM partner_approval_requests par
      WHERE par.partner_id = p.user_id
      ORDER BY par.submitted_at DESC, par.approval_request_id DESC
      LIMIT 1
    ) par ON TRUE
    WHERE p.user_id = $1 AND par.approval_status = 'APPROVED'
  `;
  const partnerRes = await pool.query(partnerQuery, [partnerId]);
  if (partnerRes.rows.length === 0) return null;

  const partner = partnerRes.rows[0];

  // Query branches
  const branchesQuery = `
    SELECT branch_id, branch_name, address, region, phone, status
    FROM branches
    WHERE partner_id = $1
    ORDER BY branch_id ASC
  `;
  const branchesRes = await pool.query(branchesQuery, [partnerId]);

  // Query voucher programs summary
  const vouchersQuery = `
    SELECT program_id, program_name, original_price, sale_price, issue_quantity, display_status, sale_start_at, sale_end_at
    FROM voucher_programs
    WHERE partner_id = $1
    ORDER BY program_id DESC
  `;
  const vouchersRes = await pool.query(vouchersQuery, [partnerId]);

  return {
    ...partner,
    branches: branchesRes.rows,
    branches_count: branchesRes.rows.length,
    voucher_programs: vouchersRes.rows,
    voucher_programs_count: vouchersRes.rows.length,
  };
}

export async function lockPartner(partnerId: number, reason: string, adminId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkRes = await client.query(
      `SELECT p.user_id, p.activity_status, u.status as user_status
       FROM partners p JOIN users u ON u.user_id = p.user_id
       WHERE p.user_id = $1`,
      [partnerId]
    );

    if (checkRes.rows.length === 0) {
      throw new Error('Đối tác không tồn tại');
    }

    const oldData = checkRes.rows[0];

    // Update partner & user status to LOCKED
    await client.query(
      `UPDATE partners SET activity_status = 'LOCKED' WHERE user_id = $1`,
      [partnerId]
    );
    await client.query(
      `UPDATE users SET status = 'LOCKED' WHERE user_id = $1`,
      [partnerId]
    );

    // Upsert into user_locks
    await client.query(
      `INSERT INTO user_locks (user_id, reason) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET reason = $2`,
      [partnerId, reason]
    );

    await client.query('COMMIT');

    // Ghi system log
    await logAdminAction({
      userId: adminId,
      action: 'LOCK_PARTNER',
      objectId: partnerId,
      objectType: 'PARTNER',
      oldValue: { activity_status: oldData.activity_status, user_status: oldData.user_status },
      newValue: { activity_status: 'LOCKED', user_status: 'LOCKED', lock_reason: reason },
      result: 'SUCCESS',
    });

    return { message: 'Khóa đối tác thành công', partner_id: partnerId };
  } catch (err) {
    await client.query('ROLLBACK');

    await logAdminAction({
      userId: adminId,
      action: 'LOCK_PARTNER',
      objectId: partnerId,
      objectType: 'PARTNER',
      result: 'FAILED',
    });

    throw err;
  } finally {
    client.release();
  }
}

export async function unlockPartner(partnerId: number, adminId: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkRes = await client.query(
      `SELECT p.user_id, p.activity_status, u.status as user_status
       FROM partners p JOIN users u ON u.user_id = p.user_id
       WHERE p.user_id = $1`,
      [partnerId]
    );

    if (checkRes.rows.length === 0) {
      throw new Error('Đối tác không tồn tại');
    }

    const oldData = checkRes.rows[0];

    // Update partner & user status to ACTIVE
    await client.query(
      `UPDATE partners SET activity_status = 'ACTIVE' WHERE user_id = $1`,
      [partnerId]
    );
    await client.query(
      `UPDATE users SET status = 'ACTIVE' WHERE user_id = $1`,
      [partnerId]
    );

    // Remove from user_locks
    await client.query(`DELETE FROM user_locks WHERE user_id = $1`, [partnerId]);

    await client.query('COMMIT');

    // Ghi system log
    await logAdminAction({
      userId: adminId,
      action: 'UNLOCK_PARTNER',
      objectId: partnerId,
      objectType: 'PARTNER',
      oldValue: { activity_status: oldData.activity_status, user_status: oldData.user_status },
      newValue: { activity_status: 'ACTIVE', user_status: 'ACTIVE' },
      result: 'SUCCESS',
    });

    return { message: 'Mở khóa đối tác thành công', partner_id: partnerId };
  } catch (err) {
    await client.query('ROLLBACK');

    await logAdminAction({
      userId: adminId,
      action: 'UNLOCK_PARTNER',
      objectId: partnerId,
      objectType: 'PARTNER',
      result: 'FAILED',
    });

    throw err;
  } finally {
    client.release();
  }
}

// ─── 3. Branch Management ──────────────────────────────────────────────────────

export interface BranchInput {
  branch_name: string;
  address: string;
  region?: string;
  phone?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export async function createBranch(partnerId: number, input: BranchInput, adminId: number) {
  const { branch_name, address, region = 'Hà Nội', phone = '', status = 'ACTIVE' } = input;

  const partnerCheck = await pool.query(`SELECT user_id FROM partners WHERE user_id = $1`, [partnerId]);
  if (partnerCheck.rows.length === 0) {
    throw new Error('Đối tác không tồn tại');
  }

  const insertRes = await pool.query(
    `INSERT INTO branches (partner_id, branch_name, address, region, phone, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING branch_id, partner_id, branch_name, address, region, phone, status`,
    [partnerId, branch_name, address, region, phone, status]
  );

  const createdBranch = insertRes.rows[0];

  await logAdminAction({
    userId: adminId,
    action: 'CREATE_BRANCH',
    objectId: createdBranch.branch_id,
    objectType: 'BRANCH',
    newValue: createdBranch,
    result: 'SUCCESS',
  });

  return createdBranch;
}

export async function updateBranch(partnerId: number, branchId: number, input: Partial<BranchInput>, adminId: number) {
  const checkRes = await pool.query(
    `SELECT branch_id, partner_id, branch_name, address, region, phone, status
     FROM branches WHERE branch_id = $1 AND partner_id = $2`,
    [branchId, partnerId]
  );

  if (checkRes.rows.length === 0) {
    throw new Error('Chi nhánh không tồn tại hoặc không thuộc đối tác này');
  }

  const oldBranch = checkRes.rows[0];
  const {
    branch_name = oldBranch.branch_name,
    address = oldBranch.address,
    region = oldBranch.region,
    phone = oldBranch.phone,
    status = oldBranch.status,
  } = input;

  const updateRes = await pool.query(
    `UPDATE branches
     SET branch_name = $1, address = $2, region = $3, phone = $4, status = $5
     WHERE branch_id = $6 AND partner_id = $7
     RETURNING branch_id, partner_id, branch_name, address, region, phone, status`,
    [branch_name, address, region, phone, status, branchId, partnerId]
  );

  const updatedBranch = updateRes.rows[0];

  await logAdminAction({
    userId: adminId,
    action: 'UPDATE_BRANCH',
    objectId: branchId,
    objectType: 'BRANCH',
    oldValue: oldBranch,
    newValue: updatedBranch,
    result: 'SUCCESS',
  });

  return updatedBranch;
}

export async function deleteBranch(partnerId: number, branchId: number, adminId: number) {
  const checkRes = await pool.query(
    `SELECT branch_id, partner_id, branch_name, address, region, phone, status
     FROM branches WHERE branch_id = $1 AND partner_id = $2`,
    [branchId, partnerId]
  );

  if (checkRes.rows.length === 0) {
    throw new Error('Chi nhánh không tồn tại hoặc không thuộc đối tác này');
  }

  const oldBranch = checkRes.rows[0];

  await pool.query(`DELETE FROM branches WHERE branch_id = $1 AND partner_id = $2`, [branchId, partnerId]);

  await logAdminAction({
    userId: adminId,
    action: 'DELETE_BRANCH',
    objectId: branchId,
    objectType: 'BRANCH',
    oldValue: oldBranch,
    result: 'SUCCESS',
  });

  return { message: 'Xóa chi nhánh thành công', branch_id: branchId };
}

