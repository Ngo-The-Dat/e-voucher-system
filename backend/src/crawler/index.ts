/**
 * @file index.ts
 * @description Điểm khởi chạy (CLI Entrypoint) của hệ thống cào dữ liệu E-Voucher.
 *
 * Cách chạy:
 *   npx tsx src/crawler/index.ts
 *   npx tsx src/crawler/index.ts --limit=5 --export-sql
 *   npx tsx src/crawler/index.ts --dry-run
 */

import path from 'path';
import { scrapeListingCategory, scrapeVoucherDetail } from './extractor.js';
import { normalizeScrapedVoucher } from './normalizer.js';
import { saveVouchersToDatabase, exportToSqlSeed } from './database-seeder.js';
import type { NormalizedVoucherProgram, RawScrapedVoucher } from './types.js';

// Danh sách danh mục cào trên Hotdeal ứng với 12 category_id trong Database
const CATEGORIES = [
  // 1. Ẩm thực & Nhà hàng
  { slug: 'an-uong', id: 1, name: 'Ẩm thực & Nhà hàng' },
  { slug: 'nha-hang-sang-trong', id: 1, name: 'Ẩm thực - Nhà Hàng Sang Trọng' },
  // 2. Buffet Thượng Hạng
  { slug: 'buffet-am-thuc', id: 2, name: 'Buffet Thượng Hạng' },
  { slug: 'buffet', id: 2, name: 'Buffet' },
  // 3. Ẩm thực Chay
  { slug: 'buffet-chay', id: 3, name: 'Ẩm thực Chay' },
  // 4. Spa & Làm đẹp
  { slug: 'spa-lam-dep', id: 4, name: 'Spa & Làm đẹp' },
  { slug: 'cham-soc-da', id: 4, name: 'Chăm Sóc Da & Trẻ Hóa' },
  // 5. Massage & Trị liệu
  { slug: 'massage-body-massage-foot', id: 5, name: 'Massage Nam Nữ & Trị Liệu' },
  { slug: 'massage-cap-doi', id: 5, name: 'Massage Cặp Đôi' },
  // 6. Chăm sóc Tóc & Nail
  { slug: 'hair-salon-va-cham-soc-toc', id: 6, name: 'Chăm Sóc Tóc & Salon' },
  { slug: 'cat-toc-goi-dau-massage', id: 6, name: 'Cắt Tóc & Gội Đầu Dưỡng Sinh' },
  // 7. Nha khoa Thẩm mỹ
  { slug: 'nha-khoa', id: 7, name: 'Nha Khoa Thẩm Mỹ' },
  // 8. Khách sạn & Resort
  { slug: 'hotel-resort', id: 8, name: 'Khách Sạn & Resort' },
  { slug: 'khach-san-da-lat', id: 8, name: 'Khách Sạn Đà Lạt' },
  { slug: 'khach-san-vung-tau', id: 8, name: 'Khách Sạn Vũng Tàu' },
  { slug: 'khach-san-nha-trang', id: 8, name: 'Resort Nha Trang' },
  // 9. Tour Du lịch
  { slug: 'du-lich', id: 9, name: 'Tour Du Lịch' },
  // 10. Khu Vui Chơi & Giải Trí
  { slug: 'khu-vui-choi', id: 10, name: 'Khu Vui Chơi & Giải Trí' },
  // 11. Thể thao & Gym / Yoga
  { slug: 'phong-tap-gym-vn', id: 11, name: 'Thể Thao & Phòng Tập Gym' },
  { slug: 'yoga', id: 11, name: 'Tập Yoga & Thiền' },
  // 12. Khóa học & Đào tạo
  { slug: 'dao-tao-vn', id: 12, name: 'Khóa Học & Đào Tạo' },
];

async function main() {
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU TIẾN TRÌNH CÀO DỮ LIỆU VOUCHER THỰC TẾ');
  console.log('===============================================================');

  // Phân tích tham số dòng lệnh
  const args = process.argv.slice(2);
  let limitPerCategory = 4; // Mặc định 4 voucher mỗi danh mục = 16 voucher hoàn chỉnh
  let dryRun = false;
  let exportSql = true;
  let targetCategory: string | null = null;

  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      limitPerCategory = parseInt(arg.split('=')[1], 10) || 4;
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--export-sql') {
      exportSql = true;
    } else if (arg.startsWith('--category=')) {
      targetCategory = arg.split('=')[1];
    }
  }

  console.log(`[Config] Số lượng cào mỗi danh mục: ${limitPerCategory}`);
  console.log(`[Config] Chế độ Dry Run: ${dryRun ? 'BẬT (Không ghi vào DB)' : 'TẮT (Ghi vào DB)'}`);
  console.log(`[Config] Xuất file SQL Seed: ${exportSql ? 'BẬT' : 'TẮT'}`);

  const activeCategories = targetCategory
    ? CATEGORIES.filter((c) => c.slug === targetCategory)
    : CATEGORIES;

  const rawVouchers: RawScrapedVoucher[] = [];

  // Bước 1: Cào danh sách sơ bộ theo từng danh mục
  for (const cat of activeCategories) {
    try {
      const items = await scrapeListingCategory(cat.slug, cat.id, cat.name, limitPerCategory);
      rawVouchers.push(...items);
    } catch (err: unknown) {
      console.error(`[Error] Lỗi cào danh mục ${cat.name}:`, err);
    }
  }

  console.log(`\n📦 Tổng cộng đã tìm thấy ${rawVouchers.length} voucher sơ bộ. Bắt đầu cào chi tiết...`);

  // Bước 2: Cào chi tiết từng voucher (điều kiện, chi nhánh, ảnh gallery, bài viết)
  const normalizedVouchers: NormalizedVoucherProgram[] = [];

  for (let i = 0; i < rawVouchers.length; i++) {
    const raw = rawVouchers[i];
    await scrapeVoucherDetail(raw);
    const normalized = normalizeScrapedVoucher(raw, i);
    normalizedVouchers.push(normalized);
    // Delay nhỏ giữa các request để tránh rate-limit
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  console.log(`\n✨ Đã hoàn thành chuẩn hóa ${normalizedVouchers.length} chương trình voucher!`);

  // Bước 3: Xuất file SQL Seed nếu được bật
  if (exportSql) {
    const defaultSqlPath = path.join(process.cwd(), '../database/seeds/scraped_vouchers.sql');
    exportToSqlSeed(normalizedVouchers, defaultSqlPath);
  }

  // Bước 4: Lưu vào PostgreSQL Database nếu không phải chế độ Dry Run
  if (!dryRun) {
    console.log('\n📥 Bắt đầu nạp dữ liệu vào cơ sở dữ liệu PostgreSQL...');
    const result = await saveVouchersToDatabase(normalizedVouchers);
    console.log('\n===============================================================');
    console.log('🎉 CÀO VÀ NẠP DỮ LIỆU THÀNH CÔNG!');
    console.log(` - Voucher Programs: ${result.programsCount}`);
    console.log(` - Partners: ${result.partnersCount}`);
    console.log(` - Branches: ${result.branchesCount}`);
    console.log(` - Banners: ${result.bannersCount}`);
    console.log(` - Popups: ${result.popupsCount}`);
    console.log(` - Contents (Chính sách & Bài viết): ${result.contentsCount}`);
    console.log('===============================================================');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Lỗi tiến trình Crawler:', err);
  process.exit(1);
});
