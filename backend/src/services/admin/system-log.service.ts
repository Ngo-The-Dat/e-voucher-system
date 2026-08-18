/**
 * =========================================================================================
 * FILE: system-log.service.ts
 * VỊ TRÍ: backend/src/services/admin/
 * VAI TRÒ TRONG HỆ THỐNG:
 *   - Module Tiện ích Ghi Nhật ký Hệ thống (System Audit Logger).
 *   - Được sử dụng xuyên suốt toàn bộ các Service quản trị (Partner, Voucher, Order, User, Employee...)
 *     để lưu vết lịch sử mọi hành động thay đổi dữ liệu quan trọng vào bảng `system_logs`.
 *   - Hỗ trợ lưu cấu trúc JSON `old_value` và `new_value` để phục vụ đối soát, truy vết và kiểm toán an ninh.
 * =========================================================================================
 */

import pool from '../../config/db.js';

export interface CreateSystemLogInput {
  userId: number;                       // ID người thực hiện thao tác (Admin)
  action: string;                       // Tên hành động (APPROVE_VOUCHER, LOCK_USER, CANCEL_ORDER...)
  objectId?: string | number | null;    // ID của đối tượng bị tác động (Mã voucher, Mã user, Mã đơn...)
  objectType?: string | null;           // Loại đối tượng (USER, VOUCHER, ORDER, APPROVAL_REQUEST...)
  oldValue?: Record<string, any> | null;// Giá trị trước khi thay đổi (JSON object)
  newValue?: Record<string, any> | null;// Giá trị sau khi thay đổi (JSON object)
  result?: 'SUCCESS' | 'FAILED';        // Kết quả thực hiện (SUCCESS / FAILED)
}

/**
 * -----------------------------------------------------------------------------------------
 * HÀM: logAdminAction
 * MỤC ĐÍCH: Ghi 1 dòng nhật ký kiểm toán vào bảng `system_logs`.
 * ĐẶC ĐIỂM: Sử dụng khối try-catch an toàn, không để việc ghi log làm gián đoạn transaction chính.
 * -----------------------------------------------------------------------------------------
 */
export async function logAdminAction(input: CreateSystemLogInput): Promise<void> {
  const {
    userId,
    action,
    objectId = null,
    objectType = null,
    oldValue = null,
    newValue = null,
    result = 'SUCCESS',
  } = input;

  const formattedObjectId = objectId !== null && objectId !== undefined ? String(objectId) : null;
  const formattedObjectType = formattedObjectId ? objectType : null;

  try {
    await pool.query(
      `INSERT INTO system_logs (
        user_id, action, object_id, object_type, old_value, new_value, result
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        action,
        formattedObjectId,
        formattedObjectType,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        result,
      ]
    );
  } catch (err) {
    console.error('Error logging admin action to system_logs:', err);
  }
}
