/**
 * =========================================================================================
 * FILE: log.controller.ts
 * VỊ TRÍ: backend/src/controllers/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Tầng Điều khiển (Controller Layer) tiếp nhận các yêu cầu truy vấn Nhật ký Hệ thống (UC-ADM-08).
 *   - Các Endpoint chính:
 *       1. GET /api/admin/logs: Lấy danh sách nhật ký kiểm toán hệ thống có phân trang và bộ lọc.
 *       2. GET /api/admin/logs/:id: Lấy chi tiết 1 bản ghi nhật ký (kèm dữ liệu trước/sau thay đổi).
 * =========================================================================================
 */

import { type Response, type NextFunction } from 'express';
import { type AuthRequest } from '../../middlewares/auth.middleware.js';
import * as logService from '../../services/admin/log.service.js';

/**
 * GET /api/admin/logs
 * Lấy danh sách nhật ký kiểm toán hệ thống (hỗ trợ lọc từ khóa, object_type, result, khoảng ngày)
 */
export async function getLogs(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, object_type, result, start_date, end_date, page, limit } = req.query;
    const logsData = await logService.getSystemLogs({
      search: search as string,
      objectType: object_type as string,
      result: result as string,
      startDate: start_date as string,
      endDate: end_date as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(logsData);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/logs/:id
 * Lấy chi tiết 1 bản ghi nhật ký hệ thống theo Log ID
 */
export async function getLogById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const logId = String(req.params.id);
    if (!logId) {
      res.status(400).json({ message: 'Mã log không hợp lệ' });
      return;
    }

    const logEntry = await logService.getSystemLogById(logId);
    if (!logEntry) {
      res.status(404).json({ message: 'Không tìm thấy bản ghi nhật ký' });
      return;
    }

    res.json(logEntry);
  } catch (error) {
    next(error);
  }
}
