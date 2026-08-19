/**
 * @file dashboard.service.ts
 * @description Service tính toán và tổng hợp các chỉ số báo cáo, hiệu suất kinh doanh cho Đối tác:
 * tổng số chương trình, số voucher đang chờ duyệt/đang chạy, số voucher đã bán, số voucher đã đổi (Redeemed),
 * và doanh thu thực nhận từ các đơn hàng thành công (`payment_status = 'PAID'`).
 */

import pool from '../../config/db.js';

// ─── Service Methods ──────────────────────────────────────────────────────────

/**
 * Lấy số liệu thống kê tổng quan (Dashboard Overview) cho đối tác.
 * 
 * @description
 * Thực hiện 5 truy vấn tổng hợp:
 * 1. Tổng số chiến dịch voucher do đối tác tạo (`total_programs`).
 * 2. Số lượng chiến dịch đang chờ Admin phê duyệt (`pending_approval` với `display_status = 'PENDING_APPROVAL'`).
 * 3. Số lượng chiến dịch đang mở bán công khai (`active_programs` với `display_status = 'PUBLISHED'`).
 * 4. Tổng số lượng voucher đã bán ra (`total_sold`) và số lượng đã được khách hàng đổi tại quầy (`total_redeemed`).
 * 5. Tổng doanh thu bán voucher (`total_revenue`) từ các đơn hàng đã thanh toán (`PAID`).
 * 
 * @param partnerId User ID của đối tác
 * @returns Đối tượng chứa các chỉ số thống kê
 */
export const getOverview = async (partnerId: number) => {
  // 1. Tổng số chương trình voucher
  const totalProgramsResult = await pool.query(
    'SELECT COUNT(*) FROM voucher_programs WHERE partner_id = $1',
    [partnerId]
  );

  // 2. Số chương trình đang chờ Admin duyệt
  const pendingResult = await pool.query(
    "SELECT COUNT(*) FROM voucher_programs WHERE partner_id = $1 AND display_status = 'PENDING_APPROVAL'",
    [partnerId]
  );

  // 3. Số chương trình đang hoạt động (PUBLISHED)
  const activeResult = await pool.query(
    "SELECT COUNT(*) FROM voucher_programs WHERE partner_id = $1 AND display_status = 'PUBLISHED'",
    [partnerId]
  );

  // 4. Tổng voucher đã bán (issued_vouchers) và đã đổi tại chi nhánh (USED)
  const salesResult = await pool.query(
    `SELECT
       COUNT(iv.issued_voucher_id) AS total_sold,
       COUNT(iv.issued_voucher_id) FILTER (WHERE iv.usage_status = 'USED') AS total_redeemed
     FROM issued_vouchers iv
     JOIN voucher_programs vp ON iv.program_id = vp.program_id
     WHERE vp.partner_id = $1`,
    [partnerId]
  );

  // 5. Tổng doanh thu từ các đơn hàng đã thanh toán thành công
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

/**
 * Lấy danh sách thống kê chi tiết theo từng chương trình voucher của đối tác.
 * 
 * @param partnerId User ID của đối tác
 * @param programId ID chương trình voucher cụ thể (nếu muốn lọc riêng 1 chương trình)
 * @returns Mảng các bản ghi thống kê: số lượng đã bán, đã dùng, hết hạn, doanh thu theo chương trình
 */
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
