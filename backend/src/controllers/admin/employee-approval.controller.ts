/**
 * =========================================================================================
 * FILE: employee-approval.controller.ts
 * VỊ TRÍ: backend/src/controllers/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Tầng Điều khiển (Controller Layer) tiếp nhận các HTTP Request từ Router Admin.
 *   - Thực hiện kiểm tra tính hợp lệ (Validation) của dữ liệu đầu vào (params, query, body).
 *   - Chuyển tiếp yêu cầu xử lý sang `employeeApprovalService` và định dạng phản hồi HTTP (200, 400, 404, 500) trả về cho Frontend.
 * =========================================================================================
 */

import { type Response, type NextFunction } from 'express';
import { type AuthRequest } from '../../middlewares/auth.middleware.js';
import * as employeeApprovalService from '../../services/admin/employee-approval.service.js';

/**
 * -----------------------------------------------------------------------------------------
 * HÀM: getPendingEmployees
 * ENDPOINT: GET /api/admin/partners/employee-approvals
 * MỤC ĐÍCH: Tiếp nhận yêu cầu lọc danh sách nhân viên đối tác từ client
 * 
 * LUỒNG XỬ LÝ:
 *   1. Trích xuất các query parameters: search, status, start_date, end_date, page, limit.
 *   2. Chuyển đổi kiểu dữ liệu (cast string sang number cho page & limit).
 *   3. Gọi `employeeApprovalService.getPendingEmployees(...)` để truy vấn CSDL.
 *   4. Trả về mã HTTP 200 kèm danh sách nhân viên và thông tin phân trang.
 * -----------------------------------------------------------------------------------------
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
    // Chuyển tiếp lỗi cho Global Error Middleware xử lý
    next(error);
  }
}

/**
 * -----------------------------------------------------------------------------------------
 * HÀM: getPendingEmployeeById
 * ENDPOINT: GET /api/admin/partners/employee-approvals/:id
 * MỤC ĐÍCH: Tiếp nhận yêu cầu lấy chi tiết 1 hồ sơ nhân viên đối tác
 * 
 * LUỒNG XỬ LÝ:
 *   1. Lấy `id` từ `req.params` và kiểm tra có phải là số nguyên dương hợp lệ không.
 *      - Nếu không hợp lệ: Trả về HTTP 400 Bad Request.
 *   2. Gọi Service để tìm thông tin nhân viên theo ID.
 *   3. Nếu không tìm thấy: Trả về HTTP 404 Not Found.
 *   4. Nếu tìm thấy: Trả về dữ liệu chi tiết JSON với HTTP 200.
 * -----------------------------------------------------------------------------------------
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
 * -----------------------------------------------------------------------------------------
 * HÀM: approveEmployee
 * ENDPOINT: POST /api/admin/partners/employee-approvals/:id/approve
 * MỤC ĐÍCH: Xử lý hành động phê duyệt hồ sơ nhân viên đối tác của Admin
 * 
 * LUỒNG XỬ LÝ:
 *   1. Lấy `employeeId` từ param và `adminId` từ `req.user` (đã được giải mã từ JWT Token).
 *   2. Validate mã nhân viên.
 *   3. Gọi Service để kích hoạt tài khoản nhân viên và ghi nhật ký hệ thống.
 *   4. Trả về thông báo thành công cho client.
 * -----------------------------------------------------------------------------------------
 */
export async function approveEmployee(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const employeeId = Number(req.params.id);
    const adminId = req.user?.id || 1; // Lấy ID admin thực hiện từ JWT token

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
 * -----------------------------------------------------------------------------------------
 * HÀM: rejectEmployee
 * ENDPOINT: POST /api/admin/partners/employee-approvals/:id/reject
 * MỤC ĐÍCH: Xử lý hành động từ chối hồ sơ nhân viên đối tác kèm lý do phản hồi
 * 
 * LUỒNG XỬ LÝ:
 *   1. Lấy `employeeId` từ param, `reason` từ body và `adminId` từ token.
 *   2. Validate dữ liệu đầu vào.
 *   3. Gọi Service để chuyển trạng thái sang `REJECTED`, lưu lý do từ chối và ghi log.
 *   4. Trả về phản hồi thành công.
 * -----------------------------------------------------------------------------------------
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
