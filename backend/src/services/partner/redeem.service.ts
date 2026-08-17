/**
 * @file redeem.service.ts
 * @description Service xử lý nghiệp vụ tra cứu và đổi voucher (Redeem) tại quầy cửa hàng:
 * - Tra cứu thông tin voucher đã phát hành (`issued_vouchers`) kèm điều kiện áp dụng, danh sách chi nhánh và thông tin khách hàng.
 * - Tra cứu qua payload mã QR.
 * - Nghiệp vụ Redeem Voucher với cơ chế kiểm soát đồng thời (Concurrency Control): sử dụng Transaction và khóa bi quan
 *   `FOR UPDATE OF iv` để chống triệt để lỗi Double Spending (hai thu ngân cùng quét 1 voucher đồng thời).
 */

import pool from '../../config/db.js';

// ─── Service Methods ──────────────────────────────────────────────────────────

/**
 * Tra cứu thông tin chi tiết của voucher đã phát hành (`issued_vouchers`) theo mã code.
 * 
 * @description
 * Đảm bảo tính bảo mật: chỉ cho phép tra cứu nếu voucher thuộc chương trình của đối tác chủ quản (`vp.partner_id = $2`).
 * 
 * @param voucherCode Chuỗi mã voucher (VD: 'VOUCHER-ABC-123')
 * @param partnerId User ID của đối tác chủ quản
 * @returns Thông tin voucher kèm giá, chi nhánh áp dụng và người sở hữu
 * @throws {Object} Lỗi HTTP 404 nếu mã không tồn tại hoặc không thuộc đối tác
 */
export const lookupVoucher = async (voucherCode: string, partnerId: number) => {
  const result = await pool.query(
    `SELECT
       iv.issued_voucher_id, iv.voucher_code, iv.usage_status,
       iv.issued_at, iv.expires_at, iv.used_at, iv.discount_amount,
       iv.applicable_region, iv.qr_code,
       vp.program_name, vp.original_price, vp.sale_price, vp.use_start_at, vp.use_end_at,
       c.category_name,
       ARRAY(SELECT vpb.branch_id FROM voucher_program_branches vpb WHERE vpb.program_id = vp.program_id) AS branch_ids,
       ARRAY(SELECT b.branch_name FROM voucher_program_branches vpb JOIN branches b ON b.branch_id = vpb.branch_id WHERE vpb.program_id = vp.program_id) AS branch_names,
       u.full_name AS owner_full_name, u.email AS owner_email, u.phone AS owner_phone
     FROM issued_vouchers iv
     JOIN voucher_programs vp ON iv.program_id = vp.program_id
     LEFT JOIN categories c ON c.category_id = vp.category_id
     JOIN users u ON iv.owner_user_id = u.user_id
     -- Đảm bảo voucher thuộc chương trình của partner này
     WHERE iv.voucher_code = $1
       AND vp.partner_id = $2`,
    [voucherCode, partnerId]
  );

  if (result.rows.length === 0) {
    throw {
      status: 404,
      message: 'Không tìm thấy voucher hoặc voucher không thuộc hệ thống của bạn.',
    };
  }

  return result.rows[0];
};

/**
 * Tra cứu voucher từ giá trị quét được từ mã QR.
 * Chấp nhận cả chuỗi payload định danh QR hoặc raw voucher code (để tương thích ngược).
 * 
 * @param qrValue Chuỗi giá trị quét từ mã QR
 * @param partnerId User ID của đối tác chủ quản
 * @returns Chi tiết bản ghi voucher
 * @throws {Object} Lỗi HTTP 404 nếu không tìm thấy hoặc HTTP 409 nếu mã QR bị trùng
 */
export const lookupVoucherByQr = async (qrValue: string, partnerId: number) => {
  const result = await pool.query(
    `SELECT
       iv.issued_voucher_id, iv.voucher_code, iv.usage_status,
       iv.issued_at, iv.expires_at, iv.used_at, iv.discount_amount,
       iv.applicable_region, iv.qr_code,
       vp.program_name, vp.original_price, vp.sale_price, vp.use_start_at, vp.use_end_at,
       c.category_name,
       ARRAY(SELECT vpb.branch_id FROM voucher_program_branches vpb WHERE vpb.program_id = vp.program_id) AS branch_ids,
       ARRAY(SELECT b.branch_name FROM voucher_program_branches vpb JOIN branches b ON b.branch_id = vpb.branch_id WHERE vpb.program_id = vp.program_id) AS branch_names,
       u.full_name AS owner_full_name, u.email AS owner_email, u.phone AS owner_phone
     FROM issued_vouchers iv
     JOIN voucher_programs vp ON iv.program_id = vp.program_id
     LEFT JOIN categories c ON c.category_id = vp.category_id
     JOIN users u ON iv.owner_user_id = u.user_id
     WHERE (iv.qr_code = $1 OR iv.voucher_code = UPPER($1))
       AND vp.partner_id = $2
     LIMIT 2`,
    [qrValue, partnerId]
  );

  if (result.rows.length === 0) {
    throw {
      status: 404,
      message: 'Không tìm thấy voucher hoặc voucher không thuộc hệ thống của bạn.',
    };
  }
  if (result.rows.length > 1) {
    throw {
      status: 409,
      message: 'Mã QR bị trùng trong hệ thống. Vui lòng liên hệ quản trị viên.',
    };
  }

  return result.rows[0];
};

/**
 * Xác nhận sử dụng (Redeem) voucher tại chi nhánh cửa hàng.
 * 
 * @description
 * Thuật toán xử lý giao dịch an toàn (Concurrency & Race Condition Control):
 * 1. Mở Transaction `BEGIN`.
 * 2. Khóa dòng bản ghi voucher `FOR UPDATE OF iv` để chặn mọi request song song khác cùng cố đổi voucher này.
 * 3. Kiểm tra trạng thái hiện tại (`usage_status` phải là `UNUSED`).
 * 4. Kiểm tra thời hạn: `NOW() >= use_start_at` và `NOW() <= expires_at`.
 * 5. Kiểm tra tính hợp lệ của chi nhánh: Chi nhánh (`branchId`) phải nằm trong danh sách chi nhánh áp dụng của chương trình và đang `ACTIVE`.
 * 6. Thực hiện câu lệnh cập nhật `UPDATE issued_vouchers SET usage_status = 'USED', used_at = NOW() WHERE usage_status = 'UNUSED'`.
 * 7. Kiểm tra `rowCount`: nếu bằng 0 chứng tỏ đã bị request khác thay đổi ngay trước đó -> quăng lỗi HTTP 409 Conflict.
 * 8. `COMMIT` Transaction và trả về thời điểm đổi thành công.
 * 
 * @param voucherCode Mã voucher cần đổi
 * @param branchId ID chi nhánh nơi khách hàng đang đổi voucher
 * @param partnerId User ID của đối tác chủ quản
 * @returns { issued_voucher_id, voucher_code, redeemed_at, message }
 */
export const redeemVoucher = async (
  voucherCode: string,
  branchId: number,
  partnerId: number
) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lấy và khóa dòng bản ghi voucher bằng khóa bi quan (Pessimistic Lock)
    const voucherResult = await client.query(
      `SELECT
         iv.issued_voucher_id, iv.usage_status, iv.expires_at, iv.program_id,
         vp.use_start_at
       FROM issued_vouchers iv
       JOIN voucher_programs vp ON iv.program_id = vp.program_id
       WHERE iv.voucher_code = $1 AND vp.partner_id = $2
       FOR UPDATE OF iv`,
      [voucherCode, partnerId]
    );

    if (voucherResult.rows.length === 0) {
      throw { status: 404, message: 'Không tìm thấy voucher hoặc voucher không thuộc hệ thống của bạn.' };
    }

    const voucher = voucherResult.rows[0];

    // 2. Kiểm tra trạng thái sử dụng của voucher
    if (voucher.usage_status !== 'UNUSED') {
      const statusMessages: Record<string, string> = {
        USED: 'Voucher này đã được sử dụng rồi.',
        EXPIRED: 'Voucher đã hết hạn.',
        CANCELLED: 'Voucher đã bị hủy.',
      };
      throw {
        status: 400,
        message: statusMessages[voucher.usage_status] || `Voucher ở trạng thái không hợp lệ: ${voucher.usage_status}`,
      };
    }

    // 3. Kiểm tra ngày bắt đầu cho phép sử dụng
    if (new Date(voucher.use_start_at) > new Date()) {
      throw { status: 400, message: 'Voucher chưa đến thời gian sử dụng.' };
    }

    // 4. Kiểm tra ngày hết hạn sử dụng
    if (new Date(voucher.expires_at) < new Date()) {
      throw { status: 400, message: 'Voucher đã hết hạn sử dụng.' };
    }

    // 5. Kiểm tra chi nhánh này có được phép áp dụng voucher này không
    const branchCheck = await client.query(
      `SELECT 1
       FROM voucher_program_branches vpb
       JOIN branches b ON b.branch_id = vpb.branch_id
       WHERE vpb.program_id = $1 AND vpb.branch_id = $2
         AND b.partner_id = $3 AND b.status = 'ACTIVE'`,
      [voucher.program_id, branchId, partnerId]
    );
    if (branchCheck.rows.length === 0) {
      throw { status: 400, message: 'Chi nhánh này không nằm trong danh sách áp dụng của voucher.' };
    }

    // 6. Cập nhật trạng thái sang USED và ghi nhận thời điểm used_at
    const updateResult = await client.query(
      `UPDATE issued_vouchers
       SET usage_status = 'USED', used_at = NOW()
       WHERE issued_voucher_id = $1 AND usage_status = 'UNUSED'
       RETURNING used_at`,
      [voucher.issued_voucher_id]
    );

    if (updateResult.rows.length === 0) {
      throw { status: 409, message: 'Voucher vừa được sử dụng bởi một yêu cầu khác.' };
    }

    await client.query('COMMIT');
    return {
      issued_voucher_id: voucher.issued_voucher_id,
      voucher_code: voucherCode,
      redeemed_at: updateResult.rows[0].used_at,
      message: 'Voucher đã được xác nhận sử dụng thành công.',
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
