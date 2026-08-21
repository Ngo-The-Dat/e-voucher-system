/**
 * @file admin-profile.ts
 * @description Định nghĩa TypeScript Interfaces cho Hồ sơ cá nhân và Cập nhật mật khẩu Quản trị viên (Admin Profile).
 */

/**
 * Cấu trúc thông tin hồ sơ tài khoản Quản trị viên.
 */
export interface AdminProfile {
  user_id: number;
  full_name: string;
  email: string;
  phone: string | null;
  gender: string | null;
  identity_no: string | null;
  nationality: string | null;
  status: string;
  role: string;
  created_at: string;
  last_login_at: string | null;
}

/**
 * Payload dữ liệu khi Quản trị viên cập nhật thông tin cá nhân.
 */
export interface UpdateAdminProfilePayload {
  full_name?: string;
  phone?: string | null;
  gender?: string | null;
  nationality?: string | null;
  identity_no?: string | null;
}

/**
 * Payload dữ liệu khi Quản trị viên đổi mật khẩu tài khoản.
 */
export interface ChangeAdminPasswordPayload {
  old_password: string;
  new_password: string;
}
