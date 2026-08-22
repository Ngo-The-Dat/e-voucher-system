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
}> {
  const client = await pool.connect();
  let partnersCount = 0;
  let programsCount = 0;
  let branchesCount = 0;
  let bannersCount = 0;
  let popupsCount = 0;
  let contentsCount = 0;

  try {
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
          [v.partner.business_name, v.partner.email, v.partner.phone, DEFAULT_PASSWORD_HASH]
        );
        partnerUserId = Number(userInsertRes.rows[0].user_id);

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

      // 3. Tạo voucher_programs
      const programInsertRes = await client.query(
        `INSERT INTO voucher_programs (
           partner_id, category_id, program_name, original_price, sale_price,
           issue_quantity, sale_start_at, sale_end_at, use_start_at, use_end_at, display_status
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING program_id`,
        [
          partnerUserId,
          v.category_id,
          v.program_name,
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
    }

    await client.query('COMMIT');
    console.log(`[Crawler DB] Ghi nhận thành công vào Database PostgreSQL:`);
    console.log(` - Đối tác mới: ${partnersCount}`);
    console.log(` - Chi nhánh mới: ${branchesCount}`);
    console.log(` - Chương trình Voucher: ${programsCount}`);
    console.log(` - Banners: ${bannersCount}`);
    console.log(` - Popups: ${popupsCount}`);
    console.log(` - Contents (Chính sách & Bài viết): ${contentsCount}`);

    return {
      partnersCount,
      programsCount,
      branchesCount,
      bannersCount,
      popupsCount,
      contentsCount,
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

  for (const v of vouchers) {
    const currentUserId = ++userCounter;
    const currentBranchId = ++branchCounter;
    const currentProgramId = ++programCounter;
    const currentBannerId = ++bannerCounter;
    const currentPopupId = ++popupCounter;

    const escapeSql = (str: string) => str.replace(/'/g, "''");

    // 1. User & Partner
    lines.push(`-- Partner: ${escapeSql(v.partner.business_name)}`);
    lines.push(`INSERT INTO users (user_id, full_name, email, phone, password_hash, role, status) VALUES (${currentUserId}, '${escapeSql(v.partner.business_name)}', '${escapeSql(v.partner.email)}', '${v.partner.phone}', '${DEFAULT_PASSWORD_HASH}', 'PARTNER', 'ACTIVE') ON CONFLICT (email) DO NOTHING;`);
    lines.push(`INSERT INTO partners (user_id, business_name, tax_code, activity_status, brand_logo, representative_title) VALUES (${currentUserId}, '${escapeSql(v.partner.business_name)}', '${v.partner.tax_code}', 'ACTIVE', '${escapeSql(v.partner.brand_logo)}', 'Giám đốc') ON CONFLICT (tax_code) DO NOTHING;`);
    lines.push(`INSERT INTO partner_approval_requests (partner_id, admin_id, approval_status, admin_feedback) VALUES (${currentUserId}, 1, 'APPROVED', 'Duyệt tự động');`);

    // 2. Branch
    const b = v.branches[0];
    lines.push(`INSERT INTO branches (branch_id, partner_id, branch_name, address, region, phone, status) VALUES (${currentBranchId}, ${currentUserId}, '${escapeSql(b.branch_name)}', '${escapeSql(b.address)}', '${b.region}', '${b.phone}', 'ACTIVE');`);

    // 3. Voucher Program
    lines.push(`INSERT INTO voucher_programs (program_id, partner_id, category_id, program_name, original_price, sale_price, issue_quantity, sale_start_at, sale_end_at, use_start_at, use_end_at, display_status) VALUES (${currentProgramId}, ${currentUserId}, ${v.category_id}, '${escapeSql(v.program_name)}', ${v.original_price}, ${v.sale_price}, ${v.issue_quantity}, '${v.sale_start_at.toISOString()}', '${v.sale_end_at.toISOString()}', '${v.use_start_at.toISOString()}', '${v.use_end_at.toISOString()}', '${v.display_status}');`);
    lines.push(`INSERT INTO voucher_program_branches (program_id, branch_id) VALUES (${currentProgramId}, ${currentBranchId});`);

    // 4. Images
    for (const img of v.images) {
      lines.push(`INSERT INTO voucher_program_images (program_id, image_url, is_primary, sort_order) VALUES (${currentProgramId}, '${escapeSql(img.image_url)}', ${img.is_primary}, ${img.sort_order});`);
    }

    // 5. Approval Request
    lines.push(`INSERT INTO voucher_approval_requests (program_id, admin_id, approval_status, admin_feedback) VALUES (${currentProgramId}, 1, 'APPROVED', 'Duyệt tự động');`);

    // 6. Banner
    if (v.banner) {
      lines.push(`INSERT INTO banners (banner_id, program_id, title, image_url, target_url, display_position, display_from, display_to, status) VALUES (${currentBannerId}, ${currentProgramId}, '${escapeSql(v.banner.title)}', '/vouchers/${currentProgramId}', '${v.banner.display_position}', '${v.banner.display_from.toISOString()}', '${v.banner.display_to.toISOString()}', 'ACTIVE');`);
    }

    // 7. Popup
    if (v.popup) {
      lines.push(`INSERT INTO popups (popup_id, program_id, title, content, target_url, image_url, start_at, end_at, status) VALUES (${currentPopupId}, ${currentProgramId}, '${escapeSql(v.popup.title)}', '${escapeSql(v.popup.content)}', '/vouchers/${currentProgramId}', '${escapeSql(v.popup.image_url)}', '${v.popup.start_at.toISOString()}', '${v.popup.end_at.toISOString()}', 'ACTIVE');`);
    }

    // 8. Contents
    for (const c of v.contents) {
      const currentContentId = ++contentCounter;
      lines.push(`INSERT INTO contents (content_id, program_id, title, body, content_type, status) VALUES (${currentContentId}, ${currentProgramId}, '${escapeSql(c.title)}', $BODY$${c.body}$BODY$, '${c.content_type}', 'ACTIVE');`);
    }

    lines.push('\n');
  }

  const sqlContent = lines.join('\n');
  const fullPath = path.resolve(outputPath);
  fs.writeFileSync(fullPath, sqlContent, 'utf-8');
  console.log(`[Crawler SQL Export] Đã xuất file SQL Seed thành công: ${fullPath}`);
  return fullPath;
}
