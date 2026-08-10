import pool from '../../config/db.js';

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Tra cứu issued voucher theo mã.
 * Kiểm tra voucher phải thuộc chương trình của partner đang đăng nhập.
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
 * Xác nhận sử dụng (redeem) voucher tại điểm bán.
 * partnerId có thể là PARTNER hoặc PARTNER_EMPLOYEE (đã xác nhận branch ownership ở caller).
 */
export const redeemVoucher = async (
  voucherCode: string,
  branchId: number,
  partnerId: number  // partner_id của người đang đăng nhập (lấy từ partner_employees nếu là employee)
) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lấy và khóa voucher để hai request không thể redeem đồng thời
    const voucherResult = await client.query(
      `SELECT
         iv.issued_voucher_id, iv.usage_status, iv.expires_at, iv.program_id
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

    if (new Date(voucher.expires_at) < new Date()) {
      throw { status: 400, message: 'Voucher đã hết hạn sử dụng.' };
    }

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
