import pool from '../../config/db.js';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateBranchInput {
  branch_name: string;
  address: string;
  region?: string;
}

interface UpdateBranchInput {
  branch_name?: string;
  address?: string;
  region?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Kiểm tra branch thuộc về partner. Ném lỗi nếu không hợp lệ. */
const assertBranchOwnership = async (branchId: number, partnerId: number) => {
  const result = await pool.query(
    'SELECT branch_id FROM branches WHERE branch_id = $1 AND partner_id = $2',
    [branchId, partnerId]
  );
  if (result.rows.length === 0) {
    throw { status: 404, message: 'Chi nhánh không tồn tại hoặc không thuộc về bạn.' };
  }
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const createBranch = async (partnerId: number, input: CreateBranchInput) => {
  const { branch_name, address, region } = input;

  const result = await pool.query(
    `INSERT INTO branches (partner_id, branch_name, address, region, status)
     VALUES ($1, $2, $3, $4, 'ACTIVE')
     RETURNING *`,
    [partnerId, branch_name, address, region ?? null]
  );

  return result.rows[0];
};

export const getBranches = async (partnerId: number) => {
  const result = await pool.query(
    'SELECT * FROM branches WHERE partner_id = $1 ORDER BY branch_id',
    [partnerId]
  );
  return result.rows;
};

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
       status      = COALESCE($4, status)
     WHERE branch_id = $5 AND partner_id = $6
     RETURNING *`,
    [input.branch_name, input.address, input.region, input.status, branchId, partnerId]
  );

  return result.rows[0];
};

/** Soft delete: đặt status = INACTIVE */
export const deleteBranch = async (branchId: number, partnerId: number) => {
  await assertBranchOwnership(branchId, partnerId);

  await pool.query(
    "UPDATE branches SET status = 'INACTIVE' WHERE branch_id = $1 AND partner_id = $2",
    [branchId, partnerId]
  );
};
