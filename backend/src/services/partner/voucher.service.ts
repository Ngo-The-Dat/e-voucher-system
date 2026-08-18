/**
 * @file voucher.service.ts
 * @description Service xử lý nghiệp vụ quản lý các chương trình / chiến dịch Voucher của Đối tác:
 * - Tạo chiến dịch voucher kèm liên kết chi nhánh áp dụng (`voucher_program_branches`).
 * - Kiểm tra tính hợp lệ về logic giá (sale_price < original_price), số lượng phát hành, khoảng thời gian bán & sử dụng.
 * - Quản lý trạng thái vòng đời voucher: DRAFT -> PENDING_APPROVAL -> PUBLISHED / REJECTED / HIDDEN.
 * - Gửi yêu cầu phê duyệt chương trình voucher lên Admin.
 * - Chỉnh sửa thông tin voucher khi ở trạng thái DRAFT.
 */

import pool from '../../config/db.js';
import { getVoucherImages } from './voucher-image.service.js';

// ─── Types & Interfaces ───────────────────────────────────────────────────────

/** Dữ liệu đầu vào khi tạo mới chương trình voucher */
interface CreateVoucherInput {
  program_name: string;      // Tên chương trình voucher
  category_id: number;       // ID danh mục ngành hàng
  original_price: number;    // Giá gốc (VNĐ)
  sale_price: number;        // Giá bán khuyến mãi (VNĐ)
  issue_quantity: number;    // Số lượng phát hành tối đa
  sale_start_at: string;     // Thời điểm bắt đầu mở bán
  sale_end_at: string;       // Thời điểm kết thúc bán
  use_start_at: string;      // Thời điểm bắt đầu cho phép sử dụng/đổi voucher
  use_end_at: string;        // Thời điểm hết hạn sử dụng voucher
  branch_ids: number[];      // Danh sách ID các chi nhánh áp dụng
}

/** Dữ liệu cập nhật chương trình voucher */
interface UpdateVoucherInput extends Partial<CreateVoucherInput> {}

/** Tham số tìm kiếm và phân trang danh sách voucher */
interface GetVouchersQuery {
  status?: string;   // 'draft' | 'pending' | 'approved' | 'rejected'
  search?: string;   // Từ khóa tìm theo tên voucher hoặc tên danh mục
  page?: number;     // Trang hiện tại (1-indexed)
  limit?: number;    // Số lượng bản ghi mỗi trang
}

/** Kiểu dữ liệu kiểm tra ràng buộc số và ngày tháng của voucher */
type VoucherValues = {
  original_price: number;
  sale_price: number;
  issue_quantity: number;
  sale_start_at: string | Date;
  sale_end_at: string | Date;
  use_start_at: string | Date;
  use_end_at: string | Date;
};

// ─── Status Mapping ───────────────────────────────────────────────────────────
//
// Bảng quy đổi trạng thái hiển thị cho Frontend ↔ Cơ sở dữ liệu:
// Frontend        ↔  DB display_status        / DB approval_status
// "draft"         ↔  DRAFT                    / (chưa gửi duyệt hoặc không có approval record)
// "pending"       ↔  PENDING_APPROVAL         / PENDING
// "approved"      ↔  PUBLISHED                / APPROVED
// "rejected"      ↔  DRAFT (bị từ chối)       / REJECTED
//
// Partner chỉ nhìn thấy 4 trạng thái trên. HIDDEN và ENDED do Admin hoặc đối tác quản lý bật/tắt hiển thị.

const FRONTEND_STATUS_TO_DB: Record<string, string[]> = {
  draft:    ['DRAFT'],
  pending:  ['PENDING_APPROVAL'],
  approved: ['PUBLISHED'],
  rejected: ['DRAFT'],  // DRAFT nhưng có approval record là REJECTED
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Kiểm tra tính hợp lệ của các giá trị số và các mốc thời gian của voucher.
 * 
 * @param input Các thông số giá, số lượng và các mốc thời gian
 * @throws {Object} Lỗi HTTP 400 nếu vi phạm logic nghiệp vụ
 */
const validateVoucherValues = (input: VoucherValues) => {
  if (!Number.isFinite(input.original_price) || input.original_price <= 0) {
    throw { status: 400, message: 'Giá gốc voucher phải là số lớn hơn 0.' };
  }
  if (!Number.isFinite(input.sale_price) || input.sale_price < 0) {
    throw { status: 400, message: 'Giá bán voucher không hợp lệ (không thể âm).' };
  }
  if (input.sale_price >= input.original_price) {
    throw { status: 400, message: 'Giá bán phải nhỏ hơn giá gốc (Voucher phải có mức giảm giá > 0).' };
  }
  if (!Number.isSafeInteger(input.issue_quantity) || input.issue_quantity <= 0) {
    throw { status: 400, message: 'Số lượng phát hành phải là số nguyên dương.' };
  }

  const saleStart = new Date(input.sale_start_at);
  const saleEnd = new Date(input.sale_end_at);
  const useStart = new Date(input.use_start_at);
  const useEnd = new Date(input.use_end_at);

  if ([saleStart, saleEnd, useStart, useEnd].some((date) => Number.isNaN(date.getTime()))) {
    throw { status: 400, message: 'Ngày bắt đầu hoặc kết thúc không hợp lệ.' };
  }
  if (saleEnd <= saleStart) {
    throw { status: 400, message: 'Thời gian kết thúc bán phải sau ngày bắt đầu bán.' };
  }
  if (useStart < saleStart) {
    throw { status: 400, message: 'Thời gian bắt đầu sử dụng không thể trước ngày bắt đầu bán.' };
  }
  if (useEnd <= useStart) {
    throw { status: 400, message: 'Thời gian kết thúc sử dụng phải sau ngày bắt đầu sử dụng.' };
  }
  if (useEnd < saleEnd) {
    throw { status: 400, message: 'Hạn chót sử dụng voucher phải sau hoặc bằng ngày kết thúc bán.' };
  }
};

/**
 * Kiểm tra xem chương trình voucher có tồn tại và thuộc về đối tác đang đăng nhập hay không.
 * 
 * @param programId ID chương trình voucher
 * @param partnerId User ID của đối tác
 */
const assertVoucherOwnership = async (programId: number, partnerId: number) => {
  const result = await pool.query(
    'SELECT program_id FROM voucher_programs WHERE program_id = $1 AND partner_id = $2',
    [programId, partnerId]
  );
  if (result.rows.length === 0) {
    throw { status: 404, message: 'Chương trình voucher không tồn tại hoặc không thuộc về bạn.' };
  }
};

/**
 * Kiểm tra danh sách chi nhánh truyền vào có hợp lệ và thuộc sở hữu của đối tác hay không.
 * 
 * @param branchIds Mảng ID các chi nhánh
 * @param partnerId User ID của đối tác
 */
const assertBranchesOwnership = async (branchIds: number[], partnerId: number) => {
  const uniqueBranchIds = [...new Set(branchIds)];
  if (uniqueBranchIds.length !== branchIds.length ||
      uniqueBranchIds.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    throw { status: 400, message: 'Danh sách chi nhánh không hợp lệ hoặc bị trùng.' };
  }
  const result = await pool.query(
    `SELECT COUNT(*) FROM branches
     WHERE branch_id = ANY($1::bigint[]) AND partner_id = $2 AND status = 'ACTIVE'`,
    [uniqueBranchIds, partnerId]
  );
  if (parseInt(result.rows[0].count) !== uniqueBranchIds.length) {
    throw { status: 400, message: 'Một hoặc nhiều chi nhánh không thuộc về bạn.' };
  }
};

/**
 * Kiểm tra danh mục ngành hàng có đang ở trạng thái hoạt động ACTIVE hay không.
 * 
 * @param categoryId ID danh mục
 */
const assertActiveCategory = async (categoryId: number) => {
  const result = await pool.query(
    `SELECT category_id FROM categories
     WHERE category_id = $1 AND status = 'ACTIVE'`,
    [categoryId]
  );
  if (result.rows.length === 0) {
    throw { status: 400, message: 'Danh mục không tồn tại hoặc đã bị vô hiệu hóa.' };
  }
};

/**
 * Lấy thông tin bản ghi phê duyệt gần nhất của chương trình voucher từ Admin.
 * 
 * @param programId ID chương trình voucher
 * @returns Bản ghi phê duyệt gồm approval_status, admin_feedback, submitted_at, reviewed_at
 */
const getLatestApproval = async (programId: number) => {
  const result = await pool.query(
    `SELECT approval_status, admin_feedback, submitted_at, reviewed_at
     FROM voucher_approval_requests
     WHERE program_id = $1
     ORDER BY submitted_at DESC
     LIMIT 1`,
    [programId]
  );
  return result.rows[0] || null;
};

/**
 * Ánh xạ trạng thái từ database sang trạng thái thân thiện hiển thị trên giao diện người dùng.
 * 
 * @param display_status Trạng thái hiển thị trong bảng voucher_programs (DRAFT, PENDING_APPROVAL, PUBLISHED, HIDDEN)
 * @param approval_status Trạng thái duyệt trong voucher_approval_requests (PENDING, APPROVED, REJECTED)
 * @returns 'draft' | 'pending' | 'approved' | 'rejected'
 */
const mapToFrontendStatus = (
  display_status: string,
  approval_status: string | null
): string => {
  if (display_status === 'PUBLISHED') return 'approved';
  if (display_status === 'PENDING_APPROVAL') return 'pending';
  if (display_status === 'DRAFT') {
    if (approval_status === 'REJECTED') return 'rejected';
    return 'draft';
  }
  if (display_status === 'HIDDEN') return 'approved';
  return 'draft';
};

// ─── Service Methods ──────────────────────────────────────────────────────────

/**
 * Tạo mới một chương trình voucher (với trạng thái ban đầu là DRAFT).
 * 
 * @description
 * Quy trình thực hiện:
 * 1. Kiểm tra quyền sở hữu các chi nhánh và trạng thái danh mục.
 * 2. Validate giá bán < giá gốc, số lượng > 0, các mốc thời gian hợp lý.
 * 3. Mở Transaction:
 *    - Tạo bản ghi trong `voucher_programs`.
 *    - Gán các chi nhánh áp dụng vào bảng liên kết `voucher_program_branches`.
 * 4. Commit transaction và trả về bản ghi voucher vừa tạo.
 * 
 * @param partnerId User ID của đối tác
 * @param input Thông tin tạo chương trình voucher
 * @returns Bản ghi voucher vừa tạo
 */
export const createVoucherProgram = async (
  partnerId: number,
  input: CreateVoucherInput
) => {
  const {
    program_name, category_id, original_price, sale_price,
    issue_quantity, sale_start_at, sale_end_at, use_start_at, use_end_at, branch_ids,
  } = input;

  // Validate branch ownership
  if (branch_ids.length === 0) {
    throw { status: 400, message: 'Cần chọn ít nhất 1 chi nhánh áp dụng.' };
  }
  await assertBranchesOwnership(branch_ids, partnerId);
  await assertActiveCategory(category_id);

  validateVoucherValues(input);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const programResult = await client.query(
      `INSERT INTO voucher_programs
         (partner_id, category_id, program_name, original_price, sale_price,
          issue_quantity, sale_start_at, sale_end_at, use_start_at, use_end_at, display_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'DRAFT')
       RETURNING *`,
      [
        partnerId, category_id, program_name, original_price, sale_price,
        issue_quantity, sale_start_at, sale_end_at, use_start_at, use_end_at,
      ]
    );
    const program = programResult.rows[0];

    // Gắn các chi nhánh áp dụng
    for (const branchId of branch_ids) {
      await client.query(
        'INSERT INTO voucher_program_branches (program_id, branch_id) VALUES ($1, $2)',
        [program.program_id, branchId]
      );
    }

    await client.query('COMMIT');
    return program;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Lấy danh sách các chương trình voucher của đối tác theo bộ lọc và phân trang.
 * 
 * @param partnerId User ID của đối tác
 * @param query Bộ lọc status, search, page, limit
 * @returns Danh sách voucher và thông tin phân trang
 */
export const getVoucherPrograms = async (
  partnerId: number,
  query: GetVouchersQuery
) => {
  const { status, search, page = 1, limit = 10 } = query;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE vp.partner_id = $1';
  const params: unknown[] = [partnerId];
  let paramIdx = 2;

  // Lọc theo trạng thái
  if (status && FRONTEND_STATUS_TO_DB[status]) {
    const dbStatuses = FRONTEND_STATUS_TO_DB[status];
    whereClause += ` AND vp.display_status = ANY($${paramIdx}::text[])`;
    params.push(dbStatuses);
    paramIdx++;

    // Với "rejected", bắt buộc phải có bản ghi approval_status = 'REJECTED'
    if (status === 'rejected') {
      whereClause += ` AND (
        SELECT approval_status FROM voucher_approval_requests var2
        WHERE var2.program_id = vp.program_id
        ORDER BY submitted_at DESC LIMIT 1
      ) = 'REJECTED'`;
    }
    // Với "draft", loại bỏ những chương trình đã bị từ chối
    if (status === 'draft') {
      whereClause += ` AND NOT EXISTS (
        SELECT 1 FROM voucher_approval_requests var3
        WHERE var3.program_id = vp.program_id AND var3.approval_status = 'REJECTED'
      )`;
    }
  }

  // Lọc theo từ khóa tìm kiếm
  if (search) {
    whereClause += ` AND (vp.program_name ILIKE $${paramIdx} OR c.category_name ILIKE $${paramIdx})`;
    params.push(`%${search}%`);
    paramIdx++;
  }

  const dataResult = await pool.query(
    `SELECT
       vp.*,
       c.category_name,
       COALESCE(
         (SELECT approval_status FROM voucher_approval_requests var
          WHERE var.program_id = vp.program_id ORDER BY submitted_at DESC LIMIT 1),
         NULL
       ) AS latest_approval_status,
       COALESCE(
         (SELECT admin_feedback FROM voucher_approval_requests var
          WHERE var.program_id = vp.program_id ORDER BY submitted_at DESC LIMIT 1),
         NULL
       ) AS admin_feedback,
       COALESCE(
         (SELECT submitted_at FROM voucher_approval_requests var
          WHERE var.program_id = vp.program_id ORDER BY submitted_at DESC LIMIT 1),
         NULL
       ) AS submitted_at,
       COUNT(iv.issued_voucher_id) AS sold_count,
       COUNT(iv.issued_voucher_id) FILTER (WHERE iv.usage_status = 'USED') AS used_count,
       COUNT(iv.issued_voucher_id) FILTER (WHERE iv.usage_status = 'EXPIRED') AS expired_count
     FROM voucher_programs vp
     LEFT JOIN categories c ON vp.category_id = c.category_id
     LEFT JOIN issued_vouchers iv ON vp.program_id = iv.program_id
     ${whereClause}
     GROUP BY vp.program_id, c.category_name
     ORDER BY vp.program_id DESC
     LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
    [...params, limit, offset]
  );

  const countResult = await pool.query(
    `SELECT COUNT(DISTINCT vp.program_id)
     FROM voucher_programs vp
     LEFT JOIN categories c ON vp.category_id = c.category_id
     ${whereClause}`,
    params.slice(0, paramIdx - 1)
  );

  const vouchers = dataResult.rows.map((row) => ({
    ...row,
    status: mapToFrontendStatus(row.display_status, row.latest_approval_status),
  }));

  return {
    data: vouchers,
    total: parseInt(countResult.rows[0]?.count ?? '0'),
    page,
    limit,
  };
};

/**
 * Lấy toàn bộ danh mục ngành hàng đang hoạt động.
 */
export const getActiveCategories = async () => {
  const result = await pool.query(
    `SELECT category_id, category_name, description
     FROM categories WHERE status = 'ACTIVE' ORDER BY category_name`
  );
  return result.rows;
};

/**
 * Lấy thông tin chi tiết một chương trình voucher (kèm danh sách chi nhánh và bộ sưu tập ảnh).
 * 
 * @param programId ID chương trình
 * @param partnerId User ID của đối tác
 * @returns Chi tiết voucher kèm trạng thái duyệt, phản hồi từ Admin và ảnh
 */
export const getVoucherProgramById = async (programId: number, partnerId: number) => {
  await assertVoucherOwnership(programId, partnerId);

  const result = await pool.query(
    `SELECT
       vp.*,
       c.category_name,
       ARRAY_AGG(DISTINCT vpb.branch_id) AS branch_ids,
       ARRAY_AGG(DISTINCT b.branch_name) AS branch_names
     FROM voucher_programs vp
     LEFT JOIN categories c ON vp.category_id = c.category_id
     LEFT JOIN voucher_program_branches vpb ON vp.program_id = vpb.program_id
     LEFT JOIN branches b ON vpb.branch_id = b.branch_id
     WHERE vp.program_id = $1 AND vp.partner_id = $2
     GROUP BY vp.program_id, c.category_name`,
    [programId, partnerId]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy chương trình voucher.' };
  }

  const approval = await getLatestApproval(programId);
  const row = result.rows[0];
  const images = await getVoucherImages(programId);

  return {
    ...row,
    status: mapToFrontendStatus(row.display_status, approval?.approval_status ?? null),
    admin_feedback: approval?.admin_feedback ?? null,
    submitted_at: approval?.submitted_at ?? null,
    reviewed_at: approval?.reviewed_at ?? null,
    thumbnail: images.find((image) => image.isPrimary)?.url ?? images[0]?.url ?? null,
    images,
  };
};

/**
 * Chỉnh sửa chương trình voucher (chỉ cho phép khi voucher đang ở trạng thái DRAFT).
 * 
 * @param programId ID chương trình cần sửa
 * @param partnerId User ID của đối tác
 * @param input Các thông tin cần cập nhật
 * @returns Chương trình voucher sau khi cập nhật
 */
export const updateVoucherProgram = async (
  programId: number,
  partnerId: number,
  input: UpdateVoucherInput
) => {
  await assertVoucherOwnership(programId, partnerId);

  if (input.branch_ids !== undefined && input.branch_ids.length === 0) {
    throw { status: 400, message: 'Cần chọn ít nhất 1 chi nhánh áp dụng.' };
  }
  if (input.category_id !== undefined) {
    if (!Number.isSafeInteger(input.category_id) || input.category_id <= 0) {
      throw { status: 400, message: 'Danh mục không hợp lệ.' };
    }
    await assertActiveCategory(input.category_id);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Khóa dòng FOR UPDATE để kiểm tra trạng thái an toàn
    const currentResult = await client.query(
      `SELECT display_status, original_price, sale_price, issue_quantity,
              sale_start_at, sale_end_at, use_start_at, use_end_at
       FROM voucher_programs
       WHERE program_id = $1 AND partner_id = $2
       FOR UPDATE`,
      [programId, partnerId]
    );
    const currentValues = currentResult.rows[0];
    if (!currentValues) {
      throw { status: 404, message: 'Chương trình voucher không tồn tại hoặc không thuộc về bạn.' };
    }
    if (currentValues.display_status !== 'DRAFT') {
      throw {
        status: 400,
        message: `Chỉ có thể chỉnh sửa khi chương trình ở trạng thái DRAFT. Trạng thái hiện tại: ${currentValues.display_status}.`,
      };
    }

    validateVoucherValues({
      original_price: input.original_price ?? Number(currentValues.original_price),
      sale_price: input.sale_price ?? Number(currentValues.sale_price),
      issue_quantity: input.issue_quantity ?? currentValues.issue_quantity,
      sale_start_at: input.sale_start_at ?? currentValues.sale_start_at,
      sale_end_at: input.sale_end_at ?? currentValues.sale_end_at,
      use_start_at: input.use_start_at ?? currentValues.use_start_at,
      use_end_at: input.use_end_at ?? currentValues.use_end_at,
    });

    await client.query(
      `UPDATE voucher_programs SET
         program_name    = COALESCE($1, program_name),
         category_id     = COALESCE($2, category_id),
         original_price  = COALESCE($3, original_price),
         sale_price      = COALESCE($4, sale_price),
         issue_quantity  = COALESCE($5, issue_quantity),
         sale_start_at   = COALESCE($6, sale_start_at),
         sale_end_at     = COALESCE($7, sale_end_at),
         use_start_at    = COALESCE($8, use_start_at),
         use_end_at      = COALESCE($9, use_end_at)
       WHERE program_id = $10`,
      [
        input.program_name, input.category_id,
        input.original_price, input.sale_price,
        input.issue_quantity,
        input.sale_start_at, input.sale_end_at,
        input.use_start_at, input.use_end_at,
        programId,
      ]
    );

    // Nếu có cập nhật lại danh sách chi nhánh áp dụng: xóa cũ và thêm mới
    if (input.branch_ids !== undefined) {
      await assertBranchesOwnership(input.branch_ids, partnerId);
      await client.query(
        'DELETE FROM voucher_program_branches WHERE program_id = $1',
        [programId]
      );
      for (const branchId of input.branch_ids) {
        await client.query(
          'INSERT INTO voucher_program_branches (program_id, branch_id) VALUES ($1, $2)',
          [programId, branchId]
        );
      }
    }

    await client.query('COMMIT');
    return getVoucherProgramById(programId, partnerId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Gửi chương trình voucher lên Admin để xin duyệt phát hành.
 * Chuyển trạng thái `display_status` từ DRAFT sang PENDING_APPROVAL và tạo bản ghi trong `voucher_approval_requests`.
 * 
 * @param programId ID chương trình
 * @param partnerId User ID của đối tác
 */
export const submitForApproval = async (programId: number, partnerId: number) => {
  await assertVoucherOwnership(programId, partnerId);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Cập nhật nguyên tử chuyển trạng thái DRAFT -> PENDING_APPROVAL
    const updateResult = await client.query(
      `UPDATE voucher_programs
       SET display_status = 'PENDING_APPROVAL'
       WHERE program_id = $1 AND partner_id = $2 AND display_status = 'DRAFT'
       RETURNING program_id`,
      [programId, partnerId]
    );
    if (updateResult.rows.length === 0) {
      throw { status: 400, message: 'Chỉ có thể gửi duyệt khi chương trình ở trạng thái DRAFT.' };
    }

    // Tạo yêu cầu phê duyệt mới ở trạng thái PENDING
    await client.query(
      `INSERT INTO voucher_approval_requests (program_id, approval_status)
       VALUES ($1, 'PENDING')`,
      [programId]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Lấy lịch sử và kết quả phê duyệt gần nhất của voucher từ Admin.
 * 
 * @param programId ID chương trình
 * @param partnerId User ID của đối tác
 */
export const getApprovalStatus = async (programId: number, partnerId: number) => {
  await assertVoucherOwnership(programId, partnerId);

  const result = await pool.query(
    `SELECT approval_request_id, approval_status, admin_feedback, submitted_at, reviewed_at
     FROM voucher_approval_requests
     WHERE program_id = $1
     ORDER BY submitted_at DESC
     LIMIT 1`,
    [programId]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Chưa có yêu cầu duyệt nào cho chương trình này.' };
  }

  return result.rows[0];
};

/**
 * Cập nhật trạng thái hiển thị (Bật / Tắt bán): PUBLISHED ↔ HIDDEN.
 * Chỉ áp dụng cho các voucher đã được Admin duyệt thành công.
 * 
 * @param programId ID chương trình
 * @param partnerId User ID của đối tác
 * @param display_status 'PUBLISHED' hoặc 'HIDDEN'
 */
export const updateVisibility = async (
  programId: number,
  partnerId: number,
  display_status: 'PUBLISHED' | 'HIDDEN'
) => {
  await assertVoucherOwnership(programId, partnerId);

  // Chỉ cho phép chuyển đổi giữa PUBLISHED và HIDDEN
  const statusCheck = await pool.query(
    'SELECT display_status FROM voucher_programs WHERE program_id = $1',
    [programId]
  );
  const current = statusCheck.rows[0]?.display_status;
  if (!['PUBLISHED', 'HIDDEN'].includes(current)) {
    throw {
      status: 400,
      message: `Không thể thay đổi hiển thị khi trạng thái là ${current}. Chỉ áp dụng cho voucher đã được duyệt.`,
    };
  }

  await pool.query(
    'UPDATE voucher_programs SET display_status = $1 WHERE program_id = $2',
    [display_status, programId]
  );
};
