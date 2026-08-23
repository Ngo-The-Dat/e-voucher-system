import pool from '../config/db.js';

async function listUsers() {
  const res = await pool.query('SELECT user_id, full_name, email, role, phone FROM users ORDER BY user_id ASC');
  console.table(res.rows);
  await pool.end();
}

listUsers().catch(console.error);
