/**
 * @file partner.router.ts (Admin)
 * @description Router định nghĩa toàn bộ các endpoint quản trị Đối tác và duyệt Nhân viên đối tác dành cho Admin.
 * Tất cả các route đều yêu cầu xác thực người dùng và có role ADMIN.
 */

import { Router } from 'express';
import * as partnerController from '../../controllers/admin/partner.controller.js';
import * as employeeApprovalController from '../../controllers/admin/employee-approval.controller.js';

const router = Router();

// ─── Xét duyệt Nhân viên Đối tác (Partner Employee Approvals) ──────────────────

// GET /api/admin/partners/employee-approvals/pending - Danh sách nhân viên chờ duyệt / đã duyệt
router.get('/employee-approvals/pending', employeeApprovalController.getPendingEmployees);

// GET /api/admin/partners/employee-approvals/pending/:id - Xem chi tiết hồ sơ nhân viên chờ duyệt
router.get('/employee-approvals/pending/:id', employeeApprovalController.getPendingEmployeeById);

// POST /api/admin/partners/employee-approvals/:id/approve - Duyệt và kích hoạt tài khoản nhân viên
router.post('/employee-approvals/:id/approve', employeeApprovalController.approveEmployee);

// POST /api/admin/partners/employee-approvals/:id/reject - Từ chối duyệt tài khoản nhân viên kèm lý do
router.post('/employee-approvals/:id/reject', employeeApprovalController.rejectEmployee);

// ─── Xét duyệt Hồ sơ Đối tác Doanh nghiệp mới (Pending Partners) ───────────────

// GET /api/admin/partners/pending - Danh sách đối tác chờ duyệt
router.get('/pending', partnerController.getPendingPartners);

// GET /api/admin/partners/pending/:id - Xem chi tiết hồ sơ đối tác chờ duyệt
router.get('/pending/:id', partnerController.getPendingPartnerById);

// ─── Quản lý Đối tác Đã Duyệt (Managed Partners) ───────────────────────────────

// GET /api/admin/partners/manage - Danh sách đối tác đang hoạt động / bị khóa
router.get('/manage', partnerController.getManagedPartners);

// GET /api/admin/partners/manage/:id - Chi tiết đối tác, chi nhánh và các voucher đã tạo
router.get('/manage/:id', partnerController.getManagedPartnerById);

// ─── Các Hành động Quản trị Đối tác ───────────────────────────────────────────

// POST /api/admin/partners/:id/approve - Phê duyệt đối tác mới
router.post('/:id/approve', partnerController.approvePartner);

// POST /api/admin/partners/:id/reject - Từ chối đối tác mới
router.post('/:id/reject', partnerController.rejectPartner);

// POST /api/admin/partners/:id/request-revision - Yêu cầu đối tác bổ sung/chỉnh sửa hồ sơ
router.post('/:id/request-revision', partnerController.requestRevisionPartner);

// POST /api/admin/partners/:id/lock - Khóa tài khoản đối tác
router.post('/:id/lock', partnerController.lockPartner);

// POST /api/admin/partners/:id/unlock - Mở khóa tài khoản đối tác
router.post('/:id/unlock', partnerController.unlockPartner);

// ─── Can thiệp Quản lý Chi nhánh ──────────────────────────────────────────────

// POST /api/admin/partners/:id/branches - Admin tạo chi nhánh cho đối tác
router.post('/:id/branches', partnerController.createBranch);

// PUT /api/admin/partners/:id/branches/:branchId - Admin cập nhật chi nhánh của đối tác
router.put('/:id/branches/:branchId', partnerController.updateBranch);

// DELETE /api/admin/partners/:id/branches/:branchId - Admin xóa chi nhánh của đối tác
router.delete('/:id/branches/:branchId', partnerController.deleteBranch);

export default router;
