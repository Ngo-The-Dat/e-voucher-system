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

// Danh sách danh mục cào trên Hotdeal ứng với category_id trong Database
const CATEGORIES = [
  // 1. Ẩm thực & Nhà hàng
  { slug: 'an-uong', id: 1, name: 'Ẩm thực & Nhà hàng' },
  { slug: 'buffet', id: 1, name: 'Ẩm thực - Buffet' },
  { slug: 'nha-hang-sang-trong', id: 1, name: 'Ẩm thực - Nhà Hàng Sang Trọng' },
  // 2. Làm đẹp & Spa
  { slug: 'spa-lam-dep', id: 2, name: 'Làm đẹp & Spa' },
  { slug: 'massage-cap-doi', id: 2, name: 'Làm đẹp - Massage' },
  { slug: 'cham-soc-da', id: 2, name: 'Làm đẹp - Chăm Sóc Da' },
  // 3. Du lịch & Khách sạn
  { slug: 'khach-san-da-lat', id: 3, name: 'Du lịch - Khách Sạn Đà Lạt' },
  { slug: 'khach-san-vung-tau', id: 3, name: 'Du lịch - Khách Sạn Vũng Tàu' },
  { slug: 'khach-san-phan-thiet', id: 3, name: 'Du lịch - Resort Phan Thiết' },
  { slug: 'khach-san-nha-trang', id: 3, name: 'Du lịch - Resort Nha Trang' },
  // 4. Giải trí & Sự kiện
  { slug: 'khu-vui-choi', id: 4, name: 'Giải trí - Khu Vui Chơi' },
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
