import { type Response, type NextFunction } from 'express';
import { type AuthRequest } from '../../middlewares/auth.middleware.js';
import * as employeeApprovalService from '../../services/admin/employee-approval.service.js';

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
