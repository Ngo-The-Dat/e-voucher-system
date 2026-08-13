import pool from '../config/db.js';

async function main() {
  const res = await pool.query('SELECT user_id, full_name, email, role, status FROM users ORDER BY user_id ASC');
  console.log('USERS IN DB:', res.rows);
  await pool.end();
}

main().catch(console.error);
