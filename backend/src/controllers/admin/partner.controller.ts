/**
 * @file partner.controller.ts
 * @description Controller dành riêng cho Quản trị viên (Admin) để quản lý toàn diện các Đối tác doanh nghiệp (Partners):
 * - Xét duyệt hồ sơ đối tác mới đăng ký (Pending Partners): duyệt (`approve`), từ chối (`reject`), yêu cầu bổ sung hồ sơ (`request-revision`).
 * - Quản lý đối tác đang hoạt động (Managed Partners): xem danh sách, chi tiết, khóa tài khoản (`lock`), mở khóa tài khoản (`unlock`).
 * - Can thiệp quản trị chi nhánh của đối tác: tạo mới, cập nhật, xóa mềm chi nhánh.
 */

import { type Response, type NextFunction } from 'express';
import { type AuthRequest } from '../../middlewares/auth.middleware.js';
import * as partnerService from '../../services/admin/partner.service.js';

/**
 * [GET] /api/admin/partners/pending
 * Lấy danh sách đối tác đang chờ duyệt, hỗ trợ tìm kiếm, lọc theo ngày nộp và phân trang.
 * 
 * @param req AuthRequest chứa query: search, status, start_date, end_date, page, limit
 * @param res Express Response trả về { data, total, page, totalPages }
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
 * [GET] /api/admin/partners/pending/:id
 * Xem chi tiết hồ sơ đăng ký của một đối tác đang chờ duyệt.
 * 
 * @param req AuthRequest chứa ID đối tác
 * @param res Express Response trả về thông tin hồ sơ
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
 * [POST] /api/admin/partners/:id/approve
 * Phê duyệt hồ sơ đối tác: chuyển trạng thái sang `APPROVED`, kích hoạt tài khoản `ACTIVE`.
 * 
 * @param req AuthRequest chứa ID đối tác
 * @param res Express Response thông báo phê duyệt thành công
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
 * [POST] /api/admin/partners/:id/reject
 * Từ chối hồ sơ đối tác kèm lý do giải thích.
 * 
 * @param req AuthRequest chứa ID đối tác và `{ reason: string }`
 * @param res Express Response thông báo từ chối thành công
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
 * [POST] /api/admin/partners/:id/request-revision
 * Yêu cầu đối tác bổ sung/chỉnh sửa lại hồ sơ đăng ký kèm ghi chú hướng dẫn (`note`).
 * 
 * @param req AuthRequest chứa ID đối tác và `{ note: string }`
 * @param res Express Response thông báo yêu cầu bổ sung thành công
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

/**
 * [GET] /api/admin/partners/manage
 * Lấy danh sách các đối tác đã được duyệt và đang trong hệ thống quản lý của Admin.
 * 
 * @param req AuthRequest chứa các tiêu chí lọc và phân trang
 * @param res Express Response trả về danh sách đối tác
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
 * [GET] /api/admin/partners/manage/:id
 * Lấy thông tin chi tiết một đối tác trong hệ thống quản lý (hồ sơ, pháp lý, chi nhánh, số lượng voucher).
 * 
 * @param req AuthRequest chứa ID đối tác
 * @param res Express Response trả về chi tiết đối tác
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
 * [POST] /api/admin/partners/:id/lock
 * Khóa tài khoản đối tác (`status = 'LOCKED'`) kèm lý do vi phạm hoặc tạm ngưng hoạt động.
 * 
 * @param req AuthRequest chứa ID đối tác và `{ reason: string }`
 * @param res Express Response thông báo khóa thành công
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
 * [POST] /api/admin/partners/:id/unlock
 * Mở khóa tài khoản đối tác (`status = 'ACTIVE'`).
 * 
 * @param req AuthRequest chứa ID đối tác
 * @param res Express Response thông báo mở khóa thành công
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

/**
 * [POST] /api/admin/partners/:id/branches
 * Admin can thiệp tạo chi nhánh cho một đối tác cụ thể.
 * 
 * @param req AuthRequest chứa ID đối tác và thông tin chi nhánh trong body
 * @param res Express Response trả về chi nhánh vừa tạo (HTTP 201 Created)
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
 * [PUT] /api/admin/partners/:id/branches/:branchId
 * Admin cập nhật thông tin chi nhánh của đối tác.
 * 
 * @param req AuthRequest chứa partnerId và branchId
 * @param res Express Response trả về chi nhánh sau cập nhật
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
 * [DELETE] /api/admin/partners/:id/branches/:branchId
 * Admin xóa mềm chi nhánh của đối tác.
 * 
 * @param req AuthRequest chứa partnerId và branchId
 * @param res Express Response thông báo xóa thành công
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
