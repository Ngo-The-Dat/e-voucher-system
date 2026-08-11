import pool from '../../config/db.js';

export interface CreateSystemLogInput {
  userId: number;
  action: string;
  objectId?: string | number | null;
  objectType?: string | null;
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  result?: 'SUCCESS' | 'FAILED';
}

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
