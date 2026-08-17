/**
 * @file employee-approval.controller.ts
 * @description Controller dành riêng cho Quản trị viên (Admin) để quản lý và phê duyệt
 * các yêu cầu tạo tài khoản Nhân viên chi nhánh đối tác (Partner Employee Approvals).
 */

import { type Response, type NextFunction } from 'express';
import { type AuthRequest } from '../../middlewares/auth.middleware.js';
import * as employeeApprovalService from '../../services/admin/employee-approval.service.js';

/**
 * [GET] /api/admin/partners/employee-approvals/pending
 * Lấy danh sách hồ sơ nhân viên đối tác đang chờ duyệt hoặc đã duyệt, có phân trang, lọc theo trạng thái và tìm kiếm.
 * 
 * @param req AuthRequest chứa query: `search`, `status`, `start_date`, `end_date`, `page`, `limit`
 * @param res Express Response trả về { data, total, page, totalPages }
 */
export async function getPendingEmployees(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, status, start_date, end_date, page, limit } = req.query;
    const result = await employeeApprovalService.getPendingEmployees({
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
 * [GET] /api/admin/partners/employee-approvals/pending/:id
 * Xem chi tiết một hồ sơ nhân viên chi nhánh đối tác đang chờ phê duyệt.
 * 
 * @param req AuthRequest chứa ID nhân viên
 * @param res Express Response trả về chi tiết hồ sơ
 */
export async function getPendingEmployeeById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const employeeId = Number(req.params.id);
    if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
      res.status(400).json({ message: 'Mã nhân viên không hợp lệ' });
      return;
    }

    const employee = await employeeApprovalService.getPendingEmployeeById(employeeId);
    if (!employee) {
      res.status(404).json({ message: 'Không tìm thấy hồ sơ nhân viên đối tác' });
      return;
    }

    res.json(employee);
  } catch (error) {
    next(error);
  }
}

/**
 * [POST] /api/admin/partners/employee-approvals/:id/approve
 * Admin phê duyệt tài khoản nhân viên đối tác:
 * chuyển trạng thái yêu cầu sang APPROVED và kích hoạt tài khoản nhân viên.
 * 
 * @param req AuthRequest chứa ID nhân viên
 * @param res Express Response thông báo phê duyệt thành công
 */
export async function approveEmployee(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const employeeId = Number(req.params.id);
    const adminId = req.user?.id || 1;

    if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
      res.status(400).json({ message: 'Mã nhân viên không hợp lệ' });
      return;
    }

    const result = await employeeApprovalService.approveEmployee(employeeId, adminId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Hồ sơ nhân viên đối tác không tồn tại') {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}

/**
 * [POST] /api/admin/partners/employee-approvals/:id/reject
 * Admin từ chối phê duyệt tài khoản nhân viên đối tác kèm lý do phản hồi.
 * 
 * @param req AuthRequest chứa ID nhân viên và `{ reason: string }`
 * @param res Express Response thông báo từ chối thành công
 */
export async function rejectEmployee(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const employeeId = Number(req.params.id);
    const { reason } = req.body;
    const adminId = req.user?.id || 1;

    if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
      res.status(400).json({ message: 'Mã nhân viên không hợp lệ' });
      return;
    }

    const result = await employeeApprovalService.rejectEmployee(employeeId, reason || '', adminId);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Hồ sơ nhân viên đối tác không tồn tại') {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}
