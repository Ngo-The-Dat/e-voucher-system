import { type Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import * as dashboardService from '../../services/partner/dashboard.service.js';
import { sendHttpError } from '../../utils/http-error.js';

export const getOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partnerId = req.user!.id;
    const overview = await dashboardService.getOverview(partnerId);
    res.status(200).json(overview);
  } catch (err: unknown) {
    sendHttpError(res, err);
  }
};

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
