import { type Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as employeeService from '../../services/partner/employee.service.js';
import { sendHttpError } from '../../utils/http-error.js';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await employeeService.getEmployeeProfile(req.user!.id);
    res.status(200).json(profile);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

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

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { old_password, new_password } = req.body;
    await employeeService.changeEmployeePassword(req.user!.id, old_password, new_password);
    res.status(200).json({ message: 'Đổi mật khẩu thành công.' });
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};
