/**
 * =========================================================================================
 * FILE: content.router.ts (Admin)
 * VỊ TRÍ: backend/src/routers/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Định tuyến (Routing Layer) cho toàn bộ phân hệ Quản trị Nội dung (Content Management System - CMS).
 *   - Nghiệp vụ liên quan: UC-ADM-05 (Quản lý Nội dung), bao gồm 5 nhóm Router:
 *       1. Danh mục ngành hàng (Categories): CRUD danh mục, gán/gỡ voucher vào danh mục, kiểm tra Rule A1.
 *       2. Banner quảng cáo (Banners): CRUD banner, thiết lập thứ tự hiển thị và liên kết đích.
 *       3. Popup thông báo (Popups): CRUD popup, thiết lập thời gian bắt đầu/kết thúc hiển thị.
 *       4. Bài viết / Tin tức (Articles / Contents): Soạn thảo, xuất bản và gỡ bài viết.
 *       5. Helper Routers: Lấy danh sách tùy chọn voucher phục vụ liên kết nội dung.
 * =========================================================================================
 */

import { Router } from 'express';
import * as contentController from '../../controllers/admin/content.controller.js';

// ─── 1. Router Quản lý Danh mục Ngành hàng (Categories) ───────────────────────────
export const categoryRouter = Router();
// GET /api/admin/content/categories: Danh sách danh mục kèm số lượng voucher trực thuộc
categoryRouter.get('/', contentController.getCategories);
// GET /api/admin/content/categories/:id: Chi tiết danh mục kèm danh sách voucher đã gán
categoryRouter.get('/:id', contentController.getCategoryById);
// POST /api/admin/content/categories: Tạo danh mục mới
categoryRouter.post('/', contentController.createCategory);
// PUT /api/admin/content/categories/:id: Cập nhật thông tin/trạng thái danh mục (kiểm tra cảnh báo Rule A1 nếu ẩn)
categoryRouter.put('/:id', contentController.updateCategory);
// DELETE /api/admin/content/categories/:id: Xóa danh mục (ràng buộc kiểm tra voucher đang gán)
categoryRouter.delete('/:id', contentController.deleteCategory);
// POST /api/admin/content/categories/:id/vouchers: Gán voucher vào danh mục
categoryRouter.post('/:id/vouchers', contentController.assignVouchersToCategory);
// DELETE /api/admin/content/categories/:id/vouchers/:programId: Gỡ voucher khỏi danh mục
categoryRouter.delete('/:id/vouchers/:programId', contentController.removeVoucherFromCategory);

// ─── 2. Router Quản lý Banners Quảng Cáo (Banners) ─────────────────────────────────
export const bannerRouter = Router();
// GET /api/admin/content/banners: Danh sách banner (lọc vị trí, trạng thái)
bannerRouter.get('/', contentController.getBanners);
// GET /api/admin/content/banners/:id: Chi tiết banner
bannerRouter.get('/:id', contentController.getBannerById);
// POST /api/admin/content/banners: Tạo banner mới
bannerRouter.post('/', contentController.createBanner);
// PUT /api/admin/content/banners/:id: Cập nhật banner
bannerRouter.put('/:id', contentController.updateBanner);
// DELETE /api/admin/content/banners/:id: Xóa banner
bannerRouter.delete('/:id', contentController.deleteBanner);

// ─── 3. Router Quản lý Popup Thông Báo (Popups) ───────────────────────────────────
export const popupRouter = Router();
// GET /api/admin/content/popups: Danh sách popups
popupRouter.get('/', contentController.getPopups);
// GET /api/admin/content/popups/:id: Chi tiết popup
popupRouter.get('/:id', contentController.getPopupById);
// POST /api/admin/content/popups: Tạo popup mới
popupRouter.post('/', contentController.createPopup);
// PUT /api/admin/content/popups/:id: Cập nhật popup
popupRouter.put('/:id', contentController.updatePopup);
// DELETE /api/admin/content/popups/:id: Xóa popup
popupRouter.delete('/:id', contentController.deletePopup);

// ─── 4. Router Quản lý Bài viết / Tin tức (Articles) ───────────────────────────────
export const articleRouter = Router();
// GET /api/admin/content/articles: Danh sách bài viết
articleRouter.get('/', contentController.getContents);
// GET /api/admin/content/articles/:id: Chi tiết bài viết (kèm nội dung HTML)
articleRouter.get('/:id', contentController.getContentById);
// POST /api/admin/content/articles: Tạo bài viết mới
articleRouter.post('/', contentController.createContent);
// PUT /api/admin/content/articles/:id: Cập nhật bài viết
articleRouter.put('/:id', contentController.updateContent);
// DELETE /api/admin/content/articles/:id: Xóa bài viết
articleRouter.delete('/:id', contentController.deleteContent);

// ─── 5. Router Hỗ trợ Lấy Dữ liệu Danh sách Chọn (Helpers) ──────────────────────────
export const contentHelperRouter = Router();
// GET /api/admin/content/voucher-options: Lấy danh sách voucher rút gọn để chọn khi liên kết banner/danh mục
contentHelperRouter.get('/voucher-options', contentController.getVoucherProgramOptions);

export default {
  categoryRouter,
  bannerRouter,
  popupRouter,
  articleRouter,
  contentHelperRouter,
};

