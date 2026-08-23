/**
 * @file fix-image-urls.ts
 * @description Sửa lại đường dẫn ảnh từ /800x800/ sang /500x500/ để khớp với chuẩn CDN của Hotdeal.
 */

import pool from '../config/db.js';

async function main() {
  console.log('🖼️  Bắt đầu chuẩn hóa URL ảnh trong database...');

  const imgRes = await pool.query(`
    UPDATE voucher_program_images
    SET image_url = REPLACE(image_url, '/800x800/', '/500x500/')
    WHERE image_url LIKE '%/800x800/%'
  `);
  console.log(`Đã cập nhật ${imgRes.rowCount} ảnh trong voucher_program_images.`);

  const partnerRes = await pool.query(`
    UPDATE partners
    SET brand_logo = REPLACE(brand_logo, '/800x800/', '/500x500/')
    WHERE brand_logo LIKE '%/800x800/%'
  `);
  console.log(`Đã cập nhật ${partnerRes.rowCount} logo trong partners.`);

  const bannerRes = await pool.query(`
    UPDATE banners
    SET image_url = REPLACE(image_url, '/800x800/', '/500x500/')
    WHERE image_url LIKE '%/800x800/%'
  `);
  console.log(`Đã cập nhật ${bannerRes.rowCount} ảnh trong banners.`);

  const popupRes = await pool.query(`
    UPDATE popups
    SET image_url = REPLACE(image_url, '/800x800/', '/500x500/')
    WHERE image_url LIKE '%/800x800/%'
  `);
  console.log(`Đã cập nhật ${popupRes.rowCount} ảnh trong popups.`);

  console.log('✨ Hoàn thành cập nhật URL ảnh!');
  await pool.end();
}

main().catch((err) => {
  console.error('Lỗi cập nhật ảnh:', err);
  process.exit(1);
});
