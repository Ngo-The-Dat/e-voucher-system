import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware.js';

/**
 * Middleware kiểm tra role người dùng.
 * Dùng sau middleware authenticate.
 */
export const requireRole = (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Chưa xác thực.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        message: `Không có quyền truy cập. Yêu cầu role: ${roles.join(' hoặc ')}.`,
      });
      return;
    }

    next();
  };
