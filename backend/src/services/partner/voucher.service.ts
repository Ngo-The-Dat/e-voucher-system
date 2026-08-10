import pool from '../../config/db.js';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateVoucherInput {
  program_name: string;
  category_id: number;
  original_price: number;
  sale_price: number;
  issue_quantity: number;
  sale_start_at: string;
  sale_end_at: string;
  use_start_at: string;
  use_end_at: string;
  branch_ids: number[];
}

interface UpdateVoucherInput extends Partial<CreateVoucherInput> {}

interface GetVouchersQuery {
  status?: string;   // 'draft' | 'pending' | 'approved' | 'rejected'
  search?: string;
  page?: number;
  limit?: number;
}

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
// Frontend        ↔  DB display_status        / DB approval_status
// "draft"         ↔  DRAFT                    / (không có approval record)
// "pending"       ↔  PENDING_APPROVAL         / PENDING
// "approved"      ↔  PUBLISHED                / APPROVED
// "rejected"      ↔  DRAFT (quay về)          / REJECTED
//
// Partner chỉ thấy 4 trạng thái trên. HIDDEN và ENDED do Admin quản lý.

const FRONTEND_STATUS_TO_DB: Record<string, string[]> = {
  draft:    ['DRAFT'],
  pending:  ['PENDING_APPROVAL'],
  approved: ['PUBLISHED'],
  rejected: ['DRAFT'],  // DRAFT nhưng có approval record REJECTED
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const validateVoucherValues = (input: VoucherValues) => {
  if (!Number.isFinite(input.original_price) || input.original_price < 0 ||
      !Number.isFinite(input.sale_price) || input.sale_price < 0) {
    throw { status: 400, message: 'Giá voucher phải là số không âm.' };
  }
  if (input.sale_price > input.original_price) {
    throw { status: 400, message: 'Giá bán không thể lớn hơn giá gốc.' };
  }
  if (!Number.isSafeInteger(input.issue_quantity) || input.issue_quantity <= 0) {
    throw { status: 400, message: 'Số lượng phát hành phải là số nguyên dương.' };
  }

  const dates = [input.sale_start_at, input.sale_end_at, input.use_start_at, input.use_end_at]
    .map((value) => new Date(value));
  if (dates.some((date) => Number.isNaN(date.getTime()))) {
    throw { status: 400, message: 'Ngày bắt đầu hoặc kết thúc không hợp lệ.' };
  }
  if (dates[1] <= dates[0] || dates[3] <= dates[2]) {
    throw { status: 400, message: 'Ngày kết thúc phải sau ngày bắt đầu.' };
  }
};

/** Kiểm tra voucher program thuộc về partner */
const assertVoucherOwnership = async (programId: number, partnerId: number) => {
  const result = await pool.query(
    'SELECT program_id FROM voucher_programs WHERE program_id = $1 AND partner_id = $2',
    [programId, partnerId]
  );
  if (result.rows.length === 0) {
    throw { status: 404, message: 'Chương trình voucher không tồn tại hoặc không thuộc về bạn.' };
  }
};

/** Kiểm tra các branch_ids thuộc về partner */
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

// Lấy approval status mới nhất của voucher
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

// Map DB trạng thái sang frontend status
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
  // HIDDEN, ENDED không do partner manage nhưng vẫn map hiển thị
  if (display_status === 'HIDDEN') return 'approved';
  return 'draft';
};

// ─── Service ──────────────────────────────────────────────────────────────────

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

    // Gắn các chi nhánh
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

export const getVoucherPrograms = async (
  partnerId: number,
  query: GetVouchersQuery
) => {
  const { status, search, page = 1, limit = 10 } = query;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE vp.partner_id = $1';
  const params: unknown[] = [partnerId];
  let paramIdx = 2;

  // Filter theo status
  if (status && FRONTEND_STATUS_TO_DB[status]) {
    const dbStatuses = FRONTEND_STATUS_TO_DB[status];
    whereClause += ` AND vp.display_status = ANY($${paramIdx}::text[])`;
    params.push(dbStatuses);
    paramIdx++;

    // Với "rejected", thêm điều kiện approval_status = 'REJECTED'
    if (status === 'rejected') {
      whereClause += ` AND (
        SELECT approval_status FROM voucher_approval_requests var2
        WHERE var2.program_id = vp.program_id
        ORDER BY submitted_at DESC LIMIT 1
      ) = 'REJECTED'`;
    }
    // Với "draft", loại bỏ những cái có approval REJECTED
    if (status === 'draft') {
      whereClause += ` AND NOT EXISTS (
        SELECT 1 FROM voucher_approval_requests var3
        WHERE var3.program_id = vp.program_id AND var3.approval_status = 'REJECTED'
      )`;
    }
  }
  // Filter search
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

export const getActiveCategories = async () => {
  const result = await pool.query(
    `SELECT category_id, category_name, description
     FROM categories
     WHERE status = 'ACTIVE'
     ORDER BY category_name`
  );
  return result.rows;
};

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

  return {
    ...row,
    status: mapToFrontendStatus(row.display_status, approval?.approval_status ?? null),
    admin_feedback: approval?.admin_feedback ?? null,
    submitted_at: approval?.submitted_at ?? null,
    reviewed_at: approval?.reviewed_at ?? null,
  };
};

export const updateVoucherProgram = async (
  programId: number,
  partnerId: number,
  input: UpdateVoucherInput
) => {
  await assertVoucherOwnership(programId, partnerId);

  // Chỉ cho phép cập nhật khi trạng thái là DRAFT
  const statusCheck = await pool.query(
    'SELECT display_status FROM voucher_programs WHERE program_id = $1',
    [programId]
  );
  const currentStatus = statusCheck.rows[0]?.display_status;
  if (currentStatus !== 'DRAFT') {
    throw {
      status: 400,
      message: `Chỉ có thể chỉnh sửa khi chương trình ở trạng thái DRAFT. Trạng thái hiện tại: ${currentStatus}.`,
    };
  }

  if (input.branch_ids !== undefined && input.branch_ids.length === 0) {
    throw { status: 400, message: 'Cần chọn ít nhất 1 chi nhánh áp dụng.' };
  }
  if (input.category_id !== undefined) {
    if (!Number.isSafeInteger(input.category_id) || input.category_id <= 0) {
      throw { status: 400, message: 'Danh mục không hợp lệ.' };
    }
    await assertActiveCategory(input.category_id);
  }

  const currentResult = await pool.query(
    `SELECT original_price, sale_price, issue_quantity, sale_start_at, sale_end_at,
            use_start_at, use_end_at
     FROM voucher_programs WHERE program_id = $1`,
    [programId]
  );
  const currentValues = currentResult.rows[0];
  validateVoucherValues({
    original_price: input.original_price ?? Number(currentValues.original_price),
    sale_price: input.sale_price ?? Number(currentValues.sale_price),
    issue_quantity: input.issue_quantity ?? currentValues.issue_quantity,
    sale_start_at: input.sale_start_at ?? currentValues.sale_start_at,
    sale_end_at: input.sale_end_at ?? currentValues.sale_end_at,
    use_start_at: input.use_start_at ?? currentValues.use_start_at,
    use_end_at: input.use_end_at ?? currentValues.use_end_at,
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

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

    // Nếu có cập nhật branch_ids → sync lại
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

export const submitForApproval = async (programId: number, partnerId: number) => {
  await assertVoucherOwnership(programId, partnerId);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Atomic transition prevents duplicate approval requests under concurrency.
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

    // Tạo yêu cầu duyệt mới
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

export const updateVisibility = async (
  programId: number,
  partnerId: number,
  display_status: 'PUBLISHED' | 'HIDDEN'
) => {
  await assertVoucherOwnership(programId, partnerId);

  // Chỉ cho phép toggle PUBLISHED ↔ HIDDEN
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
