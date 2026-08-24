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
import {
  scrapeHotdealCategories,
  scrapeDealtodayCategories,
  scrapeListingCategory,
  scrapeVoucherDetail,
} from './extractor.js';
import { normalizeScrapedVoucher } from './normalizer.js';
import { saveVouchersToDatabase, exportToSqlSeed } from './database-seeder.js';
import type { NormalizedVoucherProgram, RawScrapedVoucher, ScrapedCategory } from './types.js';

async function main() {
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU TIẾN TRÌNH CÀO DỮ LIỆU VOUCHER & DANH MỤC ĐỘNG TỪ SÀN');
  console.log('===============================================================');

  // Phân tích tham số dòng lệnh
  const args = process.argv.slice(2);
  let limitPerCategory = 10;
  let totalLimit: number | null = null;
  let dryRun = false;
  let exportSql = true;
  let targetCategory: string | null = null;
  let targetSource: 'ALL' | 'HOTDEAL' | 'DEALTODAY' = 'HOTDEAL';

  let userSpecifiedLimit = false;

  for (const arg of args) {
    if (arg === '--all' || arg === '--unlimited') {
      limitPerCategory = Infinity;
      totalLimit = null;
      userSpecifiedLimit = true;
    } else if (arg.startsWith('--limit=')) {
      const val = parseInt(arg.split('=')[1], 10);
      limitPerCategory = val <= 0 ? Infinity : val;
      userSpecifiedLimit = true;
    } else if (arg.startsWith('--total=')) {
      const val = parseInt(arg.split('=')[1], 10);
      totalLimit = val <= 0 ? null : val;
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--export-sql') {
      exportSql = true;
    } else if (arg.startsWith('--category=')) {
      targetCategory = arg.split('=')[1];
    } else if (arg.startsWith('--source=')) {
      const s = arg.split('=')[1].toUpperCase();
      if (s === 'ALL' || s === 'HOTDEAL' || s === 'DEALTODAY') {
        targetSource = s as any;
      }
    }
  }

  // Khám phá danh mục trước để tự động phân bổ đều số lượng voucher nếu chỉ truyền --total
  let discoveredHotdealCats: ScrapedCategory[] = [];
  let discoveredDealtodayCats: ScrapedCategory[] = [];

  if (targetSource === 'ALL' || targetSource === 'HOTDEAL') {
    discoveredHotdealCats = await scrapeHotdealCategories();
    if (targetCategory) {
      discoveredHotdealCats = discoveredHotdealCats.filter((c) => c.slug === targetCategory);
    }
  }

  if (targetSource === 'ALL' || targetSource === 'DEALTODAY') {
    discoveredDealtodayCats = await scrapeDealtodayCategories();
    if (targetCategory) {
      discoveredDealtodayCats = discoveredDealtodayCats.filter((c) => c.slug === targetCategory);
    }
  }

  const totalActiveCats = discoveredHotdealCats.length + discoveredDealtodayCats.length;

  // Nếu chỉ truyền --total mà không truyền --limit, tự động chia đều để đảm bảo phủ kín tất cả danh mục
  if (totalLimit && !userSpecifiedLimit && totalActiveCats > 0) {
    limitPerCategory = Math.max(5, Math.ceil(totalLimit / totalActiveCats) + 3);
  }

  console.log(`[Config] Nguồn cào dữ liệu: ${targetSource}`);
  console.log(`[Config] Số lượng cào mỗi danh mục: ${limitPerCategory} (Tự động quét nhiều trang)`);
  if (totalLimit) {
    console.log(`[Config] Giới hạn tổng số voucher toàn hệ thống: ${totalLimit}`);
  }
  console.log(`[Config] Chế độ Dry Run: ${dryRun ? 'BẬT (Không ghi vào DB)' : 'TẮT (Ghi vào DB)'}`);
  console.log(`[Config] Xuất file SQL Seed: ${exportSql ? 'BẬT' : 'TẮT'}`);

  const rawVouchers: RawScrapedVoucher[] = [];

  // 1. Cào danh mục & voucher từ nguồn Hotdeal
  if (discoveredHotdealCats.length > 0) {
    console.log(`\n🔍 [Hotdeal] Đang cào ${discoveredHotdealCats.length} danh mục thực tế được khám phá...`);
    for (const cat of discoveredHotdealCats) {
      try {
        const items = await scrapeListingCategory(cat.slug, 0, cat.name, limitPerCategory, 'HOTDEAL');
        if (items.length > 0) {
          rawVouchers.push(...items);
        } else {
          console.log(`ℹ️ [Hotdeal] Danh mục "${cat.name}" không có voucher nào -> Tự động bỏ qua.`);
        }
      } catch (err: unknown) {
        console.warn(`[Hotdeal Warning] Không thể cào danh mục ${cat.name}:`, (err as any)?.message || err);
      }
    }
  }

  // 2. Cào danh mục & voucher từ nguồn Dealtoday
  if (discoveredDealtodayCats.length > 0) {
    console.log(`\n🔍 [Dealtoday] Đang cào ${discoveredDealtodayCats.length} danh mục thực tế được khám phá...`);
    for (const cat of discoveredDealtodayCats) {
      try {
        const items = await scrapeListingCategory(cat.slug, 0, cat.name, limitPerCategory, 'DEALTODAY');
        if (items.length > 0) {
          rawVouchers.push(...items);
        } else {
          console.log(`ℹ️ [Dealtoday] Danh mục "${cat.name}" không có voucher nào -> Tự động bỏ qua.`);
        }
      } catch (err: unknown) {
        console.warn(`[Dealtoday Warning] Không thể cào danh mục ${cat.name}:`, (err as any)?.message || err);
      }
    }
  }

  const itemsToProcess = totalLimit ? rawVouchers.slice(0, totalLimit) : rawVouchers;
  console.log(`\n📦 Đã tìm thấy ${rawVouchers.length} voucher sơ bộ. Bắt đầu cào chi tiết cho ${itemsToProcess.length} voucher...`);

  // Bước 2: Cào chi tiết từng voucher (điều kiện, chi nhánh, ảnh gallery, bài viết)
  const normalizedVouchers: NormalizedVoucherProgram[] = [];

  for (let i = 0; i < itemsToProcess.length; i++) {
    const raw = itemsToProcess[i];
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
