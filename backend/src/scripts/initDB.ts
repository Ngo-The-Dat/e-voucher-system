import pool from "../config/db.js";
import fs from "fs";
import path from "path";
import { seedTransactions } from "./seed-dashboard-transactions.js";
import { seedPendingApprovals } from "./seed-pending-approvals.js";

async function initDatabase() {
    console.log("🚀 [1/5] Khởi tạo cấu trúc Database (Tables, Constraints, Indexes)...");
    let sql = fs.readFileSync(
        path.join(process.cwd(), "../database/scripts/init.sql"),
        "utf-8"
    );
    await pool.query(sql);
    console.log("✅ Cấu trúc Database đã được khởi tạo thành công.");

    console.log("🚀 [2/5] Nạp dữ liệu cơ sở (Admin, Base Customers & 12 Danh mục thực tế)...");
    sql = fs.readFileSync(
        path.join(process.cwd(), "../database/seeds/data.sql"),
        "utf-8"
    );
    await pool.query(sql);
    console.log("✅ Dữ liệu cơ sở đã được nạp thành công.");

    console.log("🚀 [3/5] Nạp dữ liệu Voucher cào thực tế (119 Vouchers, Đối tác, Chi nhánh, Banners, Popups)...");
    const scrapedSqlPath = path.join(process.cwd(), "../database/seeds/scraped_vouchers.sql");
    if (fs.existsSync(scrapedSqlPath)) {
        const scrapedSql = fs.readFileSync(scrapedSqlPath, "utf-8");
        if (scrapedSql.trim().length > 0) {
            await pool.query(scrapedSql);
            console.log("✅ Dữ liệu voucher cào thực tế từ scraped_vouchers.sql đã được nạp thành công.");
        }
    }

    console.log("🚀 [4/5] Nạp dữ liệu giao dịch mẫu Dashboard (Đơn hàng, Voucher phát hành, Đánh giá, Audit Logs)...");
    await seedTransactions();

    console.log("🚀 [5/5] Nạp dữ liệu mẫu chờ duyệt cho Admin (Đối tác, Nhân viên đối tác, Chương trình voucher)...");
    await seedPendingApprovals();

    console.log("🚀 Đồng bộ lại Identity Sequences cho toàn bộ bảng PostgreSQL...");
    await pool.query(`
        SELECT setval(pg_get_serial_sequence('users', 'user_id'), (SELECT COALESCE(MAX(user_id), 1) FROM users));
        SELECT setval(pg_get_serial_sequence('categories', 'category_id'), (SELECT COALESCE(MAX(category_id), 1) FROM categories));
        SELECT setval(pg_get_serial_sequence('branches', 'branch_id'), (SELECT COALESCE(MAX(branch_id), 1) FROM branches));
        SELECT setval(pg_get_serial_sequence('partner_approval_requests', 'approval_request_id'), (SELECT COALESCE(MAX(approval_request_id), 1) FROM partner_approval_requests));
        SELECT setval(pg_get_serial_sequence('partner_employee_approval_requests', 'approval_request_id'), (SELECT COALESCE(MAX(approval_request_id), 1) FROM partner_employee_approval_requests));
        SELECT setval(pg_get_serial_sequence('voucher_programs', 'program_id'), (SELECT COALESCE(MAX(program_id), 1) FROM voucher_programs));
        SELECT setval(pg_get_serial_sequence('voucher_program_images', 'image_id'), (SELECT COALESCE(MAX(image_id), 1) FROM voucher_program_images));
        SELECT setval(pg_get_serial_sequence('voucher_approval_requests', 'approval_request_id'), (SELECT COALESCE(MAX(approval_request_id), 1) FROM voucher_approval_requests));
        SELECT setval(pg_get_serial_sequence('orders', 'order_id'), (SELECT COALESCE(MAX(order_id), 1) FROM orders));
        SELECT setval(pg_get_serial_sequence('order_items', 'order_item_id'), (SELECT COALESCE(MAX(order_item_id), 1) FROM order_items));
        SELECT setval(pg_get_serial_sequence('issued_vouchers', 'issued_voucher_id'), (SELECT COALESCE(MAX(issued_voucher_id), 1) FROM issued_vouchers));
        SELECT setval(pg_get_serial_sequence('reviews_feedback', 'review_id'), (SELECT COALESCE(MAX(review_id), 1) FROM reviews_feedback));
        SELECT setval(pg_get_serial_sequence('banners', 'banner_id'), (SELECT COALESCE(MAX(banner_id), 1) FROM banners));
        SELECT setval(pg_get_serial_sequence('popups', 'popup_id'), (SELECT COALESCE(MAX(popup_id), 1) FROM popups));
        SELECT setval(pg_get_serial_sequence('contents', 'content_id'), (SELECT COALESCE(MAX(content_id), 1) FROM contents));
        SELECT setval(pg_get_serial_sequence('system_logs', 'log_id'), (SELECT COALESCE(MAX(log_id), 1) FROM system_logs));
    `);

    console.log("===============================================================");
    console.log("🎉 TOÀN BỘ HỆ THỐNG ĐÃ ĐƯỢC KHỞI TẠO VÀ NẠP DỮ LIỆU HOÀN HẢO!");
    console.log("===============================================================");

    await pool.end();
}

initDatabase().catch((err) => {
    console.error("Lỗi khởi tạo DB:", err);
    process.exit(1);
});