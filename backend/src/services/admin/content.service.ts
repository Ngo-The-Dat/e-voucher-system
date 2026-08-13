import pool from '../../config/db.js';
import { logAdminAction } from './system-log.service.js';

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface CategoryFilter {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface BannerFilter {
  search?: string;
  status?: string;
  displayPosition?: string;
  page?: number;
  limit?: number;
}

export interface PopupFilter {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface ContentFilter {
  search?: string;
  status?: string;
  contentType?: string;
  page?: number;
  limit?: number;
}

// ─── 1. Categories (Danh mục) ────────────────────────────────────────────────

export async function getCategories(filter: CategoryFilter = {}) {
  const page = Math.max(1, Number(filter.page) || 1);
  const limit = Math.max(1, Number(filter.limit) || 10);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (filter.search && filter.search.trim()) {
    const searchVal = `%${filter.search.trim()}%`;
    conditions.push(`(c.category_name ILIKE $${paramIdx} OR c.description ILIKE $${paramIdx} OR c.category_id::text ILIKE $${paramIdx})`);
    params.push(searchVal);
    paramIdx++;
  }

  if (filter.status && filter.status !== 'ALL') {
    conditions.push(`c.status = $${paramIdx}`);
    params.push(filter.status);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) as total FROM categories c ${whereClause}`;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0].total, 10);

  const dataQuery = `
    SELECT 
      c.category_id,
      c.category_name,
      c.description,
      c.status,
      (SELECT COUNT(*) FROM voucher_programs vp WHERE vp.category_id = c.category_id) as program_count
    FROM categories c
    ${whereClause}
    ORDER BY c.category_id ASC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;
  params.push(limit, offset);

  const dataRes = await pool.query(dataQuery, params);

  return {
    categories: dataRes.rows.map((row) => ({
      category_id: Number(row.category_id),
      category_name: row.category_name,
      description: row.description || '',
      status: row.status,
      program_count: Number(row.program_count || 0),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getCategoryById(id: number) {
  const query = `
    SELECT 
      c.category_id,
      c.category_name,
      c.description,
      c.status,
      (SELECT COUNT(*) FROM voucher_programs vp WHERE vp.category_id = c.category_id) as program_count
    FROM categories c
    WHERE c.category_id = $1
  `;
  const res = await pool.query(query, [id]);
  if (res.rows.length === 0) {
    const error: any = new Error('Không tìm thấy danh mục yêu cầu.');
    error.status = 404;
    throw error;
  }

  const category = res.rows[0];

  // Lấy danh sách các voucher thuộc danh mục này
  const vouchersQuery = `
    SELECT 
      vp.program_id,
      vp.program_name,
      vp.original_price,
      vp.sale_price,
      vp.display_status,
      vp.sale_start_at,
      vp.sale_end_at,
      p.business_name as partner_name
    FROM voucher_programs vp
    JOIN partners p ON p.user_id = vp.partner_id
    WHERE vp.category_id = $1
    ORDER BY vp.program_id DESC
  `;
  const vouchersRes = await pool.query(vouchersQuery, [id]);

  return {
    category_id: Number(category.category_id),
    category_name: category.category_name,
    description: category.description || '',
    status: category.status,
    program_count: Number(category.program_count || 0),
    vouchers: vouchersRes.rows.map((v) => ({
      program_id: Number(v.program_id),
      program_name: v.program_name,
      original_price: Number(v.original_price),
      sale_price: Number(v.sale_price),
      display_status: v.display_status,
      sale_start_at: v.sale_start_at,
      sale_end_at: v.sale_end_at,
      partner_name: v.partner_name,
    })),
  };
}

export async function createCategory(
  adminId: number,
  data: { category_name: string; description?: string; status?: 'ACTIVE' | 'INACTIVE' }
) {
  const { category_name, description = '', status = 'ACTIVE' } = data;

  const insertQuery = `
    INSERT INTO categories (category_name, description, status)
    VALUES ($1, $2, $3)
    RETURNING category_id, category_name, description, status
  `;
  const res = await pool.query(insertQuery, [category_name.trim(), description.trim(), status]);
  const newCat = res.rows[0];

  await logAdminAction({
    userId: adminId,
    action: 'CREATE_CATEGORY',
    objectId: newCat.category_id,
    objectType: 'CATEGORY',
    newValue: newCat,
    result: 'SUCCESS',
  });

  return {
    category_id: Number(newCat.category_id),
    category_name: newCat.category_name,
    description: newCat.description,
    status: newCat.status,
    program_count: 0,
  };
}

export async function updateCategory(
  adminId: number,
  id: number,
  data: { category_name?: string; description?: string; status?: 'ACTIVE' | 'INACTIVE' }
) {
  const current = await getCategoryById(id);

  const newName = data.category_name !== undefined ? data.category_name.trim() : current.category_name;
  const newDesc = data.description !== undefined ? data.description.trim() : current.description;
  const newStatus = data.status !== undefined ? data.status : current.status;

  const updateQuery = `
    UPDATE categories
    SET category_name = $1, description = $2, status = $3
    WHERE category_id = $4
    RETURNING category_id, category_name, description, status
  `;
  const res = await pool.query(updateQuery, [newName, newDesc, newStatus, id]);
  const updated = res.rows[0];

  await logAdminAction({
    userId: adminId,
    action: 'UPDATE_CATEGORY',
    objectId: id,
    objectType: 'CATEGORY',
    oldValue: {
      category_name: current.category_name,
      description: current.description,
      status: current.status,
    },
    newValue: updated,
    result: 'SUCCESS',
  });

  return {
    category_id: Number(updated.category_id),
    category_name: updated.category_name,
    description: updated.description,
    status: updated.status,
    program_count: current.program_count,
  };
}

export async function deleteCategory(adminId: number, id: number) {
  const current = await getCategoryById(id);

  if (current.program_count > 0) {
    const error: any = new Error(
      `Không thể xóa danh mục "${current.category_name}" vì đang có ${current.program_count} chương trình voucher liên kết!`
    );
    error.status = 400;
    throw error;
  }

  await pool.query(`DELETE FROM categories WHERE category_id = $1`, [id]);

  await logAdminAction({
    userId: adminId,
    action: 'DELETE_CATEGORY',
    objectId: id,
    objectType: 'CATEGORY',
    oldValue: current,
    result: 'SUCCESS',
  });

  return {
    message: `Đã xóa danh mục "${current.category_name}" thành công.`,
    category_id: id,
  };
}

export async function assignVouchersToCategory(adminId: number, categoryId: number, programIds: number[]) {
  const category = await getCategoryById(categoryId);

  if (programIds.length > 0) {
    await pool.query(
      `UPDATE voucher_programs SET category_id = $1 WHERE program_id = ANY($2::bigint[])`,
      [categoryId, programIds]
    );

    await logAdminAction({
      userId: adminId,
      action: 'UPDATE_CATEGORY',
      objectId: categoryId,
      objectType: 'CATEGORY',
      newValue: { assigned_program_ids: programIds },
      result: 'SUCCESS',
    });
  }

  return getCategoryById(categoryId);
}

export async function removeVoucherFromCategory(adminId: number, categoryId: number, programId: number) {
  await getCategoryById(categoryId);

  try {
    await pool.query(`ALTER TABLE voucher_programs ALTER COLUMN category_id DROP NOT NULL`);
  } catch {}

  await pool.query(
    `UPDATE voucher_programs SET category_id = NULL WHERE program_id = $1 AND category_id = $2`,
    [programId, categoryId]
  );

  await logAdminAction({
    userId: adminId,
    action: 'UPDATE_CATEGORY',
    objectId: categoryId,
    objectType: 'CATEGORY',
    newValue: { removed_program_id: programId },
    result: 'SUCCESS',
  });

  return getCategoryById(categoryId);
}

// ─── 2. Banners (Banner Quảng Cáo) ──────────────────────────────────────────

export async function getBanners(filter: BannerFilter = {}) {
  const page = Math.max(1, Number(filter.page) || 1);
  const limit = Math.max(1, Number(filter.limit) || 10);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (filter.search && filter.search.trim()) {
    const searchVal = `%${filter.search.trim()}%`;
    conditions.push(`(b.title ILIKE $${paramIdx} OR vp.program_name ILIKE $${paramIdx} OR b.banner_id::text ILIKE $${paramIdx})`);
    params.push(searchVal);
    paramIdx++;
  }

  if (filter.status && filter.status !== 'ALL') {
    conditions.push(`b.status = $${paramIdx}`);
    params.push(filter.status);
    paramIdx++;
  }

  if (filter.displayPosition && filter.displayPosition !== 'ALL') {
    conditions.push(`b.display_position = $${paramIdx}`);
    params.push(filter.displayPosition);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*) as total 
    FROM banners b
    JOIN voucher_programs vp ON vp.program_id = b.program_id
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0].total, 10);

  const dataQuery = `
    SELECT 
      b.banner_id,
      b.program_id,
      vp.program_name,
      b.title,
      b.image_url,
      b.target_url,
      b.display_position,
      b.display_from,
      b.display_to,
      b.status
    FROM banners b
    JOIN voucher_programs vp ON vp.program_id = b.program_id
    ${whereClause}
    ORDER BY b.banner_id DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;
  params.push(limit, offset);

  const dataRes = await pool.query(dataQuery, params);

  return {
    banners: dataRes.rows.map((row) => ({
      banner_id: Number(row.banner_id),
      program_id: Number(row.program_id),
      program_name: row.program_name,
      title: row.title,
      image_url: row.image_url,
      target_url: row.target_url || '',
      display_position: row.display_position || 'HOME_TOP',
      display_from: row.display_from,
      display_to: row.display_to,
      status: row.status,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getBannerById(id: number) {
  const query = `
    SELECT 
      b.banner_id,
      b.program_id,
      vp.program_name,
      b.title,
      b.image_url,
      b.target_url,
      b.display_position,
      b.display_from,
      b.display_to,
      b.status
    FROM banners b
    JOIN voucher_programs vp ON vp.program_id = b.program_id
    WHERE b.banner_id = $1
  `;
  const res = await pool.query(query, [id]);
  if (res.rows.length === 0) {
    const error: any = new Error('Không tìm thấy banner quảng cáo.');
    error.status = 404;
    throw error;
  }
  const row = res.rows[0];
  return {
    banner_id: Number(row.banner_id),
    program_id: Number(row.program_id),
    program_name: row.program_name,
    title: row.title,
    image_url: row.image_url,
    target_url: row.target_url || '',
    display_position: row.display_position || 'HOME_TOP',
    display_from: row.display_from,
    display_to: row.display_to,
    status: row.status,
  };
}

export async function createBanner(
  adminId: number,
  data: {
    program_id: number;
    title: string;
    image_url: string;
    target_url?: string;
    display_position?: string;
    display_from?: string;
    display_to?: string;
    status?: 'ACTIVE' | 'INACTIVE';
  }
) {
  const {
    program_id,
    title,
    image_url,
    target_url = '',
    display_position = 'Trượt trang chủ đầu trang',
    display_from = null,
    display_to = null,
    status = 'ACTIVE',
  } = data;

  const insertQuery = `
    INSERT INTO banners (program_id, title, image_url, target_url, display_position, display_from, display_to, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const res = await pool.query(insertQuery, [
    program_id,
    title.trim(),
    image_url.trim(),
    target_url.trim(),
    display_position,
    display_from ? new Date(display_from) : null,
    display_to ? new Date(display_to) : null,
    status,
  ]);
  const newBanner = res.rows[0];

  await logAdminAction({
    userId: adminId,
    action: 'CREATE_BANNER',
    objectId: newBanner.banner_id,
    objectType: 'BANNER',
    newValue: newBanner,
    result: 'SUCCESS',
  });

  return getBannerById(Number(newBanner.banner_id));
}

export async function updateBanner(
  adminId: number,
  id: number,
  data: {
    program_id?: number;
    title?: string;
    image_url?: string;
    target_url?: string;
    display_position?: string;
    display_from?: string;
    display_to?: string;
    status?: 'ACTIVE' | 'INACTIVE';
  }
) {
  const current = await getBannerById(id);

  const program_id = data.program_id !== undefined ? data.program_id : current.program_id;
  const title = data.title !== undefined ? data.title.trim() : current.title;
  const image_url = data.image_url !== undefined ? data.image_url.trim() : current.image_url;
  const target_url = data.target_url !== undefined ? data.target_url.trim() : current.target_url;
  const display_position = data.display_position !== undefined ? data.display_position : current.display_position;
  const display_from = data.display_from !== undefined ? (data.display_from ? new Date(data.display_from) : null) : current.display_from;
  const display_to = data.display_to !== undefined ? (data.display_to ? new Date(data.display_to) : null) : current.display_to;
  const status = data.status !== undefined ? data.status : current.status;

  const updateQuery = `
    UPDATE banners
    SET program_id = $1, title = $2, image_url = $3, target_url = $4,
        display_position = $5, display_from = $6, display_to = $7, status = $8
    WHERE banner_id = $9
    RETURNING *
  `;
  const res = await pool.query(updateQuery, [
    program_id,
    title,
    image_url,
    target_url,
    display_position,
    display_from,
    display_to,
    status,
    id,
  ]);
  const updated = res.rows[0];

  await logAdminAction({
    userId: adminId,
    action: 'UPDATE_BANNER',
    objectId: id,
    objectType: 'BANNER',
    oldValue: current,
    newValue: updated,
    result: 'SUCCESS',
  });

  return getBannerById(id);
}

export async function deleteBanner(adminId: number, id: number) {
  const current = await getBannerById(id);

  await pool.query(`DELETE FROM banners WHERE banner_id = $1`, [id]);

  await logAdminAction({
    userId: adminId,
    action: 'DELETE_BANNER',
    objectId: id,
    objectType: 'BANNER',
    oldValue: current,
    result: 'SUCCESS',
  });

  return {
    message: `Đã xóa banner "${current.title}" thành công.`,
    banner_id: id,
  };
}

// ─── 3. Popups (Popup Truyền Thông) ─────────────────────────────────────────

export async function getPopups(filter: PopupFilter = {}) {
  const page = Math.max(1, Number(filter.page) || 1);
  const limit = Math.max(1, Number(filter.limit) || 10);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (filter.search && filter.search.trim()) {
    const searchVal = `%${filter.search.trim()}%`;
    conditions.push(`(p.title ILIKE $${paramIdx} OR p.content ILIKE $${paramIdx} OR vp.program_name ILIKE $${paramIdx} OR p.popup_id::text ILIKE $${paramIdx})`);
    params.push(searchVal);
    paramIdx++;
  }

  if (filter.status && filter.status !== 'ALL') {
    conditions.push(`p.status = $${paramIdx}`);
    params.push(filter.status);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*) as total 
    FROM popups p
    JOIN voucher_programs vp ON vp.program_id = p.program_id
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0].total, 10);

  const dataQuery = `
    SELECT 
      p.popup_id,
      p.program_id,
      vp.program_name,
      p.title,
      p.content,
      p.target_url,
      p.image_url,
      p.start_at,
      p.end_at,
      p.status
    FROM popups p
    JOIN voucher_programs vp ON vp.program_id = p.program_id
    ${whereClause}
    ORDER BY p.popup_id DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;
  params.push(limit, offset);

  const dataRes = await pool.query(dataQuery, params);

  return {
    popups: dataRes.rows.map((row) => ({
      popup_id: Number(row.popup_id),
      program_id: Number(row.program_id),
      program_name: row.program_name,
      title: row.title,
      content: row.content || '',
      target_url: row.target_url || '',
      image_url: row.image_url || '',
      start_at: row.start_at,
      end_at: row.end_at,
      status: row.status,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getPopupById(id: number) {
  const query = `
    SELECT 
      p.popup_id,
      p.program_id,
      vp.program_name,
      p.title,
      p.content,
      p.target_url,
      p.image_url,
      p.start_at,
      p.end_at,
      p.status
    FROM popups p
    JOIN voucher_programs vp ON vp.program_id = p.program_id
    WHERE p.popup_id = $1
  `;
  const res = await pool.query(query, [id]);
  if (res.rows.length === 0) {
    const error: any = new Error('Không tìm thấy popup truyền thông.');
    error.status = 404;
    throw error;
  }
  const row = res.rows[0];
  return {
    popup_id: Number(row.popup_id),
    program_id: Number(row.program_id),
    program_name: row.program_name,
    title: row.title,
    content: row.content || '',
    target_url: row.target_url || '',
    image_url: row.image_url || '',
    start_at: row.start_at,
    end_at: row.end_at,
    status: row.status,
  };
}

export async function createPopup(
  adminId: number,
  data: {
    program_id: number;
    title: string;
    content?: string;
    target_url?: string;
    image_url?: string;
    start_at?: string;
    end_at?: string;
    status?: 'ACTIVE' | 'INACTIVE';
  }
) {
  const {
    program_id,
    title,
    content = '',
    target_url = '',
    image_url = '',
    start_at = null,
    end_at = null,
    status = 'ACTIVE',
  } = data;

  const insertQuery = `
    INSERT INTO popups (program_id, title, content, target_url, image_url, start_at, end_at, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const res = await pool.query(insertQuery, [
    program_id,
    title.trim(),
    content.trim(),
    target_url.trim(),
    image_url.trim(),
    start_at ? new Date(start_at) : null,
    end_at ? new Date(end_at) : null,
    status,
  ]);
  const newPopup = res.rows[0];

  await logAdminAction({
    userId: adminId,
    action: 'CREATE_POPUP',
    objectId: newPopup.popup_id,
    objectType: 'POPUP',
    newValue: newPopup,
    result: 'SUCCESS',
  });

  return getPopupById(Number(newPopup.popup_id));
}

export async function updatePopup(
  adminId: number,
  id: number,
  data: {
    program_id?: number;
    title?: string;
    content?: string;
    target_url?: string;
    image_url?: string;
    start_at?: string;
    end_at?: string;
    status?: 'ACTIVE' | 'INACTIVE';
  }
) {
  const current = await getPopupById(id);

  const program_id = data.program_id !== undefined ? data.program_id : current.program_id;
  const title = data.title !== undefined ? data.title.trim() : current.title;
  const content = data.content !== undefined ? data.content.trim() : current.content;
  const target_url = data.target_url !== undefined ? data.target_url.trim() : current.target_url;
  const image_url = data.image_url !== undefined ? data.image_url.trim() : current.image_url;
  const start_at = data.start_at !== undefined ? (data.start_at ? new Date(data.start_at) : null) : current.start_at;
  const end_at = data.end_at !== undefined ? (data.end_at ? new Date(data.end_at) : null) : current.end_at;
  const status = data.status !== undefined ? data.status : current.status;

  const updateQuery = `
    UPDATE popups
    SET program_id = $1, title = $2, content = $3, target_url = $4,
        image_url = $5, start_at = $6, end_at = $7, status = $8
    WHERE popup_id = $9
    RETURNING *
  `;
  const res = await pool.query(updateQuery, [
    program_id,
    title,
    content,
    target_url,
    image_url,
    start_at,
    end_at,
    status,
    id,
  ]);
  const updated = res.rows[0];

  await logAdminAction({
    userId: adminId,
    action: 'UPDATE_POPUP',
    objectId: id,
    objectType: 'POPUP',
    oldValue: current,
    newValue: updated,
    result: 'SUCCESS',
  });

  return getPopupById(id);
}

export async function deletePopup(adminId: number, id: number) {
  const current = await getPopupById(id);

  await pool.query(`DELETE FROM popups WHERE popup_id = $1`, [id]);

  await logAdminAction({
    userId: adminId,
    action: 'DELETE_POPUP',
    objectId: id,
    objectType: 'POPUP',
    oldValue: current,
    result: 'SUCCESS',
  });

  return {
    message: `Đã xóa popup "${current.title}" thành công.`,
    popup_id: id,
  };
}

// ─── 4. Contents (Bài Viết & Chính Sách) ─────────────────────────────────────

export async function getContents(filter: ContentFilter = {}) {
  const page = Math.max(1, Number(filter.page) || 1);
  const limit = Math.max(1, Number(filter.limit) || 10);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (filter.search && filter.search.trim()) {
    const searchVal = `%${filter.search.trim()}%`;
    conditions.push(`(c.title ILIKE $${paramIdx} OR c.body ILIKE $${paramIdx} OR vp.program_name ILIKE $${paramIdx} OR c.content_id::text ILIKE $${paramIdx})`);
    params.push(searchVal);
    paramIdx++;
  }

  if (filter.status && filter.status !== 'ALL') {
    conditions.push(`c.status = $${paramIdx}`);
    params.push(filter.status);
    paramIdx++;
  }

  if (filter.contentType && filter.contentType !== 'ALL') {
    conditions.push(`c.content_type = $${paramIdx}`);
    params.push(filter.contentType);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*) as total 
    FROM contents c
    JOIN voucher_programs vp ON vp.program_id = c.program_id
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0].total, 10);

  const dataQuery = `
    SELECT 
      c.content_id,
      c.program_id,
      vp.program_name,
      c.title,
      c.body,
      c.content_type,
      c.created_at,
      c.updated_at,
      c.status
    FROM contents c
    JOIN voucher_programs vp ON vp.program_id = c.program_id
    ${whereClause}
    ORDER BY c.content_id DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;
  params.push(limit, offset);

  const dataRes = await pool.query(dataQuery, params);

  return {
    contents: dataRes.rows.map((row) => ({
      content_id: Number(row.content_id),
      program_id: Number(row.program_id),
      program_name: row.program_name,
      title: row.title,
      body: row.body,
      content_type: row.content_type,
      created_at: row.created_at,
      updated_at: row.updated_at,
      status: row.status,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getContentById(id: number) {
  const query = `
    SELECT 
      c.content_id,
      c.program_id,
      vp.program_name,
      c.title,
      c.body,
      c.content_type,
      c.created_at,
      c.updated_at,
      c.status
    FROM contents c
    JOIN voucher_programs vp ON vp.program_id = c.program_id
    WHERE c.content_id = $1
  `;
  const res = await pool.query(query, [id]);
  if (res.rows.length === 0) {
    const error: any = new Error('Không tìm thấy bài viết hoặc chính sách.');
    error.status = 404;
    throw error;
  }
  const row = res.rows[0];
  return {
    content_id: Number(row.content_id),
    program_id: Number(row.program_id),
    program_name: row.program_name,
    title: row.title,
    body: row.body,
    content_type: row.content_type,
    created_at: row.created_at,
    updated_at: row.updated_at,
    status: row.status,
  };
}

export async function createContent(
  adminId: number,
  data: {
    program_id: number;
    title: string;
    body: string;
    content_type?: 'POLICY' | 'ARTICLE';
    status?: 'ACTIVE' | 'INACTIVE';
  }
) {
  const {
    program_id,
    title,
    body,
    content_type = 'ARTICLE',
    status = 'ACTIVE',
  } = data;

  const insertQuery = `
    INSERT INTO contents (program_id, title, body, content_type, created_at, status)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
    RETURNING *
  `;
  const res = await pool.query(insertQuery, [
    program_id,
    title.trim(),
    body.trim(),
    content_type,
    status,
  ]);
  const newContent = res.rows[0];

  await logAdminAction({
    userId: adminId,
    action: 'CREATE_CONTENT',
    objectId: newContent.content_id,
    objectType: 'CONTENT',
    newValue: newContent,
    result: 'SUCCESS',
  });

  return getContentById(Number(newContent.content_id));
}

export async function updateContent(
  adminId: number,
  id: number,
  data: {
    program_id?: number;
    title?: string;
    body?: string;
    content_type?: 'POLICY' | 'ARTICLE';
    status?: 'ACTIVE' | 'INACTIVE';
  }
) {
  const current = await getContentById(id);

  const program_id = data.program_id !== undefined ? data.program_id : current.program_id;
  const title = data.title !== undefined ? data.title.trim() : current.title;
  const body = data.body !== undefined ? data.body.trim() : current.body;
  const content_type = data.content_type !== undefined ? data.content_type : current.content_type;
  const status = data.status !== undefined ? data.status : current.status;

  const updateQuery = `
    UPDATE contents
    SET program_id = $1, title = $2, body = $3, content_type = $4,
        updated_at = CURRENT_TIMESTAMP, status = $5
    WHERE content_id = $6
    RETURNING *
  `;
  const res = await pool.query(updateQuery, [
    program_id,
    title,
    body,
    content_type,
    status,
    id,
  ]);
  const updated = res.rows[0];

  await logAdminAction({
    userId: adminId,
    action: 'UPDATE_CONTENT',
    objectId: id,
    objectType: 'CONTENT',
    oldValue: current,
    newValue: updated,
    result: 'SUCCESS',
  });

  return getContentById(id);
}

export async function deleteContent(adminId: number, id: number) {
  const current = await getContentById(id);

  await pool.query(`DELETE FROM contents WHERE content_id = $1`, [id]);

  await logAdminAction({
    userId: adminId,
    action: 'DELETE_CONTENT',
    objectId: id,
    objectType: 'CONTENT',
    oldValue: current,
    result: 'SUCCESS',
  });

  return {
    message: `Đã xóa nội dung "${current.title}" thành công.`,
    content_id: id,
  };
}

// ─── 5. Voucher Options Helper ───────────────────────────────────────────────

export async function getVoucherProgramOptions() {
  const query = `
    SELECT 
      vp.program_id,
      vp.program_name,
      vp.category_id,
      c.category_name,
      vp.original_price,
      vp.sale_price,
      vp.display_status,
      p.business_name as partner_name
    FROM voucher_programs vp
    JOIN partners p ON p.user_id = vp.partner_id
    LEFT JOIN categories c ON c.category_id = vp.category_id
    ORDER BY vp.program_id DESC
  `;
  const res = await pool.query(query);
  return res.rows.map((row) => ({
    program_id: Number(row.program_id),
    program_name: row.program_name,
    category_id: row.category_id ? Number(row.category_id) : null,
    category_name: row.category_name || null,
    original_price: Number(row.original_price),
    sale_price: Number(row.sale_price),
    display_status: row.display_status,
    partner_name: row.partner_name,
  }));
}
