import { type Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as branchService from '../../services/partner/branch.service.js';
import { sendHttpError } from '../../utils/http-error.js';

export const createBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    const { branch_name, address, region, phone } = req.body;

    if (typeof branch_name !== 'string' || !branch_name.trim() ||
        typeof address !== 'string' || !address.trim()) {
      res.status(400).json({ message: 'Vui lòng nhập tên chi nhánh và địa chỉ.' });
      return;
    }

    const branch = await branchService.createBranch(partnerId, { branch_name, address, region, phone });
    res.status(201).json({ message: 'Tạo chi nhánh thành công.', branch });
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

export const getBranches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    const branches = await branchService.getBranches(partnerId);
    res.status(200).json(branches);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

export const getBranchById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    const branchId = parseInt(String(req.params.id));

    if (isNaN(branchId)) {
      res.status(400).json({ message: 'ID chi nhánh không hợp lệ.' });
      return;
    }

    const branch = await branchService.getBranchById(branchId, partnerId);
    res.status(200).json(branch);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

export const updateBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    const branchId = parseInt(String(req.params.id));

    if (isNaN(branchId)) {
      res.status(400).json({ message: 'ID chi nhánh không hợp lệ.' });
      return;
    }

    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      res.status(400).json({ message: 'Nội dung cập nhật chi nhánh không hợp lệ.' });
      return;
    }
    const allowedFields = new Set(['branch_name', 'address', 'region', 'phone', 'status']);
    const fields = Object.keys(req.body);
    if (fields.length === 0 || fields.some((field) => !allowedFields.has(field))) {
      res.status(400).json({ message: 'Trường cập nhật chi nhánh không hợp lệ.' });
      return;
    }
    const stringFields: Array<[string, number, boolean]> = [
      ['branch_name', 255, false],
      ['address', 500, false],
      ['region', 150, true],
      ['phone', 20, true],
    ];
    for (const [field, maxLength, allowEmpty] of stringFields) {
      const value = req.body[field];
      if (value !== undefined &&
          (typeof value !== 'string' || (!allowEmpty && !value.trim()) || value.length > maxLength)) {
        res.status(400).json({ message: `${field} không hợp lệ hoặc vượt quá ${maxLength} ký tự.` });
        return;
      }
    }
    if (req.body.status !== undefined && !['ACTIVE', 'INACTIVE'].includes(req.body.status)) {
      res.status(400).json({ message: 'Trạng thái chi nhánh không hợp lệ.' });
      return;
    }

    const branch = await branchService.updateBranch(branchId, partnerId, req.body);
    res.status(200).json({ message: 'Cập nhật chi nhánh thành công.', branch });
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

export const deleteBranch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    const branchId = parseInt(String(req.params.id));

    if (isNaN(branchId)) {
      res.status(400).json({ message: 'ID chi nhánh không hợp lệ.' });
      return;
    }

    await branchService.deleteBranch(branchId, partnerId);
    res.status(200).json({ message: 'Chi nhánh đã được vô hiệu hóa.' });
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};
