import pool from '../../config/db.js';
import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';

export interface CustomerRegisterInput {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface CustomerLoginInput {
  email: string;
  password: string;
}

export const register = async (input: CustomerRegisterInput) => {
  const full_name = input.full_name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone ? input.phone.trim() : null;
  const password = input.password;

  if (!full_name || !email || !password) {
    throw { status: 400, message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu.' };
  }

  if (password.length < 6) {
    throw { status: 400, message: 'Mật khẩu phải chứa ít nhất 6 ký tự.' };
  }

  // 1. Kiểm tra email & phone đã được đăng ký chưa
  const emailCheck = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
  if (emailCheck.rows.length > 0) {
    throw { status: 409, message: 'Email này đã được đăng ký trên hệ thống.' };
  }

  if (phone) {
    const phoneCheck = await pool.query('SELECT user_id FROM users WHERE phone = $1', [phone]);
    if (phoneCheck.rows.length > 0) {
      throw { status: 409, message: 'Số điện thoại này đã được đăng ký trên hệ thống.' };
    }
  }

  // 2. Hash mật khẩu
  const password_hash = await bcrypt.hash(password, 10);

  // 3. Thêm user mới với role CUSTOMER
  let result;
  try {
    result = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, status)
       VALUES ($1, $2, $3, $4, 'CUSTOMER', 'ACTIVE')
       RETURNING user_id, full_name, email, phone, role, status, created_at`,
      [full_name, email, phone, password_hash]
    );
  } catch (err: any) {
    if (err.code === '23505') {
      if (err.constraint?.includes('phone')) {
        throw { status: 409, message: 'Số điện thoại này đã được sử dụng.' };
      }
      throw { status: 409, message: 'Email hoặc số điện thoại đã được đăng ký.' };
    }
    throw err;
  }

  const user = result.rows[0];

  // 4. Tạo JWT token
  const secret = process.env.JWT_SECRET || 'defaultsecret';
  const jwtOptions = { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' } as SignOptions;
  const token = jwt.sign(
    { id: Number(user.user_id), role: user.role, email: user.email },
    secret,
    jwtOptions
  );

  return {
    message: 'Đăng ký tài khoản thành công!',
    token,
    user: {
      id: Number(user.user_id),
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  };
};

export const login = async (input: CustomerLoginInput) => {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email || !password) {
    throw { status: 400, message: 'Vui lòng nhập email và mật khẩu.' };
  }

  // 1. Tìm user role CUSTOMER
  const userResult = await pool.query(
    `SELECT user_id, full_name, email, phone, password_hash, role, status
     FROM users
     WHERE email = $1 AND role = 'CUSTOMER'`,
    [email]
  );

  if (userResult.rows.length === 0) {
    throw { status: 401, message: 'Email hoặc mật khẩu không chính xác.' };
  }

  const user = userResult.rows[0];

  // 2. Trạng thái hoạt động
  if (user.status !== 'ACTIVE') {
    throw { status: 403, message: 'Tài khoản của bạn hiện đã bị khóa.' };
  }

  // 3. Verify mật khẩu
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw { status: 401, message: 'Email hoặc mật khẩu không chính xác.' };
  }

  // 4. Tạo JWT token
  const secret = process.env.JWT_SECRET || 'defaultsecret';
  const jwtOptions = { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' } as SignOptions;
  const token = jwt.sign(
    { id: Number(user.user_id), role: user.role, email: user.email },
    secret,
    jwtOptions
  );

  // 5. Cập nhật last_login_at
  await pool.query('UPDATE users SET last_login_at = NOW() WHERE user_id = $1', [user.user_id]);

  return {
    token,
    user: {
      id: Number(user.user_id),
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  };
};

export const getMe = async (userId: number) => {
  const result = await pool.query(
    `SELECT user_id, full_name, email, phone, role, status, created_at
     FROM users
     WHERE user_id = $1 AND role = 'CUSTOMER'`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Không tìm thấy thông tin tài khoản.' };
  }

  const user = result.rows[0];
  return {
    id: Number(user.user_id),
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    created_at: user.created_at,
  };
};
