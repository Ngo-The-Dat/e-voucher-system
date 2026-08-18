/**
 * @file branch.service.ts
 * @description Service xử lý các thao tác cơ sở dữ liệu cho chi nhánh cửa hàng của Đối tác (Branches):
 * thêm mới, danh sách, chi tiết, cập nhật thông tin và xóa mềm (chuyển trạng thái sang INACTIVE).
 */

import pool from '../../config/db.js';

// ─── Types & Interfaces ───────────────────────────────────────────────────────

/** Dữ liệu đầu vào khi tạo chi nhánh mới */
interface CreateBranchInput {
  branch_name: string;   // Tên chi nhánh (VD: Chi nhánh Quận 1)
  address: string;       // Địa chỉ chi nhánh
  region?: string;       // Khu vực (Miền Bắc, Miền Trung, Miền Nam, TPHCM...)
  phone?: string;        // Số điện thoại liên hệ của chi nhánh
}

/** Dữ liệu đầu vào khi cập nhật thông tin chi nhánh */
interface UpdateBranchInput {
  branch_name?: string;
  address?: string;
  region?: string;
  phone?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Kiểm tra quyền sở hữu chi nhánh: đảm bảo `branch_id` thuộc về đúng `partner_id` của đối tác đang thao tác.
 * 
 * @param branchId ID của chi nhánh
 * @param partnerId User ID của đối tác
 * @throws {Object} Lỗi HTTP 404 nếu không tìm thấy chi nhánh hoặc chi nhánh thuộc đối tác khác
 */
const assertBranchOwnership = async (branchId: number, partnerId: number) => {
  const result = await pool.query(
    'SELECT branch_id FROM branches WHERE branch_id = $1 AND partner_id = $2',
    [branchId, partnerId]
  );
  if (result.rows.length === 0) {
    throw { status: 404, message: 'Chi nhánh không tồn tại hoặc không thuộc về bạn.' };
  }
};

// ─── Service Methods ──────────────────────────────────────────────────────────

/**
 * Tạo mới một chi nhánh cửa hàng trực thuộc đối tác.
 * Trạng thái mặc định khi tạo mới là ACTIVE.
 * 
 * @param partnerId User ID của đối tác sở hữu
 * @param input Dữ liệu chi nhánh mới
 * @returns Bản ghi chi nhánh vừa tạo
 */
export const createBranch = async (partnerId: number, input: CreateBranchInput) => {
  const { branch_name, address, region, phone } = input;

  const result = await pool.query(
    `INSERT INTO branches (partner_id, branch_name, address, region, phone, status)
     VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
     RETURNING *`,
    [partnerId, branch_name, address, region ?? null, phone ?? null]
  );

  return result.rows[0];
};

/**
 * Lấy danh sách toàn bộ các chi nhánh thuộc sở hữu của đối tác.
 * 
 * @param partnerId User ID của đối tác
 * @returns Danh sách chi nhánh sắp xếp theo `branch_id`
 */
export const getBranches = async (partnerId: number) => {
  const result = await pool.query(
    'SELECT * FROM branches WHERE partner_id = $1 ORDER BY branch_id',
    [partnerId]
  );
  return result.rows;
};

/**
 * Lấy thông tin chi tiết một chi nhánh cụ thể theo ID.
 * 
 * @param branchId ID chi nhánh cần tìm
 * @param partnerId User ID của đối tác
 * @returns Chi tiết bản ghi chi nhánh
 */
export const getBranchById = async (branchId: number, partnerId: number) => {
  const result = await pool.query(
    'SELECT * FROM branches WHERE branch_id = $1 AND partner_id = $2',
    [branchId, partnerId]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Chi nhánh không tồn tại hoặc không thuộc về bạn.' };
  }

  return result.rows[0];
};

/**
 * Cập nhật thông tin chi nhánh (sử dụng COALESCE để chỉ cập nhật các trường được truyền lên).
 * 
 * @param branchId ID chi nhánh cần cập nhật
 * @param partnerId User ID của đối tác
 * @param input Các thông tin cần thay đổi
 * @returns Bản ghi chi nhánh sau khi cập nhật
 */
export const updateBranch = async (
  branchId: number,
  partnerId: number,
  input: UpdateBranchInput
) => {
  await assertBranchOwnership(branchId, partnerId);

  const result = await pool.query(
    `UPDATE branches SET
       branch_name = COALESCE($1, branch_name),
       address     = COALESCE($2, address),
       region      = COALESCE($3, region),
       phone       = COALESCE($4, phone),
       status      = COALESCE($5, status)
     WHERE branch_id = $6 AND partner_id = $7
     RETURNING *`,
    [input.branch_name, input.address, input.region, input.phone, input.status, branchId, partnerId]
  );

  return result.rows[0];
};

/**
 * Xóa mềm chi nhánh (Soft Delete): chuyển trạng thái chi nhánh sang INACTIVE để không ảnh hưởng đến lịch sử redeem voucher.
 * 
 * @param branchId ID chi nhánh cần vô hiệu hóa
 * @param partnerId User ID của đối tác
 */
export const deleteBranch = async (branchId: number, partnerId: number) => {
  await assertBranchOwnership(branchId, partnerId);

  await pool.query(
    "UPDATE branches SET status = 'INACTIVE' WHERE branch_id = $1 AND partner_id = $2",
    [branchId, partnerId]
  );
};
