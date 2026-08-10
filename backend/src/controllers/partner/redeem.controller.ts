import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as redeemService from '../../services/partner/redeem.service.js';
import pool from '../../config/db.js';

/**
 * Resolve partnerId từ user đang login:
 * - Nếu role = PARTNER → dùng trực tiếp user.id
 * - Nếu role = PARTNER_EMPLOYEE → tra bảng partner_employees để lấy partner_id
 */
const resolvePartnerId = async (userId: number, role: string): Promise<number> => {
  if (role === 'PARTNER') return userId;

  // PARTNER_EMPLOYEE: lấy partner_id qua branch
  const result = await pool.query(
    `SELECT b.partner_id
     FROM partner_employees pe
     JOIN branches b ON pe.branch_id = b.branch_id
     WHERE pe.user_id = $1
     LIMIT 1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw { status: 403, message: 'Nhân viên chưa được gán vào chi nhánh nào.' };
  }

  return result.rows[0].partner_id;
};

export const lookupVoucher = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.query as { code?: string };

    if (!code) {
      res.status(400).json({ message: 'Vui lòng cung cấp mã voucher (query param: code).' });
      return;
    }

    const partnerId = await resolvePartnerId(req.user!.id, req.user!.role);
    const voucher = await redeemService.lookupVoucher(code.trim().toUpperCase(), partnerId);

    res.status(200).json(voucher);
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    res.status(error.status || 500).json({ message: error.message || 'Lỗi hệ thống.' });
  }
};

export const redeemVoucher = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { voucher_code, branch_id } = req.body;

    if (!voucher_code || !branch_id) {
      res.status(400).json({ message: 'Vui lòng cung cấp voucher_code và branch_id.' });
      return;
    }

    const partnerId = await resolvePartnerId(req.user!.id, req.user!.role);
    const result = await redeemService.redeemVoucher(
      voucher_code.trim().toUpperCase(),
      parseInt(branch_id),
      partnerId
    );

    res.status(200).json(result);
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    res.status(error.status || 500).json({ message: error.message || 'Lỗi hệ thống.' });
  }
};
