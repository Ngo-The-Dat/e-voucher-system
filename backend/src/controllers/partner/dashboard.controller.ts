/**
 * @file dashboard.controller.ts
 * @description Controller cung cấp số liệu thống kê tổng quan và báo cáo hiệu suất chiến dịch
 * cho bảng điều khiển (Dashboard) của Đối tác.
 */

import { type Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as dashboardService from '../../services/partner/dashboard.service.js';
import { sendHttpError } from '../../utils/http-error.js';

/**
 * [GET] /api/partner/dashboard/overview
 * Lấy các chỉ số tổng quan phục vụ trang chủ Dashboard của Đối tác:
 * tổng số chương trình voucher, tổng voucher đã phát hành, số voucher đã sử dụng (redeemed),
 * và doanh thu ước tính.
 * 
 * @param req AuthRequest chứa user token
 * @param res Express Response trả về JSON dữ liệu thống kê tổng quan
 */
export const getOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    const overview = await dashboardService.getOverview(partnerId);
    res.status(200).json(overview);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

/**
 * [GET] /api/partner/dashboard/vouchers
 * Lấy thống kê chi tiết hiệu suất của các chương trình voucher (hoặc theo một `program_id` cụ thể):
 * số lượng phát hành, số lượng đã bán, số lượng đã đổi tại quầy, và tỷ lệ chuyển đổi.
 * 
 * @param req AuthRequest chứa query param `program_id` (tùy chọn)
 * @param res Express Response trả về danh sách thống kê voucher
 */
export const getVoucherStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    const { program_id } = req.query as { program_id?: string };

    let programId: number | undefined;
    if (program_id !== undefined) {
      programId = Number(program_id);
      if (!Number.isSafeInteger(programId) || programId <= 0) {
        res.status(400).json({ message: 'program_id không hợp lệ.' });
        return;
      }
    }

    const stats = await dashboardService.getVoucherStats(partnerId, programId);

    res.status(200).json(stats);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};
