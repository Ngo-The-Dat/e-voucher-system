/**
 * =========================================================================================
 * FILE: partner.controller.ts
 * VỊ TRÍ: backend/src/controllers/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Tầng Điều khiển (Controller Layer) tiếp nhận toàn bộ các Request quản lý & xét duyệt Doanh nghiệp Đối tác.
 *   - Các nhóm Endpoint:
 *       1. Hàng đợi duyệt đối tác (Pending Partners): GET danh sách, GET chi tiết, POST duyệt, POST từ chối, POST yêu cầu sửa.
 *       2. Quản lý đối tác hoạt động (Managed Partners): GET danh sách, GET chi tiết, POST khóa (LOCK), POST mở khóa (UNLOCK).
 *       3. Quản lý chi nhánh (Branches): POST tạo mới, PUT cập nhật, DELETE xóa chi nhánh.
 * =========================================================================================
 */

import { type Response, type NextFunction } from 'express';
import { type AuthRequest } from '../../middlewares/auth.middleware.js';
import * as partnerService from '../../services/admin/partner.service.js';

// ─────────────────────────────────────────────────────────────────────────────────────────
// 1. NHÓM CONTROLLER: XÉT DUYỆT HỒ SƠ ĐỐI TÁC (PENDING PARTNERS)
// ─────────────────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/partners/pending
 * Lấy danh sách hồ sơ đối tác đang chờ duyệt
 */
export async function getPendingPartners(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, status, start_date, end_date, page, limit } = req.query;
    const result = await partnerService.getPendingPartners({
      search: search as string,
      status: status as string,
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
 * GET /api/admin/partners/pending/:id
 * Lấy chi tiết 1 hồ sơ đối tác đang chờ duyệt (kèm danh sách chi nhánh và giấy tờ)
 */
export async function getPendingPartnerById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const partnerId = Number(req.params.id);
    if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
      res.status(400).json({ message: 'Mã đối tác không hợp lệ' });
      return;
    }

    const partner = await partnerService.getPendingPartnerById(partnerId);
    if (!partner) {
      res.status(404).json({ message: 'Không tìm thấy hồ sơ đối tác chờ duyệt' });
      return;
    }

    res.json(partner);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/partners/pending/:id/approve
 * Phê duyệt đối tác và kích hoạt hoạt động
 */
export async function approvePartner(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const partnerId = Number(req.params.id);
    const adminId = req.user?.id || 1;

    if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
      res.status(400).json({ message: 'Mã đối tác không hợp lệ' });
      return;
    }

    const result = await partnerService.approvePartner(partnerId, adminId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Đối tác không tồn tại') {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

/**
 * POST /api/admin/partners/pending/:id/reject
 * Từ chối hồ sơ đối tác kèm lý do
 */
export async function rejectPartner(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const partnerId = Number(req.params.id);
    const { reason } = req.body;
    const adminId = req.user?.id || 1;

    if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
      res.status(400).json({ message: 'Mã đối tác không hợp lệ' });
      return;
    }

    const result = await partnerService.rejectPartner(partnerId, reason || '', adminId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Đối tác không tồn tại') {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

/**
 * POST /api/admin/partners/pending/:id/request-revision
 * Yêu cầu đối tác bổ sung/chỉnh sửa hồ sơ
 */
export async function requestRevisionPartner(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const partnerId = Number(req.params.id);
    const { note } = req.body;
    const adminId = req.user?.id || 1;

    if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
      res.status(400).json({ message: 'Mã đối tác không hợp lệ' });
      return;
    }

    const result = await partnerService.requestRevisionPartner(partnerId, note || '', adminId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Đối tác không tồn tại') {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// 2. NHÓM CONTROLLER: QUẢN LÝ ĐỐI TÁC ĐÃ DUYỆT (MANAGED PARTNERS)
// ─────────────────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/partners/manage
 * Lấy danh sách các đối tác đã duyệt đang hoạt động trên sàn
 */
export async function getManagedPartners(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, status, start_date, end_date, page, limit } = req.query;
    const result = await partnerService.getManagedPartners({
      search: search as string,
      status: status as string,
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
 * GET /api/admin/partners/manage/:id
 * Lấy chi tiết đối tác quản lý (kèm danh sách chi nhánh và chương trình voucher)
 */
export async function getManagedPartnerById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const partnerId = Number(req.params.id);
    if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
      res.status(400).json({ message: 'Mã đối tác không hợp lệ' });
      return;
    }

    const partner = await partnerService.getManagedPartnerById(partnerId);
    if (!partner) {
      res.status(404).json({ message: 'Không tìm thấy thông tin đối tác' });
      return;
    }

    res.json(partner);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/partners/manage/:id/lock
 * Khóa tài khoản đối tác (LOCKED)
 */
export async function lockPartner(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const partnerId = Number(req.params.id);
    const { reason } = req.body;
    const adminId = req.user?.id || 1;

    if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
      res.status(400).json({ message: 'Mã đối tác không hợp lệ' });
      return;
    }

    if (!reason || !reason.trim()) {
      res.status(400).json({ message: 'Vui lòng cung cấp lý do khóa đối tác' });
      return;
    }

    const result = await partnerService.lockPartner(partnerId, reason.trim(), adminId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Đối tác không tồn tại') {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

/**
 * POST /api/admin/partners/manage/:id/unlock
 * Mở khóa tài khoản đối tác (ACTIVE)
 */
export async function unlockPartner(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const partnerId = Number(req.params.id);
    const adminId = req.user?.id || 1;

    if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
      res.status(400).json({ message: 'Mã đối tác không hợp lệ' });
      return;
    }

    const result = await partnerService.unlockPartner(partnerId, adminId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Đối tác không tồn tại') {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// 3. NHÓM CONTROLLER: QUẢN LÝ CHI NHÁNH ĐỐI TÁC (BRANCHES)
// ─────────────────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/partners/manage/:id/branches
 * Tạo chi nhánh mới cho đối tác
 */
export async function createBranch(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const partnerId = Number(req.params.id);
    const adminId = req.user?.id || 1;

    if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
      res.status(400).json({ message: 'Mã đối tác không hợp lệ' });
      return;
    }

    const { branch_name, address, region, phone, status } = req.body;
    if (!branch_name || !branch_name.trim()) {
      res.status(400).json({ message: 'Tên chi nhánh không được để trống' });
      return;
    }
    if (!address || !address.trim()) {
      res.status(400).json({ message: 'Địa chỉ chi nhánh không được để trống' });
      return;
    }

    const branch = await partnerService.createBranch(
      partnerId,
      { branch_name: branch_name.trim(), address: address.trim(), region, phone, status },
      adminId
    );
    res.status(201).json(branch);
  } catch (error: any) {
    if (error.message === 'Đối tác không tồn tại') {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

/**
 * PUT /api/admin/partners/manage/:id/branches/:branchId
 * Cập nhật thông tin chi nhánh
 */
export async function updateBranch(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const partnerId = Number(req.params.id);
    const branchId = Number(req.params.branchId);
    const adminId = req.user?.id || 1;

    if (!Number.isSafeInteger(partnerId) || partnerId <= 0 || !Number.isSafeInteger(branchId) || branchId <= 0) {
      res.status(400).json({ message: 'Mã đối tác hoặc mã chi nhánh không hợp lệ' });
      return;
    }

    const { branch_name, address, region, phone, status } = req.body;
    const updated = await partnerService.updateBranch(
      partnerId,
      branchId,
      {
        branch_name: branch_name ? branch_name.trim() : undefined,
        address: address ? address.trim() : undefined,
        region,
        phone,
        status,
      },
      adminId
    );
    res.json(updated);
  } catch (error: any) {
    if (error.message.includes('không tồn tại')) {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

/**
 * DELETE /api/admin/partners/manage/:id/branches/:branchId
 * Xóa chi nhánh
 */
export async function deleteBranch(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const partnerId = Number(req.params.id);
    const branchId = Number(req.params.branchId);
    const adminId = req.user?.id || 1;

    if (!Number.isSafeInteger(partnerId) || partnerId <= 0 || !Number.isSafeInteger(branchId) || branchId <= 0) {
      res.status(400).json({ message: 'Mã đối tác hoặc mã chi nhánh không hợp lệ' });
      return;
    }

    const result = await partnerService.deleteBranch(partnerId, branchId, adminId);
    res.json(result);
  } catch (error: any) {
    if (error.message.includes('không tồn tại')) {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}
