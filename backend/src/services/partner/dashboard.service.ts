import pool from '../../config/db.js';

// ─── Service ──────────────────────────────────────────────────────────────────

export const getOverview = async (partnerId: number) => {
  // Tổng số chương trình
  const totalProgramsResult = await pool.query(
    'SELECT COUNT(*) FROM voucher_programs WHERE partner_id = $1',
    [partnerId]
  );

  // Số chương trình đang chờ duyệt
  const pendingResult = await pool.query(
    "SELECT COUNT(*) FROM voucher_programs WHERE partner_id = $1 AND display_status = 'PENDING_APPROVAL'",
    [partnerId]
  );

  // Số chương trình đang hoạt động (PUBLISHED)
  const activeResult = await pool.query(
    "SELECT COUNT(*) FROM voucher_programs WHERE partner_id = $1 AND display_status = 'PUBLISHED'",
    [partnerId]
  );

  // Tổng voucher đã bán (issued_vouchers) và đã sử dụng
  const salesResult = await pool.query(
    `SELECT
       COUNT(iv.issued_voucher_id) AS total_sold,
       COUNT(iv.issued_voucher_id) FILTER (WHERE iv.usage_status = 'USED') AS total_redeemed
     FROM issued_vouchers iv
     JOIN voucher_programs vp ON iv.program_id = vp.program_id
     WHERE vp.partner_id = $1`,
    [partnerId]
  );

  // Tổng doanh thu (từ order_items)
  const revenueResult = await pool.query(
    `SELECT COALESCE(SUM(oi.unit_price * oi.quantity), 0) AS total_revenue
     FROM order_items oi
     JOIN voucher_programs vp ON oi.program_id = vp.program_id
     JOIN orders o ON oi.order_id = o.order_id
     WHERE vp.partner_id = $1 AND o.payment_status = 'PAID'`,
    [partnerId]
  );

  return {
    total_programs: parseInt(totalProgramsResult.rows[0]?.count ?? '0'),
    pending_approval: parseInt(pendingResult.rows[0]?.count ?? '0'),
    active_programs: parseInt(activeResult.rows[0]?.count ?? '0'),
    total_sold: parseInt(salesResult.rows[0]?.total_sold ?? '0'),
    total_redeemed: parseInt(salesResult.rows[0]?.total_redeemed ?? '0'),
    total_revenue: parseFloat(revenueResult.rows[0]?.total_revenue ?? '0'),
  };
};

export const getVoucherStats = async (
  partnerId: number,
  programId?: number
) => {
  let whereClause = 'WHERE vp.partner_id = $1';
  const params: (number | string)[] = [partnerId];

  if (programId) {
    whereClause += ' AND vp.program_id = $2';
    params.push(programId);
  }

  const result = await pool.query(
    `SELECT
       vp.program_id,
       vp.program_name,
       vp.sale_price AS selling_price,
       vp.issue_quantity AS issued_quantity,
       vp.display_status,
       vp.sale_start_at AS sell_start_date,
       vp.sale_end_at AS sell_end_date,
       c.category_name,
       COUNT(iv.issued_voucher_id) AS sold_count,
       COUNT(iv.issued_voucher_id) FILTER (WHERE iv.usage_status = 'USED') AS used_count,
       COUNT(iv.issued_voucher_id) FILTER (WHERE iv.usage_status = 'EXPIRED') AS expired_count,
       COALESCE((
         SELECT SUM(oi2.unit_price * oi2.quantity)
         FROM order_items oi2
         JOIN orders o2 ON oi2.order_id = o2.order_id
         WHERE oi2.program_id = vp.program_id
           AND o2.payment_status = 'PAID'
       ), 0) AS revenue
     FROM voucher_programs vp
     LEFT JOIN categories c ON vp.category_id = c.category_id
     LEFT JOIN issued_vouchers iv ON vp.program_id = iv.program_id
     ${whereClause}
     GROUP BY vp.program_id, c.category_name
     ORDER BY vp.program_id DESC`,
    params
  );

  return result.rows;
};
