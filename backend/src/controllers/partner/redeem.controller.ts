/**
 * @file redeem.controller.ts
 * @description Controller xử lý nghiệp vụ tra cứu và đổi voucher (Redeem) tại quầy chi nhánh:
 * hỗ trợ phân giải ngữ cảnh người gọi (Đối tác chủ quản hoặc Nhân viên chi nhánh),
 * tra cứu voucher bằng chuỗi mã (Voucher Code) hoặc quét mã QR, và xác nhận đổi voucher (Redeem).
 */

import { type Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as redeemService from '../../services/partner/redeem.service.js';
import pool from '../../config/db.js';
import { sendHttpError } from '../../utils/http-error.js';

/**
 * Phân giải ngữ cảnh đối tác và chi nhánh từ thông tin phiên đăng nhập:
 * - Nếu role = `PARTNER`: User ID chính là `partnerId`, có quyền tra cứu/đổi trên toàn bộ chi nhánh của mình.
 * - Nếu role = `PARTNER_EMPLOYEE`: Tra cứu `partner_id` của chủ quản và `branch_id` của chi nhánh nhân viên được phân công.
 * 
 * @param userId User ID của tài khoản đang đăng nhập
 * @param role Vai trò người dùng ('PARTNER' | 'PARTNER_EMPLOYEE')
 * @returns { partnerId: number, employeeBranchId?: number }
 * @throws {Object} Lỗi HTTP 403 nếu nhân viên chưa được gán vào chi nhánh
 */
const resolvePartnerContext = async (
  userId: number,
  role: string
): Promise<{ partnerId: number; employeeBranchId?: number }> => {
  if (role === 'PARTNER') return { partnerId: userId };

  // PARTNER_EMPLOYEE: Lấy partner_id và branch_id thông qua bảng liên kết partner_employees và branches
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

/**
 * [GET] /api/partner/redeem/lookup?code=
 * Tra cứu thông tin chi tiết của voucher đã phát hành dựa trên chuỗi mã code.
 * 
 * @param req AuthRequest chứa `code` trong query params
 * @param res Express Response trả về chi tiết voucher, chủ sở hữu và điều kiện áp dụng
 */
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

/**
 * [POST] /api/partner/redeem/lookup-qr
 * Tra cứu thông tin voucher dựa trên payload quét được từ mã QR (chuỗi định danh mã hóa hoặc raw code).
 * 
 * @param req AuthRequest chứa `{ qr_value: string }` trong request body
 * @param res Express Response trả về thông tin voucher
 */
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

/**
 * [POST] /api/partner/redeem/confirm
 * Xác nhận đổi / sử dụng voucher (Redeem) tại quầy thu ngân của chi nhánh.
 * 
 * @description
 * - Kiểm tra nhân viên chỉ được đổi tại đúng chi nhánh được phân công (`employeeBranchId === branch_id`).
 * - Gọi service thực hiện đổi voucher có khóa dòng giao dịch chống Race Condition.
 * 
 * @param req AuthRequest chứa `{ voucher_code, branch_id }`
 * @param res Express Response trả về kết quả đổi voucher thành công kèm thời điểm `redeemed_at`
 */
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
    // Kiểm tra bảo mật: Nhân viên không thể redeem hộ cho chi nhánh khác
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
