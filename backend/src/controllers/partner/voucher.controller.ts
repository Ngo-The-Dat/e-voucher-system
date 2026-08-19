/**
 * @file voucher.controller.ts
 * @description Controller quản lý các chiến dịch / chương trình khuyến mãi Voucher của Đối tác:
 * tạo chương trình voucher, lấy danh sách phân trang (draft, pending, approved, rejected),
 * xem chi tiết, chỉnh sửa thông tin chương trình, gửi yêu cầu phê duyệt lên Admin, và ẩn/hiện voucher.
 */

import { type Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as voucherService from '../../services/partner/voucher.service.js';
import { sendHttpError } from '../../utils/http-error.js';

/**
 * [POST] /api/partner/vouchers
 * Tạo một chương trình voucher mới (mặc định ở trạng thái DRAFT).
 * 
 * @description
 * Yêu cầu đầy đủ:
 * - Thông tin cơ bản: Tên voucher, danh mục ngành hàng (`category_id`), giá gốc (`original_price`), giá bán (`sale_price`), số lượng phát hành.
 * - Khung thời gian: Bán (`sale_start_at` -> `sale_end_at`) và sử dụng (`use_start_at` -> `use_end_at`).
 * - Danh sách chi nhánh áp dụng (`branch_ids`).
 * 
 * @param req AuthRequest chứa dữ liệu chương trình voucher
 * @param res Express Response trả về chương trình vừa tạo (HTTP 201 Created)
 */
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

/**
 * [GET] /api/partner/vouchers
 * Lấy danh sách các chương trình voucher của đối tác có hỗ trợ lọc theo trạng thái, từ khóa tìm kiếm và phân trang.
 * 
 * @param req AuthRequest chứa query: `status` ('draft' | 'pending' | 'approved' | 'rejected'), `search`, `page`, `limit`
 * @param res Express Response trả về { data, pagination: { total, page, limit, totalPages } }
 */
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

/**
 * [GET] /api/partner/vouchers/categories
 * Lấy danh sách toàn bộ các danh mục ngành hàng đang hoạt động để hiển thị lựa chọn khi tạo voucher.
 * 
 * @param _req AuthRequest
 * @param res Express Response trả về danh sách categories
 */
export const getCategories = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json(await voucherService.getActiveCategories());
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

/**
 * [GET] /api/partner/vouchers/:id
 * Lấy thông tin chi tiết một chương trình voucher (kèm danh sách chi nhánh và hình ảnh mô tả).
 * 
 * @param req AuthRequest chứa ID chương trình
 * @param res Express Response trả về dữ liệu voucher
 */
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

/**
 * [PUT] /api/partner/vouchers/:id
 * Cập nhật nội dung chương trình voucher (chỉ cho phép chỉnh sửa khi ở trạng thái DRAFT hoặc bị REJECTED).
 * 
 * @param req AuthRequest chứa dữ liệu cập nhật
 * @param res Express Response trả về chương trình sau cập nhật
 */
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

/**
 * [POST] /api/partner/vouchers/:id/submit
 * Gửi chương trình voucher lên Quản trị viên (Admin) để xin phê duyệt phát hành.
 * 
 * @param req AuthRequest chứa ID chương trình
 * @param res Express Response thông báo gửi duyệt thành công
 */
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

/**
 * [GET] /api/partner/vouchers/:id/approval-status
 * Xem lịch sử và trạng thái phê duyệt gần nhất của chương trình voucher (kèm lý do phản hồi của Admin nếu bị từ chối).
 * 
 * @param req AuthRequest chứa ID chương trình
 * @param res Express Response trả về bản ghi phê duyệt
 */
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

/**
 * [PUT] /api/partner/vouchers/:id/visibility
 * Thay đổi trạng thái hiển thị của voucher đã được duyệt (Ẩn / Hiện: `HIDDEN` hoặc `PUBLISHED`).
 * 
 * @param req AuthRequest chứa { display_status: 'PUBLISHED' | 'HIDDEN' }
 * @param res Express Response thông báo cập nhật thành công
 */
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
