/**
 * @file partner-employee-mgmt.controller.ts
 * @description Controller quản lý danh sách nhân viên chi nhánh do Đối tác (Partner) trực tiếp quản trị:
 * lấy danh sách nhân viên thuộc tất cả chi nhánh của đối tác kèm trạng thái phê duyệt từ Admin,
 * tạo tài khoản nhân viên mới và gán vào chi nhánh, cập nhật thông tin hoặc chuyển chi nhánh công tác.
 */

import { type Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as partnerEmployeeMgmtService from '../../services/partner/partner-employee-mgmt.service.js';
import { sendHttpError } from '../../utils/http-error.js';

/**
 * [GET] /api/partner/employees
 * Lấy danh sách toàn bộ nhân viên thuộc các chi nhánh của đối tác đang đăng nhập.
 * Bao gồm thông tin cá nhân, chi nhánh được phân công và trạng thái phê duyệt từ Admin (PENDING/APPROVED/REJECTED).
 * 
 * @param req AuthRequest chứa user token đối tác
 * @param res Express Response trả về danh sách nhân viên
 */
export const getEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const list = await partnerEmployeeMgmtService.getEmployees(req.user!.id);
    res.status(200).json(list);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

/**
 * [POST] /api/partner/employees
 * Đối tác tạo tài khoản nhân viên chi nhánh mới.
 * 
 * @description
 * - Kiểm tra chi nhánh chỉ định có thuộc sở hữu của đối tác hay không.
 * - Tạo người dùng với role `PARTNER_EMPLOYEE`.
 * - Tự động tạo yêu cầu duyệt nhân viên trong `partner_employee_approval_requests` với trạng thái `PENDING`.
 * 
 * @param req AuthRequest chứa thông tin nhân viên { full_name, email, phone, identity_no, gender, nationality, password, branch_id }
 * @param res Express Response trả về thông tin nhân viên vừa tạo (HTTP 201 Created)
 */
export const createEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { full_name, email, phone, identity_no, gender, nationality, password, branch_id } = req.body;
    const employee = await partnerEmployeeMgmtService.createEmployee(req.user!.id, {
      full_name,
      email,
      phone,
      identity_no,
      gender,
      nationality,
      password,
      branch_id,
    });
    res.status(201).json(employee);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

/**
 * [PUT] /api/partner/employees/:id
 * Cập nhật thông tin nhân viên chi nhánh hoặc điều chuyển sang chi nhánh khác.
 * 
 * @param req AuthRequest chứa ID nhân viên trong params và thông tin cập nhật trong body
 * @param res Express Response thông báo cập nhật thành công
 */
export const updateEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employeeId = Number(req.params.id);
    if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
      res.status(400).json({ message: 'ID nhân viên không hợp lệ.' });
      return;
    }
    const result = await partnerEmployeeMgmtService.updateEmployee(req.user!.id, employeeId, req.body);
    res.status(200).json(result);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};
