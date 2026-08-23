/**
 * @file clean-contents.ts
 * @description Làm sạch toàn bộ nội dung HTML thô trong bảng contents của Database.
 */

import pool from '../config/db.js';
import { htmlToCleanText } from '../crawler/normalizer.js';

async function main() {
  console.log('🧹 Bắt đầu làm sạch nội dung trong bảng contents...');
  const res = await pool.query('SELECT content_id, title, body FROM contents');
  console.log(`Tìm thấy ${res.rows.length} bản ghi content.`);

  let updatedCount = 0;
  for (const row of res.rows) {
    const originalBody = row.body;
    // Làm sạch HTML và loại bỏ tiêu đề dư thừa ở đầu
    let cleanedBody = htmlToCleanText(originalBody)
      .replace(/^(Thông tin chi tiết|Điểm nổi bật|Điều kiện sử dụng)\s*/gi, '')
      .trim();

    if (cleanedBody !== originalBody) {
      await pool.query(
        'UPDATE contents SET body = $1, updated_at = NOW() WHERE content_id = $2',
        [cleanedBody, row.content_id]
      );
      updatedCount++;
    }
  }

  console.log(`✨ Đã làm sạch thành công ${updatedCount} bản ghi contents!`);
  await pool.end();
}

main().catch((err) => {
  console.error('Lỗi khi làm sạch contents:', err);
  process.exit(1);
});
