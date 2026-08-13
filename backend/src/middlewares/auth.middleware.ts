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
              CASE WHEN u.role = 'PARTNER_EMPLOYEE'
                   THEN employee_partner.approval_status ELSE p.approval_status END AS approval_status,
              CASE WHEN u.role = 'PARTNER_EMPLOYEE'
                   THEN employee_partner.activity_status ELSE p.activity_status END AS activity_status,
              employee_branch.status AS branch_status
       FROM users u
       LEFT JOIN partners p ON p.user_id = u.user_id
       LEFT JOIN partner_employees pe ON pe.user_id = u.user_id
       LEFT JOIN branches employee_branch ON employee_branch.branch_id = pe.branch_id
       LEFT JOIN partners employee_partner ON employee_partner.user_id = employee_branch.partner_id
       WHERE u.user_id = $1`,
      [decoded.id]
    );
    const user = result.rows[0];
    if (!user || user.status !== 'ACTIVE' || user.role !== decoded.role) {
      res.status(401).json({ message: 'Tài khoản không còn hợp lệ hoặc đã bị khóa.' });
      return;
    }
    if (['PARTNER', 'PARTNER_EMPLOYEE'].includes(user.role) &&
        (user.approval_status !== 'APPROVED' || user.activity_status !== 'ACTIVE')) {
      res.status(403).json({ message: 'Tài khoản đối tác chưa được duyệt hoặc đã bị vô hiệu hóa.' });
      return;
    }
    if (user.role === 'PARTNER_EMPLOYEE' && user.branch_status !== 'ACTIVE') {
      res.status(403).json({ message: 'Chi nhánh được phân công đã bị vô hiệu hóa.' });
      return;
    }

    req.user = { id: Number(user.user_id), role: user.role, email: user.email };
    next();
  } catch (err) {
    next(err);
  }
};
