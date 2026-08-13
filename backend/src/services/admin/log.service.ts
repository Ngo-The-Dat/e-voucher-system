import pool from '../../config/db.js';

export interface GetSystemLogsFilter {
  search?: string;
  objectType?: string;
  result?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export async function getSystemLogs(filter: GetSystemLogsFilter = {}) {
  const page = Math.max(1, Number(filter.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(filter.limit) || 10));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

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

  if (filter.objectType && filter.objectType !== 'ALL') {
    conditions.push(`sl.object_type = $${paramIdx}`);
    params.push(filter.objectType);
    paramIdx++;
  }

  if (filter.result && filter.result !== 'ALL') {
    conditions.push(`sl.result = $${paramIdx}`);
    params.push(filter.result);
    paramIdx++;
  }

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

  const countQuery = `
    SELECT COUNT(*) as total
    FROM system_logs sl
    JOIN users u ON u.user_id = sl.user_id
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0]?.total ?? '0', 10);

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
