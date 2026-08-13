import { type Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as voucherService from '../../services/partner/voucher.service.js';
import { sendHttpError } from '../../utils/http-error.js';

export const createVoucherProgram = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    const {
      program_name, category_id, original_price, sale_price,
      issue_quantity, sale_start_at, sale_end_at, use_start_at, use_end_at, branch_ids,
    } = req.body;

    if (typeof program_name !== 'string' || !program_name.trim() ||
        !Number.isSafeInteger(category_id) || category_id <= 0 ||
        [original_price, sale_price, issue_quantity, sale_start_at, sale_end_at, use_start_at, use_end_at]
          .some((value) => value === undefined || value === null || value === '')) {
      res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin chương trình voucher.' });
      return;
    }

    if (!Array.isArray(branch_ids) || branch_ids.length === 0) {
      res.status(400).json({ message: 'Cần chọn ít nhất 1 chi nhánh áp dụng.' });
      return;
    }

    const program = await voucherService.createVoucherProgram(partnerId, {
      program_name, category_id, original_price, sale_price,
      issue_quantity, sale_start_at, sale_end_at, use_start_at, use_end_at, branch_ids,
    });

    res.status(201).json({ message: 'Tạo chương trình voucher thành công.', program });
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

export const getVoucherPrograms = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    const {
      status,
      search,
      page = '1',
      limit = '10',
    } = req.query as Record<string, string>;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const validStatuses = ['draft', 'pending', 'approved', 'rejected'];
    if (!Number.isSafeInteger(parsedPage) || parsedPage <= 0 ||
        !Number.isSafeInteger(parsedLimit) || parsedLimit <= 0 || parsedLimit > 100) {
      res.status(400).json({ message: 'page phải >= 1 và limit phải từ 1 đến 100.' });
      return;
    }
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({ message: 'status không hợp lệ.' });
      return;
    }

    const result = await voucherService.getVoucherPrograms(partnerId, {
      status,
      search,
      page: parsedPage,
      limit: parsedLimit,
    });

    res.status(200).json(result);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

export const getCategories = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json(await voucherService.getActiveCategories());
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

export const getVoucherProgramById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    const programId = parseInt(String(req.params.id));

    if (isNaN(programId)) {
      res.status(400).json({ message: 'ID chương trình không hợp lệ.' });
      return;
    }

    const program = await voucherService.getVoucherProgramById(programId, partnerId);
    res.status(200).json(program);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

export const updateVoucherProgram = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    const programId = parseInt(String(req.params.id));

    if (isNaN(programId)) {
      res.status(400).json({ message: 'ID chương trình không hợp lệ.' });
      return;
    }

    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      res.status(400).json({ message: 'Nội dung cập nhật voucher không hợp lệ.' });
      return;
    }
    const allowedFields = new Set([
      'program_name', 'category_id', 'original_price', 'sale_price', 'issue_quantity',
      'sale_start_at', 'sale_end_at', 'use_start_at', 'use_end_at', 'branch_ids',
    ]);
    const fields = Object.keys(req.body);
    if (fields.length === 0 || fields.some((field) => !allowedFields.has(field))) {
      res.status(400).json({ message: 'Trường cập nhật voucher không hợp lệ.' });
      return;
    }
    if (req.body.program_name !== undefined &&
        (typeof req.body.program_name !== 'string' || !req.body.program_name.trim() ||
         req.body.program_name.length > 255)) {
      res.status(400).json({ message: 'Tên chương trình voucher không hợp lệ.' });
      return;
    }
    if (req.body.category_id !== undefined &&
        (!Number.isSafeInteger(req.body.category_id) || req.body.category_id <= 0)) {
      res.status(400).json({ message: 'Danh mục không hợp lệ.' });
      return;
    }
    for (const field of ['original_price', 'sale_price'] as const) {
      const value = req.body[field];
      if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value < 0)) {
        res.status(400).json({ message: `${field} phải là số không âm.` });
        return;
      }
    }
    if (req.body.issue_quantity !== undefined &&
        (!Number.isSafeInteger(req.body.issue_quantity) || req.body.issue_quantity <= 0)) {
      res.status(400).json({ message: 'Số lượng phát hành phải là số nguyên dương.' });
      return;
    }
    for (const field of ['sale_start_at', 'sale_end_at', 'use_start_at', 'use_end_at'] as const) {
      const value = req.body[field];
      if (value !== undefined &&
          (typeof value !== 'string' || !value.trim() || Number.isNaN(new Date(value).getTime()))) {
        res.status(400).json({ message: `${field} không hợp lệ.` });
        return;
      }
    }
    if (req.body.branch_ids !== undefined &&
        (!Array.isArray(req.body.branch_ids) || req.body.branch_ids.length === 0 ||
         req.body.branch_ids.some((id: unknown) => !Number.isSafeInteger(id) || Number(id) <= 0) ||
         new Set(req.body.branch_ids).size !== req.body.branch_ids.length)) {
      res.status(400).json({ message: 'Danh sách chi nhánh không hợp lệ hoặc bị trùng.' });
      return;
    }

    const program = await voucherService.updateVoucherProgram(programId, partnerId, req.body);
    res.status(200).json({ message: 'Cập nhật chương trình voucher thành công.', program });
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

export const submitForApproval = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    const programId = parseInt(String(req.params.id));

    if (isNaN(programId)) {
      res.status(400).json({ message: 'ID chương trình không hợp lệ.' });
      return;
    }

    await voucherService.submitForApproval(programId, partnerId);
    res.status(200).json({ message: 'Gửi yêu cầu phê duyệt thành công. Vui lòng chờ Admin xem xét.' });
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

export const getApprovalStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    const programId = parseInt(String(req.params.id));

    if (isNaN(programId)) {
      res.status(400).json({ message: 'ID chương trình không hợp lệ.' });
      return;
    }

    const approval = await voucherService.getApprovalStatus(programId, partnerId);
    res.status(200).json(approval);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

export const updateVisibility = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    const programId = parseInt(String(req.params.id));
    const { display_status } = req.body as { display_status?: 'PUBLISHED' | 'HIDDEN' };

    if (isNaN(programId)) {
      res.status(400).json({ message: 'ID chương trình không hợp lệ.' });
      return;
    }

    if (!display_status || !['PUBLISHED', 'HIDDEN'].includes(display_status)) {
      res.status(400).json({ message: 'display_status phải là PUBLISHED hoặc HIDDEN.' });
      return;
    }

    await voucherService.updateVisibility(programId, partnerId, display_status);
    res.status(200).json({
      message: display_status === 'PUBLISHED' ? 'Đã hiển thị voucher.' : 'Đã ẩn voucher.',
    });
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};
