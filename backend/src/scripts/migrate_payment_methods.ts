import pool from '../config/db.js';

async function migrate() {
  console.log('🔄 Đang cập nhật ràng buộc chk_orders_payment_method...');
  try {
    await pool.query(`
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_payment_method;
      ALTER TABLE orders ADD CONSTRAINT chk_orders_payment_method 
        CHECK (payment_method IN ('STRIPE', 'VNPAY', 'ZALOPAY', 'PAYPAL'));
    `);
    const constraint = await pool.query(`
      SELECT pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conname = 'chk_orders_payment_method'
        AND conrelid = 'orders'::regclass
    `);
    const definition = String(constraint.rows[0]?.definition || '');
    if (!definition.includes("'ZALOPAY'")) {
      throw new Error(`Constraint không cho phép ZALOPAY: ${definition}`);
    }
    console.log(`✅ Cập nhật ràng buộc chk_orders_payment_method thành công: ${definition}`);
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật ràng buộc:', error);
  } finally {
    await pool.end();
  }
}

migrate();
