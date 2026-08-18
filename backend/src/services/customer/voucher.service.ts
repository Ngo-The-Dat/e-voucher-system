import pool from '../../config/db.js';

/**
 * Lấy danh sách Voucher đã phát hành thuộc sở hữu của Khách hàng (Kho voucher)
 */
export async function getCustomerVouchers(customerId: number, statusFilter?: string) {
  const conditions: string[] = ['iv.owner_user_id = $1'];
  const params: any[] = [customerId];

  if (statusFilter && statusFilter !== 'ALL') {
    conditions.push('iv.usage_status = $2');
    params.push(statusFilter);
  }

  const query = `
    SELECT 
      iv.issued_voucher_id,
      iv.voucher_code,
      iv.usage_status,
      iv.issued_at,
      iv.expires_at,
      iv.used_at,
      iv.discount_amount,
      vp.program_id,
      vp.program_name,
      vp.original_price,
      vp.sale_price,
      vp.use_start_at,
      vp.use_end_at,
      c.category_name,
      p.business_name,
      p.brand_logo as partner_logo,
      o.order_id,
      o.created_at as purchase_date,
      o.payment_method
    FROM issued_vouchers iv
    JOIN voucher_programs vp ON vp.program_id = iv.program_id
    LEFT JOIN categories c ON c.category_id = vp.category_id
    LEFT JOIN partners p ON p.user_id = vp.partner_id
    LEFT JOIN order_items oi ON oi.order_item_id = iv.order_item_id
    LEFT JOIN orders o ON o.order_id = oi.order_id
    WHERE ${conditions.join(' AND ')} AND (o.payment_status = 'PAID' OR o.payment_status IS NULL)
    ORDER BY iv.issued_at DESC
  `;

  const res = await pool.query(query, params);

  return res.rows.map((row) => ({
    issued_voucher_id: Number(row.issued_voucher_id),
    voucher_code: row.voucher_code,
    usage_status: row.usage_status,
    issued_at: row.issued_at,
    expires_at: row.expires_at,
    used_at: row.used_at,
    discount_amount: Number(row.discount_amount),
    program_id: Number(row.program_id),
    program_name: row.program_name,
    original_price: Number(row.original_price),
    sale_price: Number(row.sale_price),
    use_start_at: row.use_start_at,
    use_end_at: row.use_end_at,
    category_name: row.category_name,
    business_name: row.business_name,
    partner_logo: row.partner_logo || null,
    order_id: row.order_id ? Number(row.order_id) : null,
    purchase_date: row.purchase_date,
    payment_method: row.payment_method,
  }));
}

/**
 * Lấy chi tiết 1 Voucher phát hành của Khách hàng
 */
export async function getCustomerVoucherById(customerId: number, issuedVoucherId: number) {
  const query = `
    SELECT 
      iv.issued_voucher_id,
      iv.voucher_code,
      iv.usage_status,
      iv.issued_at,
      iv.expires_at,
      iv.used_at,
      iv.discount_amount,
      vp.program_id,
      vp.program_name,
      c.description as description,
      vp.original_price,
      vp.sale_price,
      vp.use_start_at,
      vp.use_end_at,
      c.category_name,
      p.business_name,
      p.brand_logo as partner_logo,
      ARRAY(
        SELECT b.branch_name 
        FROM voucher_program_branches vpb 
        JOIN branches b ON b.branch_id = vpb.branch_id 
        WHERE vpb.program_id = vp.program_id
      ) AS applicable_branches,
      ARRAY(
        SELECT b.address 
        FROM voucher_program_branches vpb 
        JOIN branches b ON b.branch_id = vpb.branch_id 
        WHERE vpb.program_id = vp.program_id
      ) AS applicable_addresses,
      o.order_id,
      o.created_at as purchase_date,
      o.payment_method,
      o.payment_status,
      o.order_status
    FROM issued_vouchers iv
    JOIN voucher_programs vp ON vp.program_id = iv.program_id
    LEFT JOIN categories c ON c.category_id = vp.category_id
    LEFT JOIN partners p ON p.user_id = vp.partner_id
    LEFT JOIN order_items oi ON oi.order_item_id = iv.order_item_id
    LEFT JOIN orders o ON o.order_id = oi.order_id
    WHERE iv.issued_voucher_id = $1 AND iv.owner_user_id = $2 AND (o.payment_status = 'PAID' OR o.payment_status IS NULL)
  `;

  const res = await pool.query(query, [issuedVoucherId, customerId]);
  if (res.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy voucher hoặc bạn không có quyền xem.' };
  }

  const row = res.rows[0];
  return {
    issued_voucher_id: Number(row.issued_voucher_id),
    voucher_code: row.voucher_code,
    usage_status: row.usage_status,
    issued_at: row.issued_at,
    expires_at: row.expires_at,
    used_at: row.used_at,
    discount_amount: Number(row.discount_amount),
    program_id: Number(row.program_id),
    program_name: row.program_name,
    description: row.description,
    original_price: Number(row.original_price),
    sale_price: Number(row.sale_price),
    use_start_at: row.use_start_at,
    use_end_at: row.use_end_at,
    category_name: row.category_name,
    business_name: row.business_name,
    partner_logo: row.partner_logo,
    applicable_branches: row.applicable_branches || [],
    applicable_addresses: row.applicable_addresses || [],
    order_id: row.order_id ? Number(row.order_id) : null,
    purchase_date: row.purchase_date,
    payment_method: row.payment_method,
    payment_status: row.payment_status || 'PAID',
    order_status: row.order_status || 'COMPLETED',
  };
}
