import { lockUser, unlockUser, getUserById } from '../services/admin/user.service.js';
import pool from '../config/db.js';

async function test() {
  console.log('Testing lock user 8...');
  const res1 = await lockUser(8, 'Vi phạm chính sách thanh toán', 1);
  console.log('Lock result:', res1);

  const u1 = await getUserById(8);
  console.log('User 8 status:', u1?.status, '| Lock reason:', u1?.lock_reason);

  console.log('Testing unlock user 8...');
  const res2 = await unlockUser(8, 1);
  console.log('Unlock result:', res2);

  const u2 = await getUserById(8);
  console.log('User 8 after unlock:', u2?.status, '| Lock reason:', u2?.lock_reason);

  await pool.end();
  console.log('Test completed successfully!');
}

test().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
