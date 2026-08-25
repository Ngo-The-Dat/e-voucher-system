import pool from '../../config/db.js';

export interface GetPublicVouchersFilter {
  search?: string;
  category_id?: number | string;
  category_name?: string;
  min_price?: number;
  max_price?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'rating';
  page?: number;
  limit?: number;
}

export async function getPublicVouchers(filter: GetPublicVouchersFilter = {}) {
  const page = Math.max(1, Number(filter.page) || 1);
  const limit = Math.max(1, Number(filter.limit) || 12);
  const offset = (page - 1) * limit;

  const conditions: string[] = ["vp.display_status = 'PUBLISHED'"];
  const params: any[] = [];
  let paramIdx = 1;

  if (filter.search && filter.search.trim()) {
    const searchPattern = `%${filter.search.trim()}%`;
    conditions.push(`(
      vp.program_name ILIKE $${paramIdx} OR
      p.business_name ILIKE $${paramIdx} OR
      c.category_name ILIKE $${paramIdx}
    )`);
    params.push(searchPattern);
    paramIdx++;
  }

  if (filter.category_id && filter.category_id !== 'ALL') {
    conditions.push(`vp.category_id = $${paramIdx}`);
    params.push(Number(filter.category_id));
    paramIdx++;
  } else if (filter.category_name && filter.category_name.trim()) {
    conditions.push(`c.category_name ILIKE $${paramIdx}`);
    params.push(filter.category_name.trim());
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

  // Sort order
  let orderBy = 'vp.program_id DESC';
  if (filter.sort === 'price_asc') {
    orderBy = 'vp.sale_price ASC';
  } else if (filter.sort === 'price_desc') {
    orderBy = 'vp.sale_price DESC';
  } else if (filter.sort === 'popular') {
    orderBy = 'sold_count DESC';
  } else if (filter.sort === 'rating') {
    orderBy = 'average_rating DESC';
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM voucher_programs vp
    LEFT JOIN categories c ON c.category_id = vp.category_id
    LEFT JOIN partners p ON p.user_id = vp.partner_id
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0]?.total ?? '0', 10);

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
      vp.display_status,
      c.category_id,
      c.category_name,
      p.user_id as partner_id,
      p.business_name as brand_name,
      p.brand_logo as brand_logo,
      (
        SELECT COALESCE(COUNT(iv.issued_voucher_id), 0)::int
        FROM issued_vouchers iv
        WHERE iv.program_id = vp.program_id
      ) as sold_count,
      (
        SELECT COALESCE(ROUND(AVG(rf.rating), 1), 5.0)::float
        FROM reviews_feedback rf
        JOIN issued_vouchers iv ON rf.issued_voucher_id = iv.issued_voucher_id
        WHERE iv.program_id = vp.program_id
      ) as average_rating,
      (
        SELECT COALESCE(COUNT(rf.review_id), 0)::int
        FROM reviews_feedback rf
        JOIN issued_vouchers iv ON rf.issued_voucher_id = iv.issued_voucher_id
        WHERE iv.program_id = vp.program_id
      ) as reviews_count,
      (
        SELECT json_agg(vpi.image_url ORDER BY vpi.is_primary DESC, vpi.sort_order ASC)
        FROM voucher_program_images vpi
        WHERE vpi.program_id = vp.program_id
      ) as images
    FROM voucher_programs vp
    LEFT JOIN categories c ON c.category_id = vp.category_id
    LEFT JOIN partners p ON p.user_id = vp.partner_id
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  const dataRes = await pool.query(dataQuery, [...params, limit, offset]);

  const defaultThumbnail = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80";

  const vouchers = dataRes.rows.map((row) => {
    const salePrice = Number(row.sale_price);
    const originalPrice = Number(row.original_price);
    const issueQuantity = Number(row.issue_quantity);
    const soldCount = Number(row.sold_count);
    const availableStock = Math.max(0, issueQuantity - soldCount);
    const discountPercent = originalPrice > 0 ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0;
    const imagesList = Array.isArray(row.images) && row.images.length > 0 ? row.images : [defaultThumbnail];

    return {
      id: String(row.program_id),
      program_id: Number(row.program_id),
      title: row.program_name,
      brand: row.brand_name || "Thương hiệu đối tác",
      brandLogo: row.brand_logo || null,
      category: row.category_name || "Khác",
      merchant: row.brand_name || "Thương hiệu đối tác",
      thumbnail: imagesList[0],
      images: imagesList,
      price: salePrice,
      originalPrice: originalPrice,
      discountBadge: discountPercent > 0 ? `Giảm ${discountPercent}%` : undefined,
      rating: Number(row.average_rating) || 5.0,
      reviewsCount: Number(row.reviews_count) || 0,
      soldCount: `${soldCount}`,
      availableStock,
      description: row.program_name,
      terms_conditions: "Áp dụng tại các chi nhánh được chỉ định trong thời gian hiệu lực.",
      expiryDate: row.use_end_at ? new Date(row.use_end_at).toLocaleDateString("vi-VN") : "31/12/2026",
    };
  });

  return {
    vouchers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getPublicVoucherById(programId: number) {
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
      vp.display_status,
      c.category_id,
      c.category_name,
      p.user_id as partner_id,
      p.business_name as brand_name,
      p.brand_logo as brand_logo,
      (
        SELECT COALESCE(COUNT(iv.issued_voucher_id), 0)::int
        FROM issued_vouchers iv
        WHERE iv.program_id = vp.program_id
      ) as sold_count,
      (
        SELECT json_agg(vpi.image_url ORDER BY vpi.is_primary DESC, vpi.sort_order ASC)
        FROM voucher_program_images vpi
        WHERE vpi.program_id = vp.program_id
      ) as images,
      (
        SELECT json_agg(json_build_object(
          'branch_id', b.branch_id,
          'branch_name', b.branch_name,
          'address', b.address,
          'region', b.region
        ))
        FROM voucher_program_branches vpb
        JOIN branches b ON b.branch_id = vpb.branch_id
        WHERE vpb.program_id = vp.program_id AND b.status = 'ACTIVE'
      ) as branches
    FROM voucher_programs vp
    LEFT JOIN categories c ON c.category_id = vp.category_id
    LEFT JOIN partners p ON p.user_id = vp.partner_id
    WHERE vp.program_id = $1 AND vp.display_status = 'PUBLISHED'
  `;

  const res = await pool.query(query, [programId]);
  if (res.rows.length === 0) {
    throw { status: 404, message: 'Voucher không tồn tại hoặc tạm ngưng mở bán.' };
  }

  const row = res.rows[0];
  const salePrice = Number(row.sale_price);
  const originalPrice = Number(row.original_price);
  const issueQuantity = Number(row.issue_quantity);
  const soldCount = Number(row.sold_count);
  const availableStock = Math.max(0, issueQuantity - soldCount);
  const discountPercent = originalPrice > 0 ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0;
  const defaultThumbnail = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80";
  const imagesList = Array.isArray(row.images) && row.images.length > 0 ? row.images : [defaultThumbnail];
  const branches = row.branches || [];
  const locationsStr = branches.map((b: any) => `${b.branch_name} (${b.address})`).join('; ') || "Áp dụng toàn quốc.";

  // Reviews query
  const reviewsRes = await pool.query(
    `SELECT 
       rf.review_id,
       rf.rating,
       rf.review_content,
       rf.complaint_content,
       rf.submitted_at,
       u.full_name as customer_name
     FROM reviews_feedback rf
     JOIN issued_vouchers iv ON rf.issued_voucher_id = iv.issued_voucher_id
     JOIN users u ON u.user_id = rf.customer_id
     WHERE iv.program_id = $1
     ORDER BY rf.submitted_at DESC
     LIMIT 50`,
    [programId]
  );

  const reviewsList = reviewsRes.rows.map((r) => ({
    author: r.customer_name || "Khách hàng",
    avatarLetter: (r.customer_name || "K").charAt(0).toUpperCase(),
    avatarBg: "bg-primary-container text-on-primary-container",
    rating: Number(r.rating) || 5,
    timeAgo: new Date(r.submitted_at).toLocaleDateString("vi-VN"),
    content: r.review_content || "Khách hàng hài lòng về dịch vụ.",
    complaint: r.complaint_content || undefined,
  }));

  const avgRating = reviewsList.length > 0 
    ? parseFloat((reviewsList.reduce((s, r) => s + r.rating, 0) / reviewsList.length).toFixed(1))
    : 5.0;

  return {
    id: String(row.program_id),
    program_id: Number(row.program_id),
    title: row.program_name,
    brand: row.brand_name || "Thương hiệu đối tác",
    brandLogo: row.brand_logo || null,
    category: row.category_name || "Khác",
    merchant: row.brand_name || "Thương hiệu đối tác",
    thumbnail: imagesList[0],
    images: imagesList,
    price: salePrice,
    originalPrice: originalPrice,
    discountBadge: discountPercent > 0 ? `Giảm ${discountPercent}%` : undefined,
    rating: avgRating,
    reviewsCount: reviewsList.length,
    soldCount: `${soldCount}`,
    availableStock,
    description: row.program_name,
    terms_conditions: "Áp dụng tại các chi nhánh được chỉ định trong thời gian hiệu lực.",
    conditions: ["Áp dụng tại các chi nhánh hợp lệ trong thời gian mở bán.", "Không có giá trị quy đổi thành tiền mặt."],
    location: locationsStr,
    branches,
    guideSteps: [
      "Đến cửa hàng hoặc chi nhánh áp dụng.",
      "Đưa mã QR voucher cho nhân viên thu ngân quét.",
      "Thưởng thức ưu đãi tuyệt vời!"
    ],
    reviews: reviewsList,
    expiryDate: row.use_end_at ? new Date(row.use_end_at).toLocaleDateString("vi-VN") : "31/12/2026",
  };
}

export async function getPublicCategories() {
  const res = await pool.query(
    `SELECT 
       c.category_id, 
       c.category_name, 
       c.description,
       (
         SELECT COUNT(*) 
         FROM voucher_programs vp 
         WHERE vp.category_id = c.category_id 
           AND vp.display_status = 'PUBLISHED'
       )::int as voucher_count,
       (
         SELECT COUNT(*)
         FROM issued_vouchers iv
         JOIN voucher_programs vp ON vp.program_id = iv.program_id
         WHERE vp.category_id = c.category_id
       )::int as total_sold
     FROM categories c 
     WHERE c.status = 'ACTIVE' 
     ORDER BY total_sold DESC, voucher_count DESC, c.category_id ASC`
  );
  return res.rows.map((row) => ({
    category_id: Number(row.category_id),
    category_name: row.category_name,
    description: row.description,
    voucher_count: Number(row.voucher_count || 0),
    total_sold: Number(row.total_sold || 0),
  }));
}

function normalizeTargetUrl(programId?: number | null, rawTargetUrl?: string | null): string {
  if (programId) {
    return `/vouchers/${programId}`;
  }
  if (rawTargetUrl) {
    const trimmed = rawTargetUrl.trim();
    const match = trimmed.match(/\/(?:programs|vouchers)\/(\d+)/i);
    if (match && match[1]) {
      return `/vouchers/${match[1]}`;
    }
    return trimmed;
  }
  return '/vouchers';
}

export async function getPublicBanners(position?: string) {
  const conditions = [
    "b.status = 'ACTIVE'",
    "(b.display_from IS NULL OR b.display_from <= CURRENT_TIMESTAMP)",
    "(b.display_to IS NULL OR b.display_to >= CURRENT_TIMESTAMP)",
  ];
  const params: any[] = [];
  if (position && position !== 'ALL') {
    params.push(position);
    conditions.push(`b.display_position = $${params.length}`);
  }

  const query = `
    SELECT 
      b.banner_id,
      b.program_id,
      b.title,
      b.image_url,
      b.target_url,
      b.display_position,
      vp.program_name,
      vp.original_price,
      vp.sale_price,
      p.business_name as brand_name,
      p.brand_logo as brand_logo
    FROM banners b
    LEFT JOIN voucher_programs vp ON vp.program_id = b.program_id
    LEFT JOIN partners p ON p.user_id = vp.partner_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY b.banner_id DESC
    LIMIT 5
  `;
  const res = await pool.query(query, params);
  return res.rows.map((row) => ({
    banner_id: Number(row.banner_id),
    program_id: row.program_id ? Number(row.program_id) : null,
    title: row.title,
    image_url: row.image_url,
    target_url: normalizeTargetUrl(row.program_id ? Number(row.program_id) : null, row.target_url),
    display_position: row.display_position,
    program_name: row.program_name || null,
    original_price: row.original_price ? Number(row.original_price) : null,
    sale_price: row.sale_price ? Number(row.sale_price) : null,
    brand_name: row.brand_name || null,
    brand_logo: row.brand_logo || null,
  }));
}

export async function getPublicActivePopups() {
  const query = `
    SELECT 
      p.popup_id,
      p.program_id,
      p.title,
      p.content,
      p.target_url,
      p.image_url,
      p.start_at,
      p.end_at,
      vp.program_name,
      vp.original_price,
      vp.sale_price,
      pt.business_name as brand_name,
      pt.brand_logo as brand_logo
    FROM popups p
    LEFT JOIN voucher_programs vp ON vp.program_id = p.program_id
    LEFT JOIN partners pt ON pt.user_id = vp.partner_id
    WHERE p.status = 'ACTIVE'
      AND (p.start_at IS NULL OR p.start_at <= CURRENT_TIMESTAMP)
      AND (p.end_at IS NULL OR p.end_at >= CURRENT_TIMESTAMP)
    ORDER BY p.popup_id DESC
    LIMIT 5
  `;
  const res = await pool.query(query);
  return res.rows.map((row) => ({
    popup_id: Number(row.popup_id),
    program_id: row.program_id ? Number(row.program_id) : null,
    title: row.title,
    content: row.content || '',
    target_url: normalizeTargetUrl(row.program_id ? Number(row.program_id) : null, row.target_url),
    image_url: row.image_url || '',
    program_name: row.program_name || null,
    original_price: row.original_price ? Number(row.original_price) : null,
    sale_price: row.sale_price ? Number(row.sale_price) : null,
    brand_name: row.brand_name || null,
    brand_logo: row.brand_logo || null,
  }));
}

export async function getPublicContents(filter: { type?: string; program_id?: number } = {}) {
  const conditions = ["c.status = 'ACTIVE'"];
  const params: any[] = [];

  if (filter.type && filter.type !== 'ALL') {
    params.push(filter.type);
    conditions.push(`c.content_type = $${params.length}`);
  }

  if (filter.program_id) {
    params.push(filter.program_id);
    conditions.push(`c.program_id = $${params.length}`);
  }

  const query = `
    SELECT 
      c.content_id,
      c.program_id,
      c.title,
      c.body,
      c.content_type,
      c.created_at,
      vp.program_name,
      p.business_name as brand_name,
      p.brand_logo as brand_logo
    FROM contents c
    LEFT JOIN voucher_programs vp ON vp.program_id = c.program_id
    LEFT JOIN partners p ON p.user_id = vp.partner_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY c.content_id DESC
  `;
  const res = await pool.query(query, params);
  return res.rows.map((row) => ({
    content_id: Number(row.content_id),
    program_id: row.program_id ? Number(row.program_id) : null,
    title: row.title,
    body: row.body,
    content_type: row.content_type,
    created_at: row.created_at,
    program_name: row.program_name || null,
    brand_name: row.brand_name || null,
    brand_logo: row.brand_logo || null,
  }));
}

export async function getPublicContentById(id: number) {
  const query = `
    SELECT 
      c.content_id,
      c.program_id,
      c.title,
      c.body,
      c.content_type,
      c.created_at,
      c.updated_at,
      vp.program_name,
      p.business_name as brand_name,
      p.brand_logo as brand_logo
    FROM contents c
    LEFT JOIN voucher_programs vp ON vp.program_id = c.program_id
    LEFT JOIN partners p ON p.user_id = vp.partner_id
    WHERE c.content_id = $1 AND c.status = 'ACTIVE'
  `;
  const res = await pool.query(query, [id]);
  if (res.rows.length === 0) {
    throw { status: 404, message: 'Nội dung không tồn tại hoặc đã ngừng hiển thị.' };
  }
  const row = res.rows[0];
  return {
    content_id: Number(row.content_id),
    program_id: row.program_id ? Number(row.program_id) : null,
    title: row.title,
    body: row.body,
    content_type: row.content_type,
    created_at: row.created_at,
    updated_at: row.updated_at,
    program_name: row.program_name || null,
    brand_name: row.brand_name || null,
    brand_logo: row.brand_logo || null,
  };
}
