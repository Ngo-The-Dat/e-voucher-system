import { type Response, type NextFunction } from 'express';
import { type AuthRequest } from '../../middlewares/auth.middleware.js';
import * as dashboardService from '../../services/admin/dashboard.service.js';

export async function getOverview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { timeframe, start_date, end_date } = req.query;

    const validTimeframes = ['today', 'week', 'month', 'custom'];
    const selectedTimeframe = (timeframe as string) || 'week';

    if (!validTimeframes.includes(selectedTimeframe)) {
      res.status(400).json({ message: 'timeframe không hợp lệ. Phải là today, week, month hoặc custom.' });
      return;
    }

    if (selectedTimeframe === 'custom' && (!start_date || !end_date)) {
      res.status(400).json({ message: 'Khoảng thời gian tùy chọn yêu cầu cung cấp start_date và end_date.' });
      return;
    }

    const overview = await dashboardService.getDashboardOverview({
      timeframe: selectedTimeframe as any,
      startDate: start_date as string,
      endDate: end_date as string,
    });

    res.json(overview);
  } catch (error) {
    next(error);
  }
}
