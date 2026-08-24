/**
 * @file verify-scraped-data.ts
 * @description Kiểm tra số lượng và tính toàn vẹn của dữ liệu vừa cào trong PostgreSQL Database.
 */

import pool from '../config/db.js';

async function verify() {
  console.log('===============================================================');
  console.log('🔍 KIỂM TRA DỮ LIỆU ĐÃ CÀO TRONG DATABASE');
  console.log('===============================================================');

  const programsRes = await pool.query(`
    SELECT vp.program_id, vp.program_name, vp.original_price, vp.sale_price, vp.discount_amount,
           c.category_name, p.business_name
    FROM voucher_programs vp
    JOIN categories c ON c.category_id = vp.category_id
    JOIN partners p ON p.user_id = vp.partner_id
    ORDER BY vp.program_id DESC
    LIMIT 10
  `);

  console.log(`\n📌 10 Voucher Programs mới nhất trong database:`);
  console.table(programsRes.rows);

  const statsRes = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM partners) as total_partners,
      (SELECT COUNT(*) FROM branches) as total_branches,
      (SELECT COUNT(*) FROM categories) as total_categories,
      (SELECT COUNT(*) FROM voucher_programs) as total_programs,
      (SELECT COUNT(*) FROM voucher_program_images) as total_images,
      (SELECT COUNT(*) FROM banners) as total_banners,
      (SELECT COUNT(*) FROM popups) as total_popups,
      (SELECT COUNT(*) FROM contents) as total_contents,
      (SELECT COUNT(*) FROM issued_vouchers) as total_issued_vouchers,
      (SELECT COUNT(*) FROM reviews_feedback) as total_reviews
  `);

  console.log(`\n📊 Thống kê tổng số lượng bản ghi các bảng liên quan:`);
  console.table(statsRes.rows);

  const sampleReviewsRes = await pool.query(`
    SELECT rf.review_id, rf.rating, rf.review_content, u.full_name as customer_name, vp.program_name
    FROM reviews_feedback rf
    JOIN users u ON u.user_id = rf.customer_id
    JOIN issued_vouchers iv ON iv.issued_voucher_id = rf.issued_voucher_id
    JOIN voucher_programs vp ON vp.program_id = iv.program_id
    ORDER BY rf.review_id DESC
    LIMIT 6
  `);

  console.log(`\n⭐ Mẫu 6 Đánh giá & Bình luận khách hàng mới nhất:`);
  console.table(sampleReviewsRes.rows);

  await pool.end();
}

verify().catch((err) => {
  console.error('Lỗi kiểm tra:', err);
  process.exit(1);
});
