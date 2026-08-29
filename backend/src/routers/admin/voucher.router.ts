/**
 * =========================================================================================
 * FILE: voucher.router.ts (Admin)
 * VỊ TRÍ: backend/src/routers/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Định tuyến (Routing Layer) cho toàn bộ phân hệ Quản lý & Xét duyệt Voucher của Quản trị viên.
 *   - Nghiệp vụ liên quan: UC-ADM-03 (Quản lý Voucher), bao gồm 2 mảng nghiệp vụ lớn:
 *       1. HÀNG ĐỢI XÉT DUYỆT VOUCHER (Pending Vouchers):
 *          - Danh sách voucher đối tác gửi duyệt, xem chi tiết đợt phát hành, chi nhánh, hình ảnh.
 *          - Phê duyệt phát hành (chuyển sang PUBLISHED) hoặc Từ chối kèm lý do (chuyển về DRAFT).
 *       2. QUẢN LÝ KHO VOUCHER TOÀN SÀN (Managed Vouchers):
 *          - Danh sách voucher đang lưu hành, thống kê lượng đã bán (sold_count) và tồn kho (stock).
 *          - Bật/tắt trạng thái hiển thị (PUBLISHED / HIDDEN / ENDED).
 * =========================================================================================
 */

import { Router } from 'express';
import * as voucherController from '../../controllers/admin/voucher.controller.js';

const router = Router();

// ─── 1. Hàng đợi Xét duyệt Voucher (Pending Vouchers) ──────────────────────────────
// GET /api/admin/vouchers/pending: Danh sách voucher do đối tác gửi lên đang chờ duyệt
router.get('/pending', voucherController.getPendingVouchers);

// GET /api/admin/vouchers/pending/:id: Xem chi tiết toàn bộ hồ sơ voucher chờ duyệt (đợt phát hành, giá, chi nhánh)
router.get('/pending/:id', voucherController.getPendingVoucherById);

// POST /api/admin/vouchers/pending/:id/approve: Phê duyệt voucher và phát hành công khai (PUBLISHED)
router.post('/pending/:id/approve', voucherController.approveVoucher);

// POST /api/admin/vouchers/pending/:id/reject: Từ chối voucher kèm lý do (trả về trạng thái DRAFT cho đối tác sửa)
router.post('/pending/:id/reject', voucherController.rejectVoucher);

// ─── 2. Quản lý Kho Voucher Toàn Sàn (Managed Vouchers) ─────────────────────────────
// GET /api/admin/vouchers/manage: Danh sách kho voucher đã duyệt trên hệ thống (lọc status, danh mục)
router.get('/manage', voucherController.getManagedVouchers);

// GET /api/admin/vouchers/manage/:id: Chi tiết voucher đang lưu hành kèm thống kê doanh thu / tồn kho
router.get('/manage/:id', voucherController.getManagedVoucherById);

// PUT /api/admin/vouchers/:id/status: Cập nhật trạng thái hiển thị của voucher (PUBLISHED, HIDDEN, ENDED)
router.put('/:id/status', voucherController.updateVoucherStatus);

export default router;

