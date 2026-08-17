import { type Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as partnerEmployeeMgmtService from '../../services/partner/partner-employee-mgmt.service.js';
import { sendHttpError } from '../../utils/http-error.js';

export const getEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const list = await partnerEmployeeMgmtService.getEmployees(req.user!.id);
    res.status(200).json(list);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

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

export const toggleEmployeeStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employeeId = Number(req.params.id);
    if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
      res.status(400).json({ message: 'ID nhân viên không hợp lệ.' });
      return;
    }
    const { status } = req.body ?? {};
    const result = await partnerEmployeeMgmtService.toggleEmployeeStatus(req.user!.id, employeeId, status);
    res.status(200).json(result);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};
