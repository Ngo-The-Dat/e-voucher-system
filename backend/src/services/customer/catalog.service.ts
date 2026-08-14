import pool from '../../config/db.js';

export interface GetCatalogVouchersFilter {
  search?: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

/**
 * Lấy danh sách Voucher đang công bố bán cho Khách hàng (Public API - FR-05, FR-06)
 */
export async function getCatalogVouchers(filter: GetCatalogVouchersFilter = {}) {
  const page = Math.max(1, Number(filter.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(filter.limit) || 12));
  const offset = (page - 1) * limit;

  const conditions: string[] = [
    "vp.display_status = 'PUBLISHED'",
    "(vp.sale_start_at IS NULL OR vp.sale_start_at <= CURRENT_TIMESTAMP)",
    "(vp.sale_end_at IS NULL OR vp.sale_end_at >= CURRENT_TIMESTAMP)",
  ];
  const params: any[] = [];
  let paramIdx = 1;

  if (filter.search && filter.search.trim()) {
    const searchVal = `%${filter.search.trim()}%`;
    conditions.push(`(vp.program_name ILIKE $${paramIdx} OR p.business_name ILIKE $${paramIdx} OR c.category_name ILIKE $${paramIdx})`);
    params.push(searchVal);
    paramIdx++;
  }

  if (filter.category_id && !isNaN(Number(filter.category_id))) {
    conditions.push(`vp.category_id = $${paramIdx}`);
    params.push(Number(filter.category_id));
    paramIdx++;
  }

  if (filter.min_price !== undefined && !isNaN(Number(filter.min_price))) {
    conditions.push(`vp.sale_price >= $${paramIdx}`);
    params.push(Number(filter.min_price));
    paramIdx++;
  }

  if (filter.max_price !== undefined && !isNaN(Number(filter.max_price))) {
    conditions.push(`vp.sale_price <= $${paramIdx}`);
    params.push(Number(filter.max_price));
    paramIdx++;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  // Sorting
  let orderBy = 'vp.program_id DESC';
  if (filter.sort === 'price_asc') orderBy = 'vp.sale_price ASC';
  else if (filter.sort === 'price_desc') orderBy = 'vp.sale_price DESC';
  else if (filter.sort === 'popular') orderBy = 'sold_count DESC';
  else if (filter.sort === 'newest') orderBy = 'vp.program_id DESC';

  const countQuery = `
    SELECT COUNT(*) as total
    FROM voucher_programs vp
    LEFT JOIN categories c ON c.category_id = vp.category_id
    LEFT JOIN partners p ON p.user_id = vp.partner_id
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0].total, 10);

  const dataQuery = `
    SELECT 
      vp.program_id,
      vp.program_name,
      vp.original_price,
      vp.sale_price,
      vp.discount_amount,
      vp.issue_quantity,
      vp.sale_start_at,
      vp.sale_end_at,
      vp.use_start_at,
      vp.use_end_at,
      c.category_name,
      p.business_name,
      COALESCE((
        SELECT COUNT(iv.issued_voucher_id)
        FROM issued_vouchers iv
        WHERE iv.program_id = vp.program_id
      ), 0)::int as sold_count,
      (vp.issue_quantity - COALESCE((
        SELECT COUNT(iv.issued_voucher_id)
        FROM issued_vouchers iv
        WHERE iv.program_id = vp.program_id
      ), 0))::int as available_stock,
      COALESCE((
        SELECT AVG(rf.rating)
        FROM reviews_feedback rf
        JOIN issued_vouchers iv ON iv.issued_voucher_id = rf.issued_voucher_id
        WHERE iv.program_id = vp.program_id
      ), 4.8)::float as avg_rating,
      COALESCE((
        SELECT COUNT(rf.review_id)
        FROM reviews_feedback rf
        JOIN issued_vouchers iv ON iv.issued_voucher_id = rf.issued_voucher_id
        WHERE iv.program_id = vp.program_id
      ), 0)::int as reviews_count
    FROM voucher_programs vp
    LEFT JOIN categories c ON c.category_id = vp.category_id
    LEFT JOIN partners p ON p.user_id = vp.partner_id
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  const dataRes = await pool.query(dataQuery, [...params, limit, offset]);

  return {
    vouchers: dataRes.rows.map((row) => ({
      program_id: Number(row.program_id),
      program_name: row.program_name,
      original_price: Number(row.original_price),
      sale_price: Number(row.sale_price),
      discount_amount: Number(row.discount_amount),
      issue_quantity: Number(row.issue_quantity),
      sold_count: Number(row.sold_count),
      available_stock: Math.max(0, Number(row.available_stock)),
      sale_start_at: row.sale_start_at,
      sale_end_at: row.sale_end_at,
      use_start_at: row.use_start_at,
      use_end_at: row.use_end_at,
      description: row.program_name,
      terms_conditions: 'Áp dụng theo quy định của đối tác.',
      category_name: row.category_name || 'Khác',
      business_name: row.business_name || 'Đối tác',
      avg_rating: Math.round(Number(row.avg_rating) * 10) / 10,
      reviews_count: Number(row.reviews_count),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Lấy chi tiết 1 Voucher đang mở bán (FR-07)
 */
export async function getCatalogVoucherById(programId: number) {
  const query = `
    SELECT 
      vp.program_id,
      vp.program_name,
      vp.original_price,
      vp.sale_price,
      vp.discount_amount,
      vp.issue_quantity,
      vp.sale_start_at,
      vp.sale_end_at,
      vp.use_start_at,
      vp.use_end_at,
      c.category_name,
      p.business_name,
      COALESCE((
        SELECT COUNT(iv.issued_voucher_id)
        FROM issued_vouchers iv
        WHERE iv.program_id = vp.program_id
      ), 0)::int as sold_count,
      (vp.issue_quantity - COALESCE((
        SELECT COUNT(iv.issued_voucher_id)
        FROM issued_vouchers iv
        WHERE iv.program_id = vp.program_id
      ), 0))::int as available_stock,
      ARRAY(
        SELECT b.branch_name
        FROM voucher_program_branches vpb
        JOIN branches b ON b.branch_id = vpb.branch_id
        WHERE vpb.program_id = vp.program_id
      ) as branch_names,
      ARRAY(
        SELECT b.address
        FROM voucher_program_branches vpb
        JOIN branches b ON b.branch_id = vpb.branch_id
        WHERE vpb.program_id = vp.program_id
      ) as branch_addresses
    FROM voucher_programs vp
    LEFT JOIN categories c ON c.category_id = vp.category_id
    LEFT JOIN partners p ON p.user_id = vp.partner_id
    WHERE vp.program_id = $1 AND vp.display_status = 'PUBLISHED'
  `;

  const res = await pool.query(query, [programId]);
  if (res.rows.length === 0) {
    throw { status: 404, message: 'Voucher không tồn tại hoặc hiện không công bố bán.' };
  }

  const row = res.rows[0];

  // Lấy các đánh giá công khai của voucher này (FR-22)
  const reviewsQuery = `
    SELECT 
      rf.review_id,
      rf.rating,
      rf.review_content as comment,
      rf.submitted_at as created_at,
      u.full_name as author_name
    FROM reviews_feedback rf
    JOIN issued_vouchers iv ON iv.issued_voucher_id = rf.issued_voucher_id
    JOIN users u ON u.user_id = iv.owner_user_id
    WHERE iv.program_id = $1
    ORDER BY rf.submitted_at DESC
  `;
  const reviewsRes = await pool.query(reviewsQuery, [programId]);

  return {
    program_id: Number(row.program_id),
    program_name: row.program_name,
    original_price: Number(row.original_price),
    sale_price: Number(row.sale_price),
    discount_amount: Number(row.discount_amount),
    issue_quantity: Number(row.issue_quantity),
    sold_count: Number(row.sold_count),
    available_stock: Math.max(0, Number(row.available_stock)),
    sale_start_at: row.sale_start_at,
    sale_end_at: row.sale_end_at,
    use_start_at: row.use_start_at,
    use_end_at: row.use_end_at,
    description: row.program_name,
    terms_conditions: 'Áp dụng theo quy định của đối tác.',
    category_name: row.category_name || 'Khác',
    business_name: row.business_name || 'Đối tác',
    branches: row.branch_names || [],
    addresses: row.branch_addresses || [],
    reviews: reviewsRes.rows.map((r) => ({
      review_id: Number(r.review_id),
      rating: Number(r.rating),
      comment: r.comment,
      created_at: r.created_at,
      author_name: r.author_name,
    })),
  };
}
