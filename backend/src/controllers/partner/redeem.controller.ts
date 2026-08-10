import { type Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as redeemService from '../../services/partner/redeem.service.js';
import pool from '../../config/db.js';
import { sendHttpError } from '../../utils/http-error.js';

/**
 * Resolve partnerId từ user đang login:
 * - Nếu role = PARTNER → dùng trực tiếp user.id
 * - Nếu role = PARTNER_EMPLOYEE → tra bảng partner_employees để lấy partner_id
 */
const resolvePartnerContext = async (
  userId: number,
  role: string
): Promise<{ partnerId: number; employeeBranchId?: number }> => {
  if (role === 'PARTNER') return { partnerId: userId };

  // PARTNER_EMPLOYEE: lấy partner_id qua branch
  const result = await pool.query(
    `SELECT b.partner_id, b.branch_id
     FROM partner_employees pe
     JOIN branches b ON pe.branch_id = b.branch_id
     WHERE pe.user_id = $1
     LIMIT 1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw { status: 403, message: 'Nhân viên chưa được gán vào chi nhánh nào.' };
  }

  return {
    partnerId: Number(result.rows[0].partner_id),
    employeeBranchId: Number(result.rows[0].branch_id),
  };
};

export const lookupVoucher = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.query as { code?: string };

    if (!code) {
      res.status(400).json({ message: 'Vui lòng cung cấp mã voucher (query param: code).' });
      return;
    }

    const { partnerId } = await resolvePartnerContext(req.user!.id, req.user!.role);
    const voucher = await redeemService.lookupVoucher(code.trim().toUpperCase(), partnerId);

    res.status(200).json(voucher);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

export const lookupVoucherByQr = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { qr_value } = req.body ?? {};
    if (typeof qr_value !== 'string' || !qr_value.trim() || qr_value.trim().length > 500) {
      res.status(400).json({ message: 'qr_value phải là chuỗi từ 1 đến 500 ký tự.' });
      return;
    }

    const { partnerId } = await resolvePartnerContext(req.user!.id, req.user!.role);
    const voucher = await redeemService.lookupVoucherByQr(qr_value.trim(), partnerId);
    res.status(200).json(voucher);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

export const redeemVoucher = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { voucher_code, branch_id } = req.body;

    if (typeof voucher_code !== 'string' || branch_id === undefined || branch_id === null) {
      res.status(400).json({ message: 'Vui lòng cung cấp voucher_code và branch_id.' });
      return;
    }

    const parsedBranchId = Number(branch_id);
    if (!Number.isSafeInteger(parsedBranchId) || parsedBranchId <= 0) {
      res.status(400).json({ message: 'branch_id không hợp lệ.' });
      return;
    }

    const { partnerId, employeeBranchId } = await resolvePartnerContext(req.user!.id, req.user!.role);
    if (employeeBranchId !== undefined && employeeBranchId !== parsedBranchId) {
      res.status(403).json({ message: 'Nhân viên chỉ được xác nhận voucher tại chi nhánh được phân công.' });
      return;
    }
    const result = await redeemService.redeemVoucher(
      voucher_code.trim().toUpperCase(),
      parsedBranchId,
      partnerId
    );

    res.status(200).json(result);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};
