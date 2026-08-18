/**
 * @file employee.controller.ts
 * @description Controller cung cấp các chức năng tự phục vụ cho Nhân viên đối tác (Partner Employee Self-Service):
 * xem thông tin hồ sơ cá nhân kèm thông tin chi nhánh công tác và thương hiệu chủ quản,
 * cập nhật số điện thoại / họ tên cá nhân và đổi mật khẩu tài khoản.
 */

import { type Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as employeeService from '../../services/partner/partner-employee-profile.service.js';
import { sendHttpError } from '../../utils/http-error.js';

/**
 * [GET] /api/partner/employee/profile
 * Lấy thông tin cá nhân của nhân viên đang đăng nhập, bao gồm chi nhánh công tác và thương hiệu đối tác.
 * 
 * @param req AuthRequest chứa user token của nhân viên
 * @param res Express Response trả về JSON thông tin nhân viên
 */
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await employeeService.getEmployeeProfile(req.user!.id);
    res.status(200).json(profile);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

/**
 * [PUT] /api/partner/employee/profile
 * Cập nhật thông tin cá nhân của nhân viên (họ tên, SĐT, giới tính, quốc tịch).
 * 
 * @param req AuthRequest chứa dữ liệu cập nhật
 * @param res Express Response trả về thông tin hồ sơ sau khi cập nhật
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { full_name, phone, gender, nationality } = req.body;
    const profile = await employeeService.updateEmployeeProfile(req.user!.id, {
      full_name,
      phone,
      gender,
      nationality,
    });
    res.status(200).json(profile);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

/**
 * [POST] /api/partner/employee/change-password
 * Đổi mật khẩu tài khoản cho Nhân viên đối tác.
 * 
 * @param req AuthRequest chứa { old_password, new_password }
 * @param res Express Response thông báo đổi mật khẩu thành công
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { old_password, new_password } = req.body;
    await employeeService.changeEmployeePassword(req.user!.id, old_password, new_password);
    res.status(200).json({ message: 'Đổi mật khẩu thành công.' });
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};
