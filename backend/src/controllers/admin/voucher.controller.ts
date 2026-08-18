/**
 * =========================================================================================
 * FILE: voucher.controller.ts
 * VỊ TRÍ: backend/src/controllers/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Tầng Điều khiển (Controller Layer) tiếp nhận toàn bộ các Request quản lý & xét duyệt Voucher.
 *   - Các Endpoint chính:
 *       1. GET /api/admin/vouchers/pending: Danh sách yêu cầu phát hành voucher chờ duyệt.
 *       2. GET /api/admin/vouchers/pending/:id: Chi tiết đợt phát hành voucher chờ duyệt.
 *       3. POST /api/admin/vouchers/pending/:id/approve: Phê duyệt phát hành voucher.
 *       4. POST /api/admin/vouchers/pending/:id/reject: Từ chối phát hành voucher.
 *       5. GET /api/admin/vouchers/manage: Danh sách voucher toàn sàn (có thống kê số lượng theo tab).
 *       6. GET /api/admin/vouchers/manage/:id: Chi tiết voucher đã duyệt (tồn kho, đã bán, đã dùng).
 *       7. PATCH /api/admin/vouchers/manage/:id/status: Cập nhật trạng thái hiển thị (PUBLISHED/HIDDEN/ENDED).
 * =========================================================================================
 */

import { type Response, type NextFunction } from 'express';
import { type AuthRequest } from '../../middlewares/auth.middleware.js';
import * as voucherService from '../../services/admin/voucher.service.js';

/**
 * GET /api/admin/vouchers/pending
 * Lấy danh sách voucher chờ duyệt (Hỗ trợ tìm kiếm, lọc theo ngày, phân trang)
 */
export async function getPendingVouchers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, start_date, end_date, page, limit } = req.query;
    const result = await voucherService.getPendingVouchers({
      search: search as string,
      startDate: start_date as string,
      endDate: end_date as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/vouchers/pending/:id
 * Lấy chi tiết 1 hồ sơ yêu cầu duyệt voucher theo ID
 */
export async function getPendingVoucherById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const requestId = Number(req.params.id);
    if (!Number.isSafeInteger(requestId) || requestId <= 0) {
      res.status(400).json({ message: 'Mã yêu cầu duyệt không hợp lệ.' });
      return;
    }

    const voucher = await voucherService.getPendingVoucherById(requestId);
    res.json(voucher);
  } catch (error: any) {
    if (error.status === 404) {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

/**
 * POST /api/admin/vouchers/pending/:id/approve
 * Phê duyệt voucher và xuất bản lên sàn
 */
export async function approveVoucher(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const requestId = Number(req.params.id);
    const adminId = req.user?.id || 1;

    if (!Number.isSafeInteger(requestId) || requestId <= 0) {
      res.status(400).json({ message: 'Mã yêu cầu duyệt không hợp lệ.' });
      return;
    }

    const result = await voucherService.approveVoucher(requestId, adminId);
    res.json(result);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}

/**
 * POST /api/admin/vouchers/pending/:id/reject
 * Từ chối yêu cầu phát hành voucher kèm lý do
 */
export async function rejectVoucher(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const requestId = Number(req.params.id);
    const adminId = req.user?.id || 1;
    const { reason } = req.body;

    if (!Number.isSafeInteger(requestId) || requestId <= 0) {
      res.status(400).json({ message: 'Mã yêu cầu duyệt không hợp lệ.' });
      return;
    }

    if (!reason || !reason.trim()) {
      res.status(400).json({ message: 'Vui lòng cung cấp lý do từ chối duyệt voucher.' });
      return;
    }

    const result = await voucherService.rejectVoucher(requestId, adminId, reason);
    res.json(result);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}

/**
 * GET /api/admin/vouchers/manage
 * Lấy danh sách voucher toàn sàn (hỗ trợ lọc trạng thái, danh mục, phân trang)
 */
export async function getManagedVouchers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, status, category_id, page, limit } = req.query;
    const result = await voucherService.getManagedVouchers({
      search: search as string,
      status: status as string,
      categoryId: category_id ? Number(category_id) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/vouchers/manage/:id
 * Lấy chi tiết voucher quản lý (tồn kho, đã bán, danh sách chi nhánh và ảnh)
 */
export async function getManagedVoucherById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const programId = Number(req.params.id);
    if (!Number.isSafeInteger(programId) || programId <= 0) {
      res.status(400).json({ message: 'Mã chương trình voucher không hợp lệ.' });
      return;
    }
    const result = await voucherService.getManagedVoucherById(programId);
    res.json(result);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}

/**
 * PATCH /api/admin/vouchers/manage/:id/status
 * Cập nhật trạng thái hiển thị của voucher (PUBLISHED, HIDDEN, ENDED)
 */
export async function updateVoucherStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const programId = Number(req.params.id);
    const adminId = req.user?.id || 1;
    const { status } = req.body;

    if (!Number.isSafeInteger(programId) || programId <= 0) {
      res.status(400).json({ message: 'Mã chương trình voucher không hợp lệ.' });
      return;
    }

    if (!status || !['PUBLISHED', 'HIDDEN', 'ENDED'].includes(status)) {
      res.status(400).json({ message: 'Trạng thái hiển thị không hợp lệ. Chỉ chấp nhận PUBLISHED, HIDDEN, ENDED.' });
      return;
    }

    const result = await voucherService.updateVoucherDisplayStatus(programId, adminId, status);
    res.json(result);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    next(error);
  }
}
