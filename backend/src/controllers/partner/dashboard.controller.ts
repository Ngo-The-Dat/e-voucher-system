import { type Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as dashboardService from '../../services/partner/dashboard.service.js';

export const getOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    const overview = await dashboardService.getOverview(partnerId);
    res.status(200).json(overview);
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    res.status(error.status || 500).json({ message: error.message || 'Lỗi hệ thống.' });
  }
};

export const getVoucherStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    const { program_id } = req.query as { program_id?: string };

    const stats = await dashboardService.getVoucherStats(
      partnerId,
      program_id ? parseInt(program_id) : undefined
    );

    res.status(200).json(stats);
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    res.status(error.status || 500).json({ message: error.message || 'Lỗi hệ thống.' });
  }
};
