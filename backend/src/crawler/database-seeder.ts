/**
 * @file database-seeder.ts
 * @description Lưu trữ dữ liệu voucher, đối tác, chi nhánh, banners, popups, contents vào PostgreSQL Database hoặc xuất file SQL Seed.
 */

import fs from 'fs';
import path from 'path';
import pool from '../config/db.js';
import type { NormalizedVoucherProgram } from './types.js';

// Mật khẩu mặc định băm sẵn bằng bcrypt cho các tài khoản đối tác cào được (Mật khẩu: 12345876)
const DEFAULT_PASSWORD_HASH = '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW';

/**
 * Lưu danh sách voucher đã chuẩn hóa vào cơ sở dữ liệu PostgreSQL
 */
export async function saveVouchersToDatabase(vouchers: NormalizedVoucherProgram[]): Promise<{
  partnersCount: number;
  programsCount: number;
  branchesCount: number;
  bannersCount: number;
  popupsCount: number;
  contentsCount: number;
  reviewsCount: number;
}> {
  const client = await pool.connect();
  let partnersCount = 0;
  let programsCount = 0;
  let branchesCount = 0;
  let bannersCount = 0;
  let popupsCount = 0;
  let contentsCount = 0;
  let reviewsCount = 0;

  try {
    // Đảm bảo Identity Sequences luôn đồng bộ trước khi ghi dữ liệu
    await client.query(`
      SELECT setval(pg_get_serial_sequence('users', 'user_id'), COALESCE((SELECT MAX(user_id) FROM users), 1));
      SELECT setval(pg_get_serial_sequence('categories', 'category_id'), COALESCE((SELECT MAX(category_id) FROM categories), 1));
      SELECT setval(pg_get_serial_sequence('branches', 'branch_id'), COALESCE((SELECT MAX(branch_id) FROM branches), 1));
      SELECT setval(pg_get_serial_sequence('partner_approval_requests', 'approval_request_id'), COALESCE((SELECT MAX(approval_request_id) FROM partner_approval_requests), 1));
      SELECT setval(pg_get_serial_sequence('voucher_programs', 'program_id'), COALESCE((SELECT MAX(program_id) FROM voucher_programs), 1));
      SELECT setval(pg_get_serial_sequence('voucher_program_images', 'image_id'), COALESCE((SELECT MAX(image_id) FROM voucher_program_images), 1));
      SELECT setval(pg_get_serial_sequence('voucher_approval_requests', 'approval_request_id'), COALESCE((SELECT MAX(approval_request_id) FROM voucher_approval_requests), 1));
      SELECT setval(pg_get_serial_sequence('banners', 'banner_id'), COALESCE((SELECT MAX(banner_id) FROM banners), 1));
      SELECT setval(pg_get_serial_sequence('popups', 'popup_id'), COALESCE((SELECT MAX(popup_id) FROM popups), 1));
      SELECT setval(pg_get_serial_sequence('contents', 'content_id'), COALESCE((SELECT MAX(content_id) FROM contents), 1));
      SELECT setval(pg_get_serial_sequence('issued_vouchers', 'issued_voucher_id'), COALESCE((SELECT MAX(issued_voucher_id) FROM issued_vouchers), 1));
      SELECT setval(pg_get_serial_sequence('reviews_feedback', 'review_id'), COALESCE((SELECT MAX(review_id) FROM reviews_feedback), 1));
    `);

    await client.query('BEGIN');

    for (const v of vouchers) {
      // 1. Kiểm tra hoặc tạo User & Partner
      let partnerUserId: number;
      const existingUserRes = await client.query(
        `SELECT u.user_id, p.user_id as partner_id FROM users u 
         LEFT JOIN partners p ON p.user_id = u.user_id 
         WHERE u.email = $1 OR u.phone = $2 OR p.tax_code = $3 OR p.business_name = $4
         LIMIT 1`,
        [v.partner.email, v.partner.phone, v.partner.tax_code, v.partner.business_name]
      );

      if (existingUserRes.rows.length > 0) {
        partnerUserId = Number(existingUserRes.rows[0].user_id);
        // Nếu user tồn tại nhưng chưa có bản ghi partner
        if (!existingUserRes.rows[0].partner_id) {
          await client.query(
            `INSERT INTO partners (user_id, business_name, tax_code, activity_status, brand_logo, representative_title)
             VALUES ($1, $2, $3, 'ACTIVE', $4, $5)
             ON CONFLICT (user_id) DO NOTHING`,
            [
              partnerUserId,
              v.partner.business_name,
              v.partner.tax_code,
              v.partner.brand_logo,
              v.partner.representative_title,
            ]
          );
        }
      } else {
        const userInsertRes = await client.query(
          `INSERT INTO users (full_name, email, phone, password_hash, role, status)
           VALUES ($1, $2, $3, $4, 'PARTNER', 'ACTIVE')
           RETURNING user_id`,
          [v.partner.business_name.slice(0, 150), v.partner.email.slice(0, 255), v.partner.phone.slice(0, 20), DEFAULT_PASSWORD_HASH]
        );
        partnerUserId = Number(userInsertRes.rows[0].user_id);

        await client.query(
          `INSERT INTO partners (user_id, business_name, tax_code, activity_status, brand_logo, representative_title)
           VALUES ($1, $2, $3, 'ACTIVE', $4, $5)
           ON CONFLICT (user_id) DO NOTHING`,
          [
            partnerUserId,
            v.partner.business_name.slice(0, 255),
            v.partner.tax_code.slice(0, 50),
            v.partner.brand_logo.slice(0, 1000),
            v.partner.representative_title.slice(0, 100),
          ]
        );

        await client.query(
          `INSERT INTO partner_approval_requests (partner_id, admin_id, approval_status, admin_feedback)
           VALUES ($1, 1, 'APPROVED', 'Tự động duyệt đối tác từ crawler')`,
          [partnerUserId]
        );
        partnersCount++;
      }

      // 2. Kiểm tra hoặc tạo các Branches
      const branchIds: number[] = [];
      for (const b of v.branches) {
        let branchId: number;
        const existingBranchRes = await client.query(
          `SELECT branch_id FROM branches WHERE partner_id = $1 AND branch_name = $2 LIMIT 1`,
          [partnerUserId, b.branch_name]
        );

        if (existingBranchRes.rows.length > 0) {
          branchId = Number(existingBranchRes.rows[0].branch_id);
        } else {
          const branchInsertRes = await client.query(
            `INSERT INTO branches (partner_id, branch_name, address, region, phone, status)
             VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
             RETURNING branch_id`,
            [partnerUserId, b.branch_name, b.address, b.region, b.phone]
          );
          branchId = Number(branchInsertRes.rows[0].branch_id);
          branchesCount++;
        }
        branchIds.push(branchId);
      }

      // 3. Kiểm tra hoặc tạo Category động từ dữ liệu cào
      let categoryId: number;
      const catName = v.category_name || 'Khác';
      const catDesc = v.category_description || `Voucher ưu đãi ngành hàng ${catName}`;
      const existingCatRes = await client.query(
        `SELECT category_id FROM categories WHERE category_name = $1 LIMIT 1`,
        [catName]
      );
      if (existingCatRes.rows.length > 0) {
        categoryId = Number(existingCatRes.rows[0].category_id);
      } else {
        const catInsertRes = await client.query(
          `INSERT INTO categories (category_name, description, status)
           VALUES ($1, $2, 'ACTIVE')
           RETURNING category_id`,
          [catName, catDesc]
        );
        categoryId = Number(catInsertRes.rows[0].category_id);
      }

      // 4. Tạo voucher_programs
      const programInsertRes = await client.query(
        `INSERT INTO voucher_programs (
           partner_id, category_id, program_name, original_price, sale_price,
           issue_quantity, sale_start_at, sale_end_at, use_start_at, use_end_at, display_status
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING program_id`,
        [
          partnerUserId,
          categoryId,
          v.program_name.slice(0, 255),
          v.original_price,
          v.sale_price,
          v.issue_quantity,
          v.sale_start_at,
          v.sale_end_at,
          v.use_start_at,
          v.use_end_at,
          v.display_status,
        ]
      );
      const programId = Number(programInsertRes.rows[0].program_id);
      programsCount++;

      // 4. Gán chi nhánh (voucher_program_branches)
      for (const bId of branchIds) {
        await client.query(
          `INSERT INTO voucher_program_branches (program_id, branch_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [programId, bId]
        );
      }

      // 5. Thêm ảnh (voucher_program_images)
      for (const img of v.images) {
        await client.query(
          `INSERT INTO voucher_program_images (program_id, image_url, is_primary, sort_order)
           VALUES ($1, $2, $3, $4)`,
          [programId, img.image_url, img.is_primary, img.sort_order]
        );
      }

      // 6. Tự động duyệt voucher (voucher_approval_requests)
      await client.query(
        `INSERT INTO voucher_approval_requests (program_id, admin_id, approval_status, admin_feedback)
         VALUES ($1, 1, 'APPROVED', 'Chương trình voucher được phê duyệt tự động từ crawler')`,
        [programId]
      );

      // 7. Thêm Banner quảng cáo (banners)
      if (v.banner) {
        await client.query(
          `INSERT INTO banners (program_id, title, image_url, target_url, display_position, display_from, display_to, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            programId,
            v.banner.title,
            v.banner.image_url,
            `/vouchers/${programId}`,
            v.banner.display_position,
            v.banner.display_from,
            v.banner.display_to,
            v.banner.status,
          ]
        );
        bannersCount++;
      }

      // 8. Thêm Popup khuyến mãi (popups)
      if (v.popup) {
        await client.query(
          `INSERT INTO popups (program_id, title, content, target_url, image_url, start_at, end_at, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            programId,
            v.popup.title,
            v.popup.content,
            `/vouchers/${programId}`,
            v.popup.image_url,
            v.popup.start_at,
            v.popup.end_at,
            v.popup.status,
          ]
        );
        popupsCount++;
      }

      // 9. Thêm Contents (POLICY, ARTICLE, PROMOTION, GUIDE)
      for (const c of v.contents) {
        await client.query(
          `INSERT INTO contents (program_id, title, body, content_type, status)
           VALUES ($1, $2, $3, $4, $5)`,
          [programId, c.title, c.body, c.content_type, c.status]
        );
        contentsCount++;
      }

      // 10. Thêm Bình luận & Đánh giá khách hàng (Reviews & Feedback)
      if (v.reviews && v.reviews.length > 0) {
        for (const r of v.reviews) {
          // 10.1 Tạo hoặc lấy khách hàng
          const custRes = await client.query(
            `INSERT INTO users (full_name, email, phone, password_hash, role, status)
             VALUES ($1, $2, $3, $4, 'CUSTOMER', 'ACTIVE')
             ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
             RETURNING user_id`,
            [r.customer_name.slice(0, 150), r.customer_email.slice(0, 255), '09' + Math.floor(10000000 + Math.random() * 90000000), DEFAULT_PASSWORD_HASH]
          );
          const custId = Number(custRes.rows[0].user_id);
          const vCode = `VCH-${programId}-${custId}-${Math.floor(100000 + Math.random() * 900000)}`;
          const discountAmt = Math.max(0, v.original_price - v.sale_price);

          // 10.2 Tạo đơn hàng (orders)
          const orderRes = await client.query(
            `INSERT INTO orders (buyer_user_id, total_amount, payment_method, payment_status, order_status, created_at)
             VALUES ($1, $2, 'MOMO', 'PAID', 'COMPLETED', $3)
             RETURNING order_id`,
            [custId, v.sale_price, r.submitted_at]
          );
          const orderId = Number(orderRes.rows[0].order_id);

          // 10.3 Tạo chi tiết đơn hàng (order_items)
          const orderItemRes = await client.query(
            `INSERT INTO order_items (order_id, program_id, quantity, unit_price)
             VALUES ($1, $2, 1, $3)
             RETURNING order_item_id`,
            [orderId, programId, v.sale_price]
          );
          const orderItemId = Number(orderItemRes.rows[0].order_item_id);

          // 10.4 Tạo voucher phát hành đã sử dụng (issued_vouchers)
          const voucherRes = await client.query(
            `INSERT INTO issued_vouchers (program_id, order_item_id, owner_user_id, voucher_code, qr_code, usage_status, issued_at, expires_at, applicable_region, used_at, discount_amount)
             VALUES ($1, $2, $3, $4, $5, 'USED', $6, $7, 'Toàn quốc', $8, $9)
             RETURNING issued_voucher_id`,
            [programId, orderItemId, custId, vCode, `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${vCode}`, r.submitted_at, v.use_end_at, r.submitted_at, discountAmt]
          );
          const issuedVoucherId = Number(voucherRes.rows[0].issued_voucher_id);

          // 10.5 Tạo đánh giá phản hồi (reviews_feedback)
          await client.query(
            `INSERT INTO reviews_feedback (issued_voucher_id, customer_id, rating, review_content, submitted_at)
             VALUES ($1, $2, $3, $4, $5)`,
            [issuedVoucherId, custId, r.rating, r.review_content, r.submitted_at]
          );
          reviewsCount++;
        }
      }
    }

    // Tự động loại bỏ toàn bộ danh mục không có bất kỳ voucher nào (Empty Categories)
    await client.query(`
      DELETE FROM categories 
      WHERE category_id NOT IN (SELECT DISTINCT category_id FROM voucher_programs);
    `);

    await client.query('COMMIT');
    console.log(`[Crawler DB] Ghi nhận thành công vào Database PostgreSQL:`);
    console.log(` - Đối tác mới: ${partnersCount}`);
    console.log(` - Chi nhánh mới: ${branchesCount}`);
    console.log(` - Chương trình Voucher: ${programsCount}`);
    console.log(` - Banners: ${bannersCount}`);
    console.log(` - Popups: ${popupsCount}`);
    console.log(` - Contents (Chính sách & Bài viết): ${contentsCount}`);
    console.log(` - Đánh giá & Bình luận (Reviews): ${reviewsCount}`);

    return {
      partnersCount,
      programsCount,
      branchesCount,
      bannersCount,
      popupsCount,
      contentsCount,
      reviewsCount,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Crawler DB Error] Đã rollback transaction do lỗi:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Xuất dữ liệu đã cào ra file SQL Seed
 */
export function exportToSqlSeed(vouchers: NormalizedVoucherProgram[], outputPath: string): string {
  const lines: string[] = [
    '-- =========================================================================',
    '-- SCRAPED REAL VOUCHER DATA SEED SCRIPT (PostgreSQL)',
    '-- Auto-generated by E-Voucher Crawler Engine',
    `-- Date: ${new Date().toISOString()}`,
    '-- =========================================================================\n',
  ];

  let userCounter = 100;
  let branchCounter = 100;
  let programCounter = 100;
  let bannerCounter = 100;
  let popupCounter = 100;
  let contentCounter = 100;
  let orderCounter = 100;
  let orderItemCounter = 100;
  let issuedVoucherCounter = 100;
  let reviewCounter = 100;
  let categoryCounter = 0;

  const partnerMap = new Map<string, number>();
  const branchMap = new Map<string, number>();
  const categoryMap = new Map<string, number>();

  const escapeSql = (str: string) => str.replace(/'/g, "''");

  // 0. Xuất toàn bộ danh mục cào thực tế (Dynamic Scraped Categories)
  lines.push('-- =========================================================================');
  lines.push('-- DANH MỤC CÀO ĐỘNG THỰC TẾ TỪ CÁC SÀN');
  lines.push('-- =========================================================================');
  for (const v of vouchers) {
    const catName = v.category_name || 'Khác';
    if (!categoryMap.has(catName)) {
      const catId = ++categoryCounter;
      categoryMap.set(catName, catId);
      const catDesc = v.category_description || `Voucher ưu đãi ngành hàng ${catName}`;
      lines.push(`INSERT INTO categories (category_id, category_name, description, status) VALUES (${catId}, '${escapeSql(catName)}', '${escapeSql(catDesc)}', 'ACTIVE') ON CONFLICT (category_name) DO NOTHING;`);
    }
  }
  lines.push('\n');

  for (const v of vouchers) {
    const currentProgramId = ++programCounter;
    const currentBannerId = ++bannerCounter;
    const currentPopupId = ++popupCounter;
    const currentCategoryId = categoryMap.get(v.category_name || 'Khác') || 1;

    // 1. User & Partner (Tái sử dụng nếu đối tác đã được ghi nhận trước đó)
    let currentUserId: number;
    if (partnerMap.has(v.partner.tax_code)) {
      currentUserId = partnerMap.get(v.partner.tax_code)!;
    } else {
      currentUserId = ++userCounter;
      partnerMap.set(v.partner.tax_code, currentUserId);
      lines.push(`-- Partner: ${escapeSql(v.partner.business_name)}`);
      lines.push(`INSERT INTO users (user_id, full_name, email, phone, password_hash, role, status) VALUES (${currentUserId}, '${escapeSql(v.partner.business_name.slice(0, 150))}', '${escapeSql(v.partner.email.slice(0, 255))}', '${v.partner.phone.slice(0, 20)}', '${DEFAULT_PASSWORD_HASH}', 'PARTNER', 'ACTIVE') ON CONFLICT (email) DO NOTHING;`);
      lines.push(`INSERT INTO partners (user_id, business_name, tax_code, activity_status, brand_logo, representative_title) VALUES (${currentUserId}, '${escapeSql(v.partner.business_name.slice(0, 255))}', '${v.partner.tax_code.slice(0, 50)}', 'ACTIVE', '${escapeSql(v.partner.brand_logo.slice(0, 500))}', 'Giám đốc') ON CONFLICT (tax_code) DO NOTHING;`);
      lines.push(`INSERT INTO partner_approval_requests (partner_id, admin_id, approval_status, admin_feedback) VALUES (${currentUserId}, 1, 'APPROVED', 'Duyệt tự động');`);
    }

    // 2. Branches (Tái sử dụng nếu chi nhánh đã tồn tại, xuất toàn bộ các chi nhánh cào được)
    const currentBranchIds: number[] = [];
    for (const b of v.branches) {
      const branchKey = `${currentUserId}:${b.branch_name}`;
      let currentBranchId: number;
      if (branchMap.has(branchKey)) {
        currentBranchId = branchMap.get(branchKey)!;
      } else {
        currentBranchId = ++branchCounter;
        branchMap.set(branchKey, currentBranchId);
        lines.push(`INSERT INTO branches (branch_id, partner_id, branch_name, address, region, phone, status) VALUES (${currentBranchId}, ${currentUserId}, '${escapeSql(b.branch_name.slice(0, 255))}', '${escapeSql(b.address.slice(0, 500))}', '${b.region.slice(0, 150)}', '${b.phone.slice(0, 20)}', 'ACTIVE');`);
      }
      currentBranchIds.push(currentBranchId);
    }

    // 3. Voucher Program
    lines.push(`INSERT INTO voucher_programs (program_id, partner_id, category_id, program_name, original_price, sale_price, issue_quantity, sale_start_at, sale_end_at, use_start_at, use_end_at, display_status) VALUES (${currentProgramId}, ${currentUserId}, ${currentCategoryId}, '${escapeSql(v.program_name.slice(0, 255))}', ${v.original_price}, ${v.sale_price}, ${v.issue_quantity}, '${v.sale_start_at.toISOString()}', '${v.sale_end_at.toISOString()}', '${v.use_start_at.toISOString()}', '${v.use_end_at.toISOString()}', '${v.display_status}');`);
    for (const bId of currentBranchIds) {
      lines.push(`INSERT INTO voucher_program_branches (program_id, branch_id) VALUES (${currentProgramId}, ${bId});`);
    }

    // 4. Images
    for (const img of v.images) {
      lines.push(`INSERT INTO voucher_program_images (program_id, image_url, is_primary, sort_order) VALUES (${currentProgramId}, '${escapeSql(img.image_url.slice(0, 1000))}', ${img.is_primary}, ${img.sort_order});`);
    }

    // 5. Approval Request
    lines.push(`INSERT INTO voucher_approval_requests (program_id, admin_id, approval_status, admin_feedback) VALUES (${currentProgramId}, 1, 'APPROVED', 'Duyệt tự động');`);

    // 6. Banner
    if (v.banner) {
      lines.push(`INSERT INTO banners (banner_id, program_id, title, image_url, target_url, display_position, display_from, display_to, status) VALUES (${currentBannerId}, ${currentProgramId}, '${escapeSql(v.banner.title.slice(0, 255))}', '${escapeSql(v.banner.image_url.slice(0, 1000))}', '/vouchers/${currentProgramId}', '${v.banner.display_position.slice(0, 100)}', '${v.banner.display_from.toISOString()}', '${v.banner.display_to.toISOString()}', 'ACTIVE');`);
    }

    // 7. Popup
    if (v.popup) {
      lines.push(`INSERT INTO popups (popup_id, program_id, title, content, target_url, image_url, start_at, end_at, status) VALUES (${currentPopupId}, ${currentProgramId}, '${escapeSql(v.popup.title.slice(0, 255))}', '${escapeSql(v.popup.content)}', '/vouchers/${currentProgramId}', '${escapeSql(v.popup.image_url.slice(0, 1000))}', '${v.popup.start_at.toISOString()}', '${v.popup.end_at.toISOString()}', 'ACTIVE');`);
    }

    // 8. Contents
    for (const c of v.contents) {
      const currentContentId = ++contentCounter;
      lines.push(`INSERT INTO contents (content_id, program_id, title, body, content_type, status) VALUES (${currentContentId}, ${currentProgramId}, '${escapeSql(c.title.slice(0, 255))}', $BODY$${c.body}$BODY$, '${c.content_type}', 'ACTIVE');`);
    }

    // 9. Reviews & Feedback
    if (v.reviews && v.reviews.length > 0) {
      for (const r of v.reviews) {
        const currentCustId = ++userCounter;
        const currentOrderId = ++orderCounter;
        const currentOrderItemId = ++orderItemCounter;
        const currentIssuedId = ++issuedVoucherCounter;
        const currentReviewId = ++reviewCounter;
        const vCode = `VCH-${currentProgramId}-${currentCustId}-${Math.floor(100000 + Math.random() * 900000)}`;
        const discountAmt = Math.max(0, v.original_price - v.sale_price);

        lines.push(`INSERT INTO users (user_id, full_name, email, phone, password_hash, role, status) VALUES (${currentCustId}, '${escapeSql(r.customer_name.slice(0, 150))}', '${escapeSql(r.customer_email.slice(0, 255))}', '09${Math.floor(10000000 + Math.random() * 90000000)}', '${DEFAULT_PASSWORD_HASH}', 'CUSTOMER', 'ACTIVE') ON CONFLICT (email) DO NOTHING;`);
        lines.push(`INSERT INTO orders (order_id, buyer_user_id, total_amount, payment_method, payment_status, order_status, created_at) VALUES (${currentOrderId}, (SELECT user_id FROM users WHERE email = '${escapeSql(r.customer_email.slice(0, 255))}'), ${v.sale_price}, 'MOMO', 'PAID', 'COMPLETED', '${r.submitted_at.toISOString()}');`);
        lines.push(`INSERT INTO order_items (order_item_id, order_id, program_id, quantity, unit_price) VALUES (${currentOrderItemId}, ${currentOrderId}, ${currentProgramId}, 1, ${v.sale_price});`);
        lines.push(`INSERT INTO issued_vouchers (issued_voucher_id, program_id, order_item_id, owner_user_id, voucher_code, qr_code, usage_status, issued_at, expires_at, applicable_region, used_at, discount_amount) VALUES (${currentIssuedId}, ${currentProgramId}, ${currentOrderItemId}, (SELECT user_id FROM users WHERE email = '${escapeSql(r.customer_email.slice(0, 255))}'), '${vCode}', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${vCode}', 'USED', '${r.submitted_at.toISOString()}', '${v.use_end_at.toISOString()}', 'Toàn quốc', '${r.submitted_at.toISOString()}', ${discountAmt});`);
        lines.push(`INSERT INTO reviews_feedback (review_id, issued_voucher_id, customer_id, rating, review_content, submitted_at) VALUES (${currentReviewId}, ${currentIssuedId}, (SELECT user_id FROM users WHERE email = '${escapeSql(r.customer_email.slice(0, 255))}'), ${r.rating}, '${escapeSql(r.review_content)}', '${r.submitted_at.toISOString()}');`);
      }
    }

    lines.push('\n');
  }

  lines.push('-- =========================================================================');
  lines.push('-- ĐỒNG BỘ IDENTITY SEQUENCES CỦA POSTGRESQL');
  lines.push('-- =========================================================================');
  lines.push("SELECT setval(pg_get_serial_sequence('users', 'user_id'), COALESCE((SELECT MAX(user_id) FROM users), 1));");
  lines.push("SELECT setval(pg_get_serial_sequence('categories', 'category_id'), COALESCE((SELECT MAX(category_id) FROM categories), 1));");
  lines.push("SELECT setval(pg_get_serial_sequence('branches', 'branch_id'), COALESCE((SELECT MAX(branch_id) FROM branches), 1));");
  lines.push("SELECT setval(pg_get_serial_sequence('partner_approval_requests', 'approval_request_id'), COALESCE((SELECT MAX(approval_request_id) FROM partner_approval_requests), 1));");
  lines.push("SELECT setval(pg_get_serial_sequence('voucher_programs', 'program_id'), COALESCE((SELECT MAX(program_id) FROM voucher_programs), 1));");
  lines.push("SELECT setval(pg_get_serial_sequence('voucher_program_images', 'image_id'), COALESCE((SELECT MAX(image_id) FROM voucher_program_images), 1));");
  lines.push("SELECT setval(pg_get_serial_sequence('voucher_approval_requests', 'approval_request_id'), COALESCE((SELECT MAX(approval_request_id) FROM voucher_approval_requests), 1));");
  lines.push("SELECT setval(pg_get_serial_sequence('banners', 'banner_id'), COALESCE((SELECT MAX(banner_id) FROM banners), 1));");
  lines.push("SELECT setval(pg_get_serial_sequence('popups', 'popup_id'), COALESCE((SELECT MAX(popup_id) FROM popups), 1));");
  lines.push("SELECT setval(pg_get_serial_sequence('contents', 'content_id'), COALESCE((SELECT MAX(content_id) FROM contents), 1));");
  lines.push("SELECT setval(pg_get_serial_sequence('orders', 'order_id'), COALESCE((SELECT MAX(order_id) FROM orders), 1));");
  lines.push("SELECT setval(pg_get_serial_sequence('order_items', 'order_item_id'), COALESCE((SELECT MAX(order_item_id) FROM order_items), 1));");
  lines.push("SELECT setval(pg_get_serial_sequence('issued_vouchers', 'issued_voucher_id'), COALESCE((SELECT MAX(issued_voucher_id) FROM issued_vouchers), 1));");
  lines.push("SELECT setval(pg_get_serial_sequence('reviews_feedback', 'review_id'), COALESCE((SELECT MAX(review_id) FROM reviews_feedback), 1));\n");

  const sqlContent = lines.join('\n');
  const fullPath = path.resolve(outputPath);
  fs.writeFileSync(fullPath, sqlContent, 'utf-8');
  console.log(`[Crawler SQL Export] Đã xuất file SQL Seed thành công: ${fullPath}`);
  return fullPath;
}
