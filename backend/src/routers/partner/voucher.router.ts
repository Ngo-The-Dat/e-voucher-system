/**
 * @file voucher.router.ts
 * @description Router định nghĩa toàn bộ các endpoint quản lý chiến dịch Voucher và bộ sưu tập ảnh cho Đối tác.
 * Tất cả các route đều yêu cầu xác thực người dùng và có role PARTNER.
 */

import { Router } from 'express';
import * as voucherController from '../../controllers/partner/voucher.controller.js';
import * as voucherImageController from '../../controllers/partner/voucher-image.controller.js';
import { voucherImageUpload } from '../../middlewares/voucher-image-upload.middleware.js';

const router = Router();

// POST /api/partner/vouchers - Tạo chương trình voucher mới (trạng thái DRAFT)
router.post('/', voucherController.createVoucherProgram);

// GET /api/partner/vouchers - Lấy danh sách voucher theo bộ lọc status, search và phân trang
router.get('/', voucherController.getVoucherPrograms);

// GET /api/partner/vouchers/categories - Danh sách ngành hàng/danh mục đang hoạt động
router.get('/categories', voucherController.getCategories);

// ─── Quản lý Bộ sưu tập Ảnh của Voucher (Image Gallery) ─────────────────────────

// POST /api/partner/vouchers/:id/images - Tải lên ảnh mới cho voucher
router.post('/:id/images', voucherImageUpload.single('image'), voucherImageController.uploadImage);

// PUT /api/partner/vouchers/:id/images/order - Sắp xếp lại thứ tự ảnh
router.put('/:id/images/order', voucherImageController.reorder);

// PATCH /api/partner/vouchers/:id/images/:imageId/primary - Thiết lập ảnh đại diện chính
router.patch('/:id/images/:imageId/primary', voucherImageController.setPrimary);

// DELETE /api/partner/vouchers/:id/images/:imageId - Xóa ảnh khỏi voucher
router.delete('/:id/images/:imageId', voucherImageController.remove);

// ─── Chi tiết, Chỉnh sửa & Gửi duyệt Voucher ───────────────────────────────────

// GET /api/partner/vouchers/:id - Lấy thông tin chi tiết voucher kèm ảnh và danh sách chi nhánh
router.get('/:id', voucherController.getVoucherProgramById);

// PUT /api/partner/vouchers/:id - Chỉnh sửa thông tin voucher (chỉ cho phép khi ở trạng thái DRAFT)
router.put('/:id', voucherController.updateVoucherProgram);

// POST /api/partner/vouchers/:id/submit - Gửi yêu cầu phê duyệt chương trình voucher lên Admin
router.post('/:id/submit', voucherController.submitForApproval);

// GET /api/partner/vouchers/:id/approval - Xem trạng thái và lịch sử phê duyệt của voucher
router.get('/:id/approval', voucherController.getApprovalStatus);

// PATCH /api/partner/vouchers/:id/visibility - Bật/Tắt hiển thị voucher đã duyệt (PUBLISHED ↔ HIDDEN)
router.patch('/:id/visibility', voucherController.updateVisibility);

export default router;
