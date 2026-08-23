import pool from "../config/db.js";
import fs from "fs";
import path from "path";
import { seedPendingApprovals } from "./seed-pending-approvals.js";

async function initDatabase() {
    // 1. Tạo bảng cấu trúc Database
    let sql = fs.readFileSync(
        path.join(process.cwd(), "../database/scripts/init.sql"),
        "utf-8"
    );
    await pool.query(sql);
    console.log("✅ Database initialized successfully");

    // 2. Nạp dữ liệu cơ sở (Admin, Customer mẫu, Categories)
    sql = fs.readFileSync(
        path.join(process.cwd(), "../database/seeds/data.sql"),
        "utf-8"
    );
    await pool.query(sql);
    console.log("✅ Base data (Admin & Categories) seeded successfully");

    // 3. Nạp dữ liệu cào thực tế nếu file scraped_vouchers.sql tồn tại
    const scrapedSqlPath = path.join(process.cwd(), "../database/seeds/scraped_vouchers.sql");
    if (fs.existsSync(scrapedSqlPath)) {
        const scrapedSql = fs.readFileSync(scrapedSqlPath, "utf-8");
        if (scrapedSql.trim().length > 0) {
            await pool.query(scrapedSql);
            console.log("✅ Scraped vouchers seeded successfully from scraped_vouchers.sql");
        }
    }

    // 4. Reset Identity Sequences
    await pool.query(`
        SELECT setval(pg_get_serial_sequence('users', 'user_id'), (SELECT COALESCE(MAX(user_id), 1) FROM users));
        SELECT setval(pg_get_serial_sequence('categories', 'category_id'), (SELECT COALESCE(MAX(category_id), 1) FROM categories));
        SELECT setval(pg_get_serial_sequence('branches', 'branch_id'), (SELECT COALESCE(MAX(branch_id), 1) FROM branches));
        SELECT setval(pg_get_serial_sequence('partner_approval_requests', 'approval_request_id'), (SELECT COALESCE(MAX(approval_request_id), 1) FROM partner_approval_requests));
        SELECT setval(pg_get_serial_sequence('partner_employee_approval_requests', 'approval_request_id'), (SELECT COALESCE(MAX(approval_request_id), 1) FROM partner_employee_approval_requests));
        SELECT setval(pg_get_serial_sequence('voucher_programs', 'program_id'), (SELECT COALESCE(MAX(program_id), 1) FROM voucher_programs));
        SELECT setval(pg_get_serial_sequence('voucher_program_images', 'image_id'), (SELECT COALESCE(MAX(image_id), 1) FROM voucher_program_images));
        SELECT setval(pg_get_serial_sequence('voucher_approval_requests', 'approval_request_id'), (SELECT COALESCE(MAX(approval_request_id), 1) FROM voucher_approval_requests));
        SELECT setval(pg_get_serial_sequence('banners', 'banner_id'), (SELECT COALESCE(MAX(banner_id), 1) FROM banners));
        SELECT setval(pg_get_serial_sequence('popups', 'popup_id'), (SELECT COALESCE(MAX(popup_id), 1) FROM popups));
        SELECT setval(pg_get_serial_sequence('contents', 'content_id'), (SELECT COALESCE(MAX(content_id), 1) FROM contents));
    `);

    // 5. Nạp dữ liệu mẫu chờ duyệt cho Admin (Đối tác, Nhân viên, Voucher)
    await seedPendingApprovals();

    await pool.end();
}

initDatabase().catch((err) => {
    console.error("Lỗi khởi tạo DB:", err);
    process.exit(1);
});