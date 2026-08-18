/**
 * =========================================================================================
 * FILE: order.service.ts
 * VỊ TRÍ: backend/src/services/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Tầng Dịch vụ Nghiệp vụ (Business Logic Layer) quản lý Đơn hàng Toàn Sàn (UC-ADM-04: Quản lý Đơn hàng).
 *   - Các chức năng chính:
 *       1. `getOrders`: Truy vấn danh sách đơn hàng toàn hệ thống, hỗ trợ tìm kiếm đa trường (Mã đơn, Người mua, Người nhận),
 *          lọc theo trạng thái đơn hàng, trạng thái thanh toán, khoảng thời gian và phân trang.
 *       2. `getOrderById`: Lấy chi tiết toàn diện 1 đơn hàng bao gồm: Thông tin thanh toán, Người mua, Người nhận,
 *          danh sách sản phẩm (order_items) và từng mã Voucher phát hành kèm mã QR (issued_vouchers).
 *       3. `cancelOrder`: Hủy đơn hàng và hoàn tiền (Admin Cancel & Refund) tuân thủ quy tắc nghiệp vụ RB-14:
 *          - Không cho phép hủy nếu đã có bất kỳ voucher nào trong đơn đã được sử dụng (USED).
 *          - Chạy Database Transaction: Đổi trạng thái đơn sang CANCELLED, hoàn tiền REFUNDED, vô hiệu hóa
 *            các voucher chưa dùng (UNUSED -> CANCELLED), lưu lý do hủy vào order_cancellations và ghi System Log.
 * =========================================================================================
 */

import pool from '../../config/db.js';
import { logAdminAction } from './system-log.service.js';

export interface GetOrdersFilter {
  search?: string;        // Tìm kiếm (Mã đơn, Tên/Email/SĐT người mua, Tên/Email/SĐT người nhận)
  orderStatus?: string;   // Trạng thái đơn (PENDING, CONFIRMED, COMPLETED, CANCELLED hoặc ALL)
  paymentStatus?: string; // Trạng thái thanh toán (PENDING, PAID, FAILED, REFUNDED hoặc ALL)
  startDate?: string;     // Ngày tạo từ
  endDate?: string;       // Ngày tạo đến
  page?: number;          // Trang hiện tại
  limit?: number;         // Số dòng / trang
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// PHẦN 1: TRUY VẤN DANH SÁCH ĐƠN HÀNG TOÀN SÀN
// ─────────────────────────────────────────────────────────────────────────────────────────

/**
 * -----------------------------------------------------------------------------------------
 * HÀM: getOrders
 * MỤC ĐÍCH: Lấy danh sách đơn hàng có phân trang, bộ lọc linh hoạt và thống kê số lượng theo từng trạng thái.
 * -----------------------------------------------------------------------------------------
 */
export async function getOrders(filter: GetOrdersFilter = {}) {
  const page = Math.max(1, Number(filter.page) || 1);
  const limit = Math.max(1, Number(filter.limit) || 10);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  // Lọc theo từ khóa tìm kiếm (Mã đơn, Người mua, Người nhận)
  if (filter.search && filter.search.trim()) {
    const searchVal = `%${filter.search.trim()}%`;
    conditions.push(`(
      o.order_id::text ILIKE $${paramIdx} OR
      ub.full_name ILIKE $${paramIdx} OR
      ub.email ILIKE $${paramIdx} OR
      ub.phone ILIKE $${paramIdx} OR
      ur.full_name ILIKE $${paramIdx} OR
      ur.email ILIKE $${paramIdx} OR
      ur.phone ILIKE $${paramIdx}
    )`);
    params.push(searchVal);
    paramIdx++;
  }

  // Lọc theo trạng thái đơn hàng (order_status)
  if (filter.orderStatus && filter.orderStatus !== 'ALL') {
    conditions.push(`o.order_status = $${paramIdx}`);
    params.push(filter.orderStatus);
    paramIdx++;
  }

  // Lọc theo trạng thái thanh toán (payment_status)
  if (filter.paymentStatus && filter.paymentStatus !== 'ALL') {
    conditions.push(`o.payment_status = $${paramIdx}`);
    params.push(filter.paymentStatus);
    paramIdx++;
  }

  // Lọc theo khoảng ngày tạo đơn (startDate & endDate)
  if (filter.startDate) {
    conditions.push(`o.created_at >= $${paramIdx}::timestamp`);
    params.push(`${filter.startDate} 00:00:00`);
    paramIdx++;
  }

  if (filter.endDate) {
    conditions.push(`o.created_at <= $${paramIdx}::timestamp`);
    params.push(`${filter.endDate} 23:59:59`);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 1. Đếm tổng số bản ghi thỏa mãn điều kiện lọc
  const countQuery = `
    SELECT COUNT(*) as total
    FROM orders o
    JOIN users ub ON ub.user_id = o.buyer_user_id
    LEFT JOIN users ur ON ur.user_id = o.recipient_user_id
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0].total, 10);

  // 2. Thống kê số lượng đơn hàng theo từng trạng thái (phục vụ hiển thị số lượng trên các tab)
  const statsQuery = `
    SELECT
      COUNT(*) as all_count,
      COUNT(*) FILTER (WHERE order_status = 'COMPLETED') as completed_count,
      COUNT(*) FILTER (WHERE order_status = 'CONFIRMED') as confirmed_count,
      COUNT(*) FILTER (WHERE order_status = 'PENDING') as pending_count,
      COUNT(*) FILTER (WHERE order_status = 'CANCELLED') as cancelled_count
    FROM orders
  `;
  const statsRes = await pool.query(statsQuery);
  const statsRow = statsRes.rows[0] || {};
  const stats = {
    all: parseInt(statsRow.all_count || '0', 10),
    completed: parseInt(statsRow.completed_count || '0', 10),
    confirmed: parseInt(statsRow.confirmed_count || '0', 10),
    pending: parseInt(statsRow.pending_count || '0', 10),
    cancelled: parseInt(statsRow.cancelled_count || '0', 10),
  };

  // 3. Lấy dữ liệu danh sách đơn hàng cho trang hiện tại
  const dataQuery = `
    SELECT 
      o.order_id,
      o.created_at,
      o.total_amount,
      o.payment_method,
      o.payment_status,
      o.order_status,
      o.buyer_user_id as buyer_id,
      ub.full_name as buyer_name,
      ub.email as buyer_email,
      ub.phone as buyer_phone,
      o.recipient_user_id as recipient_id,
      ur.full_name as recipient_name,
      ur.email as recipient_email,
      ur.phone as recipient_phone,
      (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id) as items_count,
      COALESCE((SELECT SUM(quantity) FROM order_items oi WHERE oi.order_id = o.order_id), 0) as total_quantity
    FROM orders o
    JOIN users ub ON ub.user_id = o.buyer_user_id
    LEFT JOIN users ur ON ur.user_id = o.recipient_user_id
    ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;
  const dataRes = await pool.query(dataQuery, [...params, limit, offset]);

  return {
    orders: dataRes.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
    stats,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// PHẦN 2: CHI TIẾT ĐƠN HÀNG VÀ CÁC MÃ VOUCHER PHÁT HÀNH
// ─────────────────────────────────────────────────────────────────────────────────────────

/**
 * -----------------------------------------------------------------------------------------
 * HÀM: getOrderById
 * MỤC ĐÍCH: Lấy toàn bộ thông tin chi tiết của 1 đơn hàng, bao gồm các voucher phát hành và mã QR.
 * -----------------------------------------------------------------------------------------
 */
export async function getOrderById(orderId: number) {
  // 1. Thông tin chung của đơn hàng
  const orderQuery = `
    SELECT 
      o.order_id,
      o.created_at,
      o.total_amount,
      o.payment_method,
      o.payment_status,
      o.order_status,
      o.buyer_user_id as buyer_id,
      ub.full_name as buyer_name,
      ub.email as buyer_email,
      ub.phone as buyer_phone,
      o.recipient_user_id as recipient_id,
      ur.full_name as recipient_name,
      ur.email as recipient_email,
      ur.phone as recipient_phone,
      oc.reason as cancel_reason,
      oc.requested_at as cancel_at,
      ua.full_name as cancel_admin_name
    FROM orders o
    JOIN users ub ON ub.user_id = o.buyer_user_id
    LEFT JOIN users ur ON ur.user_id = o.recipient_user_id
    LEFT JOIN order_cancellations oc ON oc.order_id = o.order_id
    LEFT JOIN users ua ON ua.user_id = oc.admin_id
    WHERE o.order_id = $1
  `;
  const orderRes = await pool.query(orderQuery, [orderId]);

  if (orderRes.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy đơn hàng.' };
  }

  const order = orderRes.rows[0];

  // 2. Lấy các sản phẩm trong đơn (order_items) kèm danh sách mã voucher phát hành (issued_vouchers)
  const itemsQuery = `
    SELECT 
      oi.order_item_id,
      oi.order_id,
      oi.program_id,
      oi.quantity,
      oi.unit_price,
      vp.program_name,
      vp.original_price as original_unit_price,
      p.business_name as partner_name,
      (
        SELECT json_agg(json_build_object(
          'issued_voucher_id', iv.issued_voucher_id,
          'voucher_code', iv.voucher_code,
          'qr_code', iv.qr_code,
          'usage_status', iv.usage_status,
          'issued_at', iv.issued_at,
          'expires_at', iv.expires_at,
          'used_at', iv.used_at,
          'applicable_region', iv.applicable_region,
          'discount_amount', iv.discount_amount
        ) ORDER BY iv.issued_voucher_id ASC)
        FROM issued_vouchers iv
        WHERE iv.order_item_id = oi.order_item_id
      ) as vouchers
    FROM order_items oi
    JOIN voucher_programs vp ON vp.program_id = oi.program_id
    JOIN partners p ON p.user_id = vp.partner_id
    WHERE oi.order_id = $1
    ORDER BY oi.order_item_id ASC
  `;
  const itemsRes = await pool.query(itemsQuery, [orderId]);
  order.items = itemsRes.rows.map((item) => ({
    ...item,
    vouchers: item.vouchers || [],
  }));

  return order;
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// PHẦN 3: HỦY ĐƠN HÀNG & HOÀN TIỀN (ADMIN CANCEL ORDER)
// ─────────────────────────────────────────────────────────────────────────────────────────

/**
 * -----------------------------------------------------------------------------------------
 * HÀM: cancelOrder
 * MỤC ĐÍCH: 
 *   Quản trị viên thực hiện hủy đơn hàng và hoàn tiền cho khách hàng.
 * 
 * QUY TẮC RÀNG BUỘC RB-14:
 *   - Tuyệt đối KHÔNG cho phép hủy đơn hàng nếu đã có ít nhất 1 voucher trong đơn được sử dụng (USED).
 * 
 * CÁC BƯỚC THỰC HIỆN TRONG DATABASE TRANSACTION:
 *   1. Kiểm tra đơn hàng có tồn tại và chưa bị hủy.
 *   2. Kiểm tra điều kiện RB-14 (chưa có voucher nào USED).
 *   3. Cập nhật `orders.order_status = 'CANCELLED'`.
 *      - Nếu đơn đã thanh toán (`payment_status = 'PAID'`), cập nhật sang `'REFUNDED'`.
 *   4. Thêm bản ghi lưu vết vào bảng `order_cancellations` (lý do hủy, thời gian, admin thực hiện).
 *   5. Vô hiệu hóa toàn bộ voucher chưa sử dụng trong đơn (`issued_vouchers.usage_status = 'CANCELLED'`).
 *   6. Ghi System Log (`logAdminAction`).
 * -----------------------------------------------------------------------------------------
 */
export async function cancelOrder(orderId: number, adminId: number, reason: string) {
  if (!reason || !reason.trim()) {
    throw { status: 400, message: 'Vui lòng cung cấp lý do hủy đơn hàng.' };
  }

  // 1. Kiểm tra đơn hàng tồn tại
  const orderRes = await pool.query(
    `SELECT * FROM orders WHERE order_id = $1`,
    [orderId]
  );

  if (orderRes.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy đơn hàng cần hủy.' };
  }

  const order = orderRes.rows[0];

  if (order.order_status === 'CANCELLED') {
    throw { status: 400, message: 'Đơn hàng này đã bị hủy trước đó.' };
  }

  // 2. Kiểm tra chính sách RB-14: Không cho phép hủy nếu đã có voucher được sử dụng
  const usedVoucherCheck = await pool.query(
    `SELECT iv.issued_voucher_id, iv.voucher_code
     FROM issued_vouchers iv
     JOIN order_items oi ON oi.order_item_id = iv.order_item_id
     WHERE oi.order_id = $1 AND iv.usage_status = 'USED'
     LIMIT 1`,
    [orderId]
  );

  if (usedVoucherCheck.rows.length > 0) {
    throw {
      status: 400,
      message: 'Không thể hủy đơn hàng do đã có voucher trong đơn được sử dụng bởi khách hàng.',
    };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 3. Cập nhật trạng thái đơn hàng và trạng thái hoàn tiền
    const newPaymentStatus = order.payment_status === 'PAID' ? 'REFUNDED' : order.payment_status;
    await client.query(
      `UPDATE orders
       SET order_status = 'CANCELLED',
           payment_status = $1
       WHERE order_id = $2`,
      [newPaymentStatus, orderId]
    );

    // 4. Thêm bản ghi vào bảng order_cancellations
    await client.query(
      `INSERT INTO order_cancellations (order_id, admin_id, reason, requested_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [orderId, adminId, reason.trim()]
    );

    // 5. Vô hiệu hóa các voucher chưa dùng (UNUSED -> CANCELLED)
    await client.query(
      `UPDATE issued_vouchers
       SET usage_status = 'CANCELLED'
       WHERE order_item_id IN (SELECT order_item_id FROM order_items WHERE order_id = $1)
         AND usage_status = 'UNUSED'`,
      [orderId]
    );

    // 6. Ghi log hệ thống
    await logAdminAction({
      userId: adminId,
      action: 'CANCEL_ORDER',
      objectId: String(orderId),
      objectType: 'ORDER',
      oldValue: {
        order_status: order.order_status,
        payment_status: order.payment_status,
      },
      newValue: {
        order_status: 'CANCELLED',
        payment_status: newPaymentStatus,
        reason: reason.trim(),
      },
      result: 'SUCCESS',
    });

    await client.query('COMMIT');

    return {
      success: true,
      message: 'Hủy đơn hàng và hoàn tiền thành công.',
      order_id: orderId,
      order_status: 'CANCELLED',
      payment_status: newPaymentStatus,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
