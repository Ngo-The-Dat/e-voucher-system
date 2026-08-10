import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
    email: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Chưa xác thực. Vui lòng đăng nhập.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    next(new Error('JWT_SECRET chưa được cấu hình'));
    return;
  }

  let decoded: AuthRequest['user'];
  try {
    const payload = jwt.verify(token, secret) as { id?: unknown; role?: unknown; email?: unknown };
    const id = Number(payload.id);
    if (!Number.isSafeInteger(id) || id <= 0 || typeof payload.role !== 'string') {
      throw new Error('Payload token không hợp lệ');
    }
    decoded = { id, role: payload.role, email: typeof payload.email === 'string' ? payload.email : '' };
  } catch {
    res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT u.user_id, u.email, u.role, u.status,
              p.approval_status, p.activity_status
       FROM users u
       LEFT JOIN partners p ON p.user_id = u.user_id
       WHERE u.user_id = $1`,
      [decoded.id]
    );
    const user = result.rows[0];
    if (!user || user.status !== 'ACTIVE' || user.role !== decoded.role) {
      res.status(401).json({ message: 'Tài khoản không còn hợp lệ hoặc đã bị khóa.' });
      return;
    }
    if (user.role === 'PARTNER' &&
        (user.approval_status !== 'APPROVED' || user.activity_status !== 'ACTIVE')) {
      res.status(403).json({ message: 'Tài khoản đối tác chưa được duyệt hoặc đã bị vô hiệu hóa.' });
      return;
    }

    req.user = { id: Number(user.user_id), role: user.role, email: user.email };
    next();
  } catch (err) {
    next(err);
  }
};
