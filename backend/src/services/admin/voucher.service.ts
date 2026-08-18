/**
 * =========================================================================================
 * FILE: voucher.service.ts
 * VỊ TRÍ: backend/src/services/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Tầng Dịch vụ Nghiệp vụ (Business Logic Layer) quản lý toàn diện Vòng đời Chương trình Voucher (E-Voucher Lifecycle).
 *   - Phụ trách 2 phân hệ lớn:
 *       1. HÀNG ĐỢI XÉT DUYỆT VOUCHER (Pending Vouchers):
 *          - Lấy danh sách voucher đối tác gửi duyệt, xem chi tiết đợt phát hành, chi nhánh & hình ảnh.
 *          - Kiểm tra quy tắc nghiệp vụ (Giá bán < Giá gốc, thời gian bán & sử dụng hợp lệ, số lượng > 0).
 *          - Duyệt voucher (chuyển sang PUBLISHED) hoặc Từ chối kèm lý do (chuyển về DRAFT).
 *       2. QUẢN LÝ KHO VOUCHER TOÀN SÀN (Managed Vouchers):
 *          - Lấy danh sách voucher đang lưu hành, tính toán số lượng đã bán (sold_count) và tồn kho (stock).
 *          - Thay đổi trạng thái hiển thị (PUBLISHED / HIDDEN / ENDED) với các ràng buộc kiểm tra hạn dùng & tồn kho.
 * =========================================================================================
 */

import pool from '../../config/db.js';
import { logAdminAction } from './system-log.service.js';

export interface GetPendingVouchersFilter {
  search?: string;      // Tìm kiếm (Tên chương trình, Tên đối tác, MST, Đại diện, Mã yêu cầu, Mã voucher)
  startDate?: string;   // Ngày gửi duyệt bắt đầu
  endDate?: string;     // Ngày gửi duyệt kết thúc
  page?: number;        // Trang hiện tại
  limit?: number;       // Số dòng trên 1 trang
}

export interface GetManagedVouchersFilter {
  search?: string;      // Tìm kiếm (Tên chương trình, Tên đối tác, MST, Mã voucher)
  status?: string;      // Trạng thái hiển thị (PUBLISHED, HIDDEN, ENDED hoặc ALL)
  categoryId?: number;  // Lọc theo danh mục ngành hàng
  page?: number;        // Trang hiện tại
  limit?: number;       // Số dòng trên 1 trang
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// PHẦN 1: HÀNG ĐỢI XÉT DUYỆT VOUCHER (PENDING VOUCHERS)
// ─────────────────────────────────────────────────────────────────────────────────────────

/**
 * -----------------------------------------------------------------------------------------
 * HÀM: getPendingVouchers
 * MỤC ĐÍCH: 
 *   Lấy danh sách các yêu cầu phát hành voucher do đối tác gửi lên đang chờ Quản trị viên duyệt.
 * 
 * LUỒNG XỬ LÝ (Step-by-step):
 *   1. Tính toán phân trang `offset = (page - 1) * limit`.
 *   2. Tạo điều kiện lọc bắt buộc: `var.approval_status = 'PENDING'`.
 *   3. Lọc theo từ khóa `search` và khoảng ngày nộp hồ sơ (`startDate`, `endDate`).
 *   4. Sử dụng Subquery `json_agg` để gom nhóm danh sách chi nhánh và danh sách hình ảnh voucher thành mảng JSON.
 *   5. Chạy truy vấn đếm tổng (`countQuery`) và lấy dữ liệu trang hiện tại (`dataQuery`).
 * -----------------------------------------------------------------------------------------
 */
export async function getPendingVouchers(filter: GetPendingVouchersFilter = {}) {
  const page = Math.max(1, Number(filter.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(filter.limit) || 10));
  const offset = (page - 1) * limit;

  const conditions: string[] = ["var.approval_status = 'PENDING'"];
  const params: any[] = [];
  let paramIdx = 1;

  if (filter.search && filter.search.trim()) {
    const s = `%${filter.search.trim()}%`;
    conditions.push(`(
      vp.program_name ILIKE $${paramIdx} OR
      p.business_name ILIKE $${paramIdx} OR
      p.tax_code ILIKE $${paramIdx} OR
      u.full_name ILIKE $${paramIdx} OR
      var.approval_request_id::text ILIKE $${paramIdx} OR
      vp.program_id::text ILIKE $${paramIdx}
    )`);
    params.push(s);
    paramIdx++;
  }

  if (filter.startDate) {
    conditions.push(`var.submitted_at >= $${paramIdx}::date`);
    params.push(filter.startDate);
    paramIdx++;
  }

  if (filter.endDate) {
    conditions.push(`var.submitted_at <= ($${paramIdx}::date + INTERVAL '1 day')`);
    params.push(filter.endDate);
    paramIdx++;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM voucher_approval_requests var
    JOIN voucher_programs vp ON vp.program_id = var.program_id
    JOIN partners p ON p.user_id = vp.partner_id
    JOIN users u ON u.user_id = p.user_id
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0]?.total ?? '0', 10);

  const dataQuery = `
    SELECT 
      var.approval_request_id,
      var.program_id,
      var.submitted_at,
      var.approval_status,
      var.admin_feedback,
      vp.program_name,
      vp.category_id,
      c.category_name,
      vp.original_price,
      vp.sale_price,
      vp.discount_amount,
      vp.issue_quantity,
      vp.sale_start_at,
      vp.sale_end_at,
      vp.use_start_at,
      vp.use_end_at,
      vp.display_status,
      p.user_id as partner_id,
      p.business_name as partner_name,
      p.tax_code,
      u.full_name as partner_representative,
      u.email as partner_email,
      u.phone as partner_phone,
      (
        SELECT json_agg(json_build_object(
          'branch_id', b.branch_id,
          'branch_name', b.branch_name,
          'address', b.address,
          'region', b.region
        ))
        FROM voucher_program_branches vpb
        JOIN branches b ON b.branch_id = vpb.branch_id
        WHERE vpb.program_id = vp.program_id
      ) as branches,
      (
        SELECT json_agg(json_build_object(
          'image_id', vpi.image_id,
          'image_url', vpi.image_url,
          'is_primary', vpi.is_primary,
          'sort_order', vpi.sort_order
        ) ORDER BY vpi.is_primary DESC, vpi.sort_order ASC, vpi.image_id ASC)
        FROM voucher_program_images vpi
        WHERE vpi.program_id = vp.program_id
      ) as images
    FROM voucher_approval_requests var
    JOIN voucher_programs vp ON vp.program_id = var.program_id
    JOIN partners p ON p.user_id = vp.partner_id
    JOIN users u ON u.user_id = p.user_id
    LEFT JOIN categories c ON c.category_id = vp.category_id
    ${whereClause}
    ORDER BY var.submitted_at DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;
  const dataRes = await pool.query(dataQuery, [...params, limit, offset]);

  return {
    vouchers: dataRes.rows,
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
 * HÀM: getPendingVoucherById
 * MỤC ĐÍCH: Lấy chi tiết hồ sơ yêu cầu duyệt voucher kèm toàn bộ thông tin giá, thời hạn, chi nhánh & hình ảnh.
 * -----------------------------------------------------------------------------------------
 */
export async function getPendingVoucherById(requestId: number) {
  const query = `
    SELECT 
      var.approval_request_id,
      var.program_id,
      var.submitted_at,
      var.reviewed_at,
      var.approval_status,
      var.admin_feedback,
      var.admin_id,
      vp.program_name,
      vp.category_id,
      c.category_name,
      vp.original_price,
      vp.sale_price,
      vp.discount_amount,
      vp.issue_quantity,
      vp.sale_start_at,
      vp.sale_end_at,
      vp.use_start_at,
      vp.use_end_at,
      vp.display_status,
      p.user_id as partner_id,
      p.business_name as partner_name,
      p.tax_code,
      p.business_license_no,
      u.full_name as partner_representative,
      u.email as partner_email,
      u.phone as partner_phone,
      (
        SELECT json_agg(json_build_object(
          'branch_id', b.branch_id,
          'branch_name', b.branch_name,
          'address', b.address,
          'region', b.region,
          'phone', b.phone,
          'status', b.status
        ))
        FROM voucher_program_branches vpb
        JOIN branches b ON b.branch_id = vpb.branch_id
        WHERE vpb.program_id = vp.program_id
      ) as branches,
      (
        SELECT json_agg(json_build_object(
          'image_id', vpi.image_id,
          'image_url', vpi.image_url,
          'is_primary', vpi.is_primary,
          'sort_order', vpi.sort_order
        ) ORDER BY vpi.is_primary DESC, vpi.sort_order ASC, vpi.image_id ASC)
        FROM voucher_program_images vpi
        WHERE vpi.program_id = vp.program_id
      ) as images
    FROM voucher_approval_requests var
    JOIN voucher_programs vp ON vp.program_id = var.program_id
    JOIN partners p ON p.user_id = vp.partner_id
    JOIN users u ON u.user_id = p.user_id
    LEFT JOIN categories c ON c.category_id = vp.category_id
    WHERE var.approval_request_id = $1
  `;
  const result = await pool.query(query, [requestId]);

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy yêu cầu duyệt voucher.' };
  }

  return result.rows[0];
}

/**
 * -----------------------------------------------------------------------------------------
 * HÀM: approveVoucher
 * MỤC ĐÍCH: 
 *   Phê duyệt phát hành voucher, chuyển trạng thái hiển thị sang `PUBLISHED` (Đang bán) để khách hàng có thể mua.
 * 
 * CÁC QUY TẮC NGHIỆP VỤ BẮT BUỘC KIỂM TRA (Business Validation Rules):
 *   1. Yêu cầu duyệt phải đang ở trạng thái `PENDING`.
 *   2. Giá bán (`sale_price`) phải nhỏ hơn giá gốc (`original_price`).
 *   3. Thời gian kết thúc mở bán (`sale_end_at`) phải sau thời gian bắt đầu (`sale_start_at`).
 *   4. Thời gian kết thúc sử dụng (`use_end_at`) phải sau thời gian bắt đầu (`use_start_at`).
 *   5. Số lượng phát hành (`issue_quantity`) phải lớn hơn 0.
 * 
 * SỬ DỤNG DATABASE TRANSACTION:
 *   - Cập nhật đồng thời `voucher_approval_requests` (APPROVED) và `voucher_programs` (PUBLISHED).
 *   - Đảm bảo tính nhất quán (ACID), ghi nhật ký hệ thống `logAdminAction`.
 * -----------------------------------------------------------------------------------------
 */
export async function approveVoucher(requestId: number, adminId: number) {
  const reqRes = await pool.query(
    `SELECT var.*, vp.program_name, vp.display_status, vp.original_price, vp.sale_price, vp.issue_quantity, vp.sale_start_at, vp.sale_end_at, vp.use_start_at, vp.use_end_at
     FROM voucher_approval_requests var
     JOIN voucher_programs vp ON vp.program_id = var.program_id
     WHERE var.approval_request_id = $1`,
    [requestId]
  );

  if (reqRes.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy yêu cầu duyệt voucher.' };
  }

  const approvalReq = reqRes.rows[0];
  if (approvalReq.approval_status !== 'PENDING') {
    throw { status: 400, message: `Yêu cầu duyệt này đã ở trạng thái ${approvalReq.approval_status}.` };
  }

  // Bước 1: Kiểm tra các quy tắc nghiệp vụ
  const origPrice = Number(approvalReq.original_price) || 0;
  const salePrice = Number(approvalReq.sale_price) || 0;
  if (salePrice >= origPrice) {
    throw { status: 400, message: 'Không thể duyệt voucher: Giá bán phải nhỏ hơn giá gốc.' };
  }

  if (new Date(approvalReq.sale_end_at).getTime() <= new Date(approvalReq.sale_start_at).getTime()) {
    throw { status: 400, message: 'Không thể duyệt voucher: Thời gian mở bán không hợp lệ (ngày kết thúc phải sau ngày bắt đầu).' };
  }

  if (new Date(approvalReq.use_end_at).getTime() <= new Date(approvalReq.use_start_at).getTime()) {
    throw { status: 400, message: 'Không thể duyệt voucher: Thời gian sử dụng không hợp lệ (ngày hết hạn phải sau ngày bắt đầu).' };
  }

  if (!approvalReq.issue_quantity || Number(approvalReq.issue_quantity) <= 0) {
    throw { status: 400, message: 'Không thể duyệt voucher: Số lượng phát hành phải lớn hơn 0.' };
  }

  // Bước 2: Thực hiện Transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Cập nhật yêu cầu duyệt sang APPROVED
    await client.query(
      `UPDATE voucher_approval_requests
       SET approval_status = 'APPROVED',
           reviewed_at = CURRENT_TIMESTAMP,
           admin_id = $1
       WHERE approval_request_id = $2`,
      [adminId, requestId]
    );

    // Xuất bản voucher lên sàn (PUBLISHED)
    await client.query(
      `UPDATE voucher_programs
       SET display_status = 'PUBLISHED'
       WHERE program_id = $1`,
      [approvalReq.program_id]
    );

    // Ghi System Log
    await logAdminAction({
      userId: adminId,
      action: 'APPROVE_VOUCHER',
      objectId: String(requestId),
      objectType: 'APPROVAL_REQUEST',
      oldValue: {
        approval_status: approvalReq.approval_status,
        display_status: approvalReq.display_status,
      },
      newValue: {
        approval_status: 'APPROVED',
        display_status: 'PUBLISHED',
        program_id: approvalReq.program_id,
        program_name: approvalReq.program_name,
      },
      result: 'SUCCESS',
    });

    await client.query('COMMIT');

    return {
      message: 'Phê duyệt voucher thành công.',
      approval_request_id: requestId,
      program_id: approvalReq.program_id,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    await logAdminAction({
      userId: adminId,
      action: 'APPROVE_VOUCHER',
      objectId: String(requestId),
      objectType: 'APPROVAL_REQUEST',
      result: 'FAILED',
    });
    throw err;
  } finally {
    client.release();
  }
}

/**
 * -----------------------------------------------------------------------------------------
 * HÀM: rejectVoucher
 * MỤC ĐÍCH: Từ chối yêu cầu duyệt voucher, chuyển về bản nháp (DRAFT) và lưu lý do từ chối.
 * -----------------------------------------------------------------------------------------
 */
export async function rejectVoucher(requestId: number, adminId: number, reason: string) {
  if (!reason || !reason.trim()) {
    throw { status: 400, message: 'Vui lòng cung cấp lý do từ chối duyệt voucher.' };
  }

  const reqRes = await pool.query(
    `SELECT var.*, vp.program_name, vp.display_status
     FROM voucher_approval_requests var
     JOIN voucher_programs vp ON vp.program_id = var.program_id
     WHERE var.approval_request_id = $1`,
    [requestId]
  );

  if (reqRes.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy yêu cầu duyệt voucher.' };
  }

  const approvalReq = reqRes.rows[0];
  if (approvalReq.approval_status !== 'PENDING') {
    throw { status: 400, message: `Yêu cầu duyệt này đã ở trạng thái ${approvalReq.approval_status}.` };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Chuyển trạng thái sang REJECTED và lưu lý do vào admin_feedback
    await client.query(
      `UPDATE voucher_approval_requests
       SET approval_status = 'REJECTED',
           reviewed_at = CURRENT_TIMESTAMP,
           admin_id = $1,
           admin_feedback = $2
       WHERE approval_request_id = $3`,
      [adminId, reason.trim(), requestId]
    );

    // Đưa voucher về trạng thái bản nháp (DRAFT) để đối tác có thể sửa lại
    await client.query(
      `UPDATE voucher_programs
       SET display_status = 'DRAFT'
       WHERE program_id = $1`,
      [approvalReq.program_id]
    );

    await logAdminAction({
      userId: adminId,
      action: 'REJECT_VOUCHER',
      objectId: String(requestId),
      objectType: 'APPROVAL_REQUEST',
      oldValue: {
        approval_status: approvalReq.approval_status,
        display_status: approvalReq.display_status,
      },
      newValue: {
        approval_status: 'REJECTED',
        display_status: 'DRAFT',
        program_id: approvalReq.program_id,
        program_name: approvalReq.program_name,
        feedback: reason.trim(),
      },
      result: 'SUCCESS',
    });

    await client.query('COMMIT');

    return {
      message: 'Từ chối duyệt voucher thành công.',
      approval_request_id: requestId,
      program_id: approvalReq.program_id,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    await logAdminAction({
      userId: adminId,
      action: 'REJECT_VOUCHER',
      objectId: String(requestId),
      objectType: 'APPROVAL_REQUEST',
      result: 'FAILED',
    });
    throw err;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// PHẦN 2: QUẢN LÝ KHO VOUCHER TOÀN SÀN (MANAGED VOUCHERS)
// ─────────────────────────────────────────────────────────────────────────────────────────

/**
 * -----------------------------------------------------------------------------------------
 * HÀM: getManagedVouchers
 * MỤC ĐÍCH: 
 *   Lấy danh sách các voucher đang quản lý trên sàn (PUBLISHED, HIDDEN, ENDED), 
 *   tính số lượng đã bán (sold_count), số lượng tồn kho (stock) và đếm số lượng thống kê theo từng tab.
 * -----------------------------------------------------------------------------------------
 */
export async function getManagedVouchers(filter: GetManagedVouchersFilter = {}) {
  const page = Math.max(1, Number(filter.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(filter.limit) || 10));
  const offset = (page - 1) * limit;

  const baseConditions: string[] = ["vp.display_status IN ('PUBLISHED', 'HIDDEN', 'ENDED')"];
  const params: any[] = [];
  let paramIdx = 1;

  if (filter.search && filter.search.trim()) {
    const s = `%${filter.search.trim()}%`;
    baseConditions.push(`(
      vp.program_name ILIKE $${paramIdx} OR
      p.business_name ILIKE $${paramIdx} OR
      p.tax_code ILIKE $${paramIdx} OR
      vp.program_id::text ILIKE $${paramIdx}
    )`);
    params.push(s);
    paramIdx++;
  }

  if (filter.categoryId) {
    baseConditions.push(`vp.category_id = $${paramIdx}`);
    params.push(filter.categoryId);
    paramIdx++;
  }

  // Lấy counts thống kê trạng thái cho các Tab giao diện
  const statsQuery = `
    SELECT 
      COUNT(*) as total_all,
      COUNT(*) FILTER (WHERE vp.display_status = 'PUBLISHED') as count_published,
      COUNT(*) FILTER (WHERE vp.display_status = 'HIDDEN') as count_hidden,
      COUNT(*) FILTER (WHERE vp.display_status = 'ENDED') as count_ended
    FROM voucher_programs vp
    JOIN partners p ON p.user_id = vp.partner_id
    WHERE ${baseConditions.join(' AND ')}
  `;
  const statsRes = await pool.query(statsQuery, params);
  const stats = statsRes.rows[0] || { total_all: '0', count_published: '0', count_hidden: '0', count_ended: '0' };

  // Lọc theo trạng thái cụ thể nếu người dùng chọn
  const filterConditions = [...baseConditions];
  if (filter.status && filter.status !== 'ALL') {
    filterConditions.push(`vp.display_status = $${paramIdx}`);
    params.push(filter.status);
    paramIdx++;
  }

  const whereClause = `WHERE ${filterConditions.join(' AND ')}`;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM voucher_programs vp
    JOIN partners p ON p.user_id = vp.partner_id
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0]?.total ?? '0', 10);

  // Truy vấn dữ liệu kèm tính toán sold_count và stock
  const dataQuery = `
    SELECT 
      vp.program_id,
      vp.program_name,
      vp.category_id,
      c.category_name,
      vp.original_price,
      vp.sale_price,
      vp.discount_amount,
      vp.issue_quantity,
      vp.sale_start_at,
      vp.sale_end_at,
      vp.use_start_at,
      vp.use_end_at,
      vp.display_status,
      p.user_id as partner_id,
      p.business_name as partner_name,
      p.tax_code,
      COALESCE((
        SELECT b.branch_name 
        FROM voucher_program_branches vpb 
        JOIN branches b ON b.branch_id = vpb.branch_id 
        WHERE vpb.program_id = vp.program_id 
        LIMIT 1
      ), '') as branch_name,
      COALESCE((
        SELECT COUNT(iv.issued_voucher_id) 
        FROM issued_vouchers iv 
        WHERE iv.program_id = vp.program_id
      ), 0) as sold_count,
      (vp.issue_quantity - COALESCE((
        SELECT COUNT(iv.issued_voucher_id) 
        FROM issued_vouchers iv 
        WHERE iv.program_id = vp.program_id
      ), 0)) as stock,
      (
        SELECT json_agg(json_build_object(
          'image_id', vpi.image_id,
          'image_url', vpi.image_url,
          'is_primary', vpi.is_primary,
          'sort_order', vpi.sort_order
        ) ORDER BY vpi.is_primary DESC, vpi.sort_order ASC, vpi.image_id ASC)
        FROM voucher_program_images vpi
        WHERE vpi.program_id = vp.program_id
      ) as images
    FROM voucher_programs vp
    JOIN partners p ON p.user_id = vp.partner_id
    LEFT JOIN categories c ON c.category_id = vp.category_id
    ${whereClause}
    ORDER BY vp.program_id DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;
  const dataRes = await pool.query(dataQuery, [...params, limit, offset]);

  return {
    vouchers: dataRes.rows,
    stats: {
      all: parseInt(stats.total_all, 10),
      published: parseInt(stats.count_published, 10),
      hidden: parseInt(stats.count_hidden, 10),
      ended: parseInt(stats.count_ended, 10),
    },
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
 * HÀM: getManagedVoucherById
 * MỤC ĐÍCH: Lấy chi tiết voucher quản lý kèm thống kê đã bán, đã sử dụng (used_count), tồn kho.
 * -----------------------------------------------------------------------------------------
 */
export async function getManagedVoucherById(programId: number) {
  const query = `
    SELECT 
      vp.program_id,
      vp.program_name,
      vp.category_id,
      c.category_name,
      vp.original_price,
      vp.sale_price,
      vp.discount_amount,
      vp.issue_quantity,
      vp.sale_start_at,
      vp.sale_end_at,
      vp.use_start_at,
      vp.use_end_at,
      vp.display_status,
      p.user_id as partner_id,
      p.business_name as partner_name,
      p.tax_code,
      p.business_license_no,
      u.full_name as partner_representative,
      u.email as partner_email,
      u.phone as partner_phone,
      COALESCE((
        SELECT COUNT(iv.issued_voucher_id) 
        FROM issued_vouchers iv 
        WHERE iv.program_id = vp.program_id
      ), 0) as sold_count,
      (vp.issue_quantity - COALESCE((
        SELECT COUNT(iv.issued_voucher_id) 
        FROM issued_vouchers iv 
        WHERE iv.program_id = vp.program_id
      ), 0)) as stock,
      COALESCE((
        SELECT COUNT(iv.issued_voucher_id) 
        FROM issued_vouchers iv 
        WHERE iv.program_id = vp.program_id AND iv.usage_status = 'USED'
      ), 0) as used_count,
      (
        SELECT json_agg(json_build_object(
          'branch_id', b.branch_id,
          'branch_name', b.branch_name,
          'address', b.address,
          'region', b.region,
          'phone', b.phone,
          'status', b.status
        ))
        FROM voucher_program_branches vpb
        JOIN branches b ON b.branch_id = vpb.branch_id
        WHERE vpb.program_id = vp.program_id
      ) as branches,
      (
        SELECT json_agg(json_build_object(
          'image_id', vpi.image_id,
          'image_url', vpi.image_url,
          'is_primary', vpi.is_primary,
          'sort_order', vpi.sort_order
        ) ORDER BY vpi.is_primary DESC, vpi.sort_order ASC, vpi.image_id ASC)
        FROM voucher_program_images vpi
        WHERE vpi.program_id = vp.program_id
      ) as images
    FROM voucher_programs vp
    JOIN partners p ON p.user_id = vp.partner_id
    JOIN users u ON u.user_id = p.user_id
    LEFT JOIN categories c ON c.category_id = vp.category_id
    WHERE vp.program_id = $1
  `;
  const result = await pool.query(query, [programId]);

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy chương trình voucher.' };
  }

  return result.rows[0];
}

/**
 * -----------------------------------------------------------------------------------------
 * HÀM: updateVoucherDisplayStatus
 * MỤC ĐÍCH: 
 *   Thay đổi trạng thái hiển thị của voucher: Ẩn (`HIDDEN`), Hiện (`PUBLISHED`), hoặc Ngừng bán (`ENDED`).
 * 
 * QUY TẮC NGHIỆP VỤ:
 *   1. Nếu voucher đã ở trạng thái `ENDED` (Ngừng bán vĩnh viễn), không cho phép khôi phục.
 *   2. Nếu muốn chuyển sang `PUBLISHED` (Đang bán), kiểm tra:
 *      - Phải chưa quá hạn mở bán (`sale_end_at > now`).
 *      - Phải còn số lượng tồn kho (`sold_count < issue_quantity`).
 * -----------------------------------------------------------------------------------------
 */
export async function updateVoucherDisplayStatus(
  programId: number,
  adminId: number,
  newStatus: 'PUBLISHED' | 'HIDDEN' | 'ENDED'
) {
  const allowedStatuses = ['PUBLISHED', 'HIDDEN', 'ENDED'];
  if (!allowedStatuses.includes(newStatus)) {
    throw { status: 400, message: `Trạng thái ${newStatus} không hợp lệ.` };
  }

  const vpRes = await pool.query(
    'SELECT program_id, program_name, display_status, issue_quantity, sale_end_at FROM voucher_programs WHERE program_id = $1',
    [programId]
  );

  if (vpRes.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy chương trình voucher.' };
  }

  const voucher = vpRes.rows[0];

  // Không cho phép khôi phục khi voucher đã ở trạng thái ENDED
  if (voucher.display_status === 'ENDED' && newStatus !== 'ENDED') {
    throw { status: 400, message: 'Chương trình voucher đã ngừng bán vĩnh viễn, không thể khôi phục lại trạng thái.' };
  }

  // Nếu muốn khôi phục về PUBLISHED, kiểm tra xem đã hết hạn hoặc hết số lượng chưa
  if (newStatus === 'PUBLISHED') {
    const isExpired = new Date(voucher.sale_end_at).getTime() < Date.now();
    const soldRes = await pool.query(
      'SELECT COUNT(*) as sold FROM issued_vouchers WHERE program_id = $1',
      [programId]
    );
    const soldCount = parseInt(soldRes.rows[0]?.sold ?? '0', 10);
    const isOutOfStock = soldCount >= voucher.issue_quantity;

    if (isExpired) {
      throw { status: 400, message: 'Chương trình voucher đã quá hạn bán, không thể chuyển sang Đang bán.' };
    }
    if (isOutOfStock) {
      throw { status: 400, message: 'Chương trình voucher đã hết số lượng phát hành, không thể chuyển sang Đang bán.' };
    }
  }

  const actionMap: Record<string, string> = {
    HIDDEN: 'HIDE_VOUCHER',
    PUBLISHED: 'PUBLISH_VOUCHER',
    ENDED: 'END_VOUCHER',
  };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE voucher_programs SET display_status = $1 WHERE program_id = $2',
      [newStatus, programId]
    );

    await logAdminAction({
      userId: adminId,
      action: actionMap[newStatus] || 'UPDATE_VOUCHER_STATUS',
      objectId: String(programId),
      objectType: 'VOUCHER_PROGRAM',
      oldValue: { display_status: voucher.display_status },
      newValue: { display_status: newStatus, program_name: voucher.program_name },
      result: 'SUCCESS',
    });

    await client.query('COMMIT');

    return {
      message: `Đã cập nhật trạng thái voucher sang ${newStatus} thành công.`,
      program_id: programId,
      display_status: newStatus,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    await logAdminAction({
      userId: adminId,
      action: actionMap[newStatus] || 'UPDATE_VOUCHER_STATUS',
      objectId: String(programId),
      objectType: 'VOUCHER_PROGRAM',
      result: 'FAILED',
    });
    throw err;
  } finally {
    client.release();
  }
}
