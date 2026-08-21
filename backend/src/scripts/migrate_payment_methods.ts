import pool from '../config/db.js';

async function migrate() {
  console.log('🔄 Đang cập nhật ràng buộc chk_orders_payment_method...');
  try {
    await pool.query(`
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_payment_method;
      ALTER TABLE orders ADD CONSTRAINT chk_orders_payment_method 
        CHECK (payment_method IN ('STRIPE', 'VNPAY', 'MOMO', 'PAYPAL', 'CREDIT_CARD', 'BANK_TRANSFER', 'CASH'));
    `);
    console.log('✅ Cập nhật ràng buộc chk_orders_payment_method thành công!');
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật ràng buộc:', error);
  } finally {
    await pool.end();
  }
}

migrate();
