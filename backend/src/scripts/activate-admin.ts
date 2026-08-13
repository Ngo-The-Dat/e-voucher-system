import pool from '../config/db.js';

async function main() {
  await pool.query("UPDATE users SET status = 'ACTIVE' WHERE user_id = 1");
  await pool.query("DELETE FROM user_locks WHERE user_id = 1");
  console.log('User 1 is now ACTIVE!');
  await pool.end();
}

main().catch(console.error);
