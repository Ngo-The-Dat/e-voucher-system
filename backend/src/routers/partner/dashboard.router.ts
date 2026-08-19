/**
 * @file dashboard.router.ts
 * @description Router định nghĩa các endpoint lấy dữ liệu thống kê tổng quan và hiệu suất voucher cho Đối tác.
 * Tất cả các route đều yêu cầu xác thực người dùng và có role PARTNER.
 */

import { Router } from 'express';
import * as dashboardController from '../../controllers/partner/dashboard.controller.js';

const router = Router();

// GET /api/partner/dashboard/overview - Số liệu thống kê tổng quan (chương trình, đã bán, đã đổi, doanh thu)
router.get('/overview', dashboardController.getOverview);

// GET /api/partner/dashboard/vouchers - Báo cáo hiệu suất theo từng chương trình voucher (hỗ trợ filter theo ?program_id=)
router.get('/vouchers', dashboardController.getVoucherStats);

export default router;
