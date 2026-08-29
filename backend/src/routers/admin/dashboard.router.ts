/**
 * =========================================================================================
 * FILE: dashboard.router.ts (Admin)
 * VỊ TRÍ: backend/src/routers/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Định tuyến (Routing Layer) cho toàn bộ API thống kê và báo cáo hiệu suất tổng quan (Dashboard) của Admin.
 *   - Tiếp nhận các request HTTP từ Client và chuyển tiếp đến Dashboard Controller xử lý.
 *   - Nghiệp vụ liên quan: UC-ADM-06 (Thống kê tổng quan), UC-ADM-07 (Báo cáo hiệu suất).
 * =========================================================================================
 */

import { Router } from 'express';
import * as dashboardController from '../../controllers/admin/dashboard.controller.js';

const router = Router();

// ─── 1. Endpoint Thống kê Tổng quan (Overview / KPIs / Charts) ──────────────────────
// GET /api/admin/dashboard/overview: Lấy báo cáo KPI toàn sàn, biểu đồ doanh thu và phân tích ngành hàng
router.get('/overview', dashboardController.getOverview);

// GET /api/admin/dashboard/stats: Alias tương thích ngược cho endpoint overview
router.get('/stats', dashboardController.getOverview);

export default router;

