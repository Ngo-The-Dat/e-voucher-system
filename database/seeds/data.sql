-- PostgreSQL Seed Data Script for Voucher System
-- Insert initial test/demonstration data for all 19 tables

-- Clear existing data
TRUNCATE TABLE system_logs, contents, popups, banners, order_cancellations,
               reviews_feedback, issued_vouchers, order_items, orders, cart_items,
               voucher_approval_requests, voucher_program_branches, voucher_programs,
               partner_employees, branches, categories, partners, users RESTART IDENTITY CASCADE;

-- 1. Insert users (10 rows)
INSERT INTO users (user_id, full_name, email, phone, password_hash, role, gender, nationality, status, created_at) VALUES
(1, 'Nguyễn Văn Admin', 'admin1@voucher.vn', '0901000001', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'ADMIN', 'MALE', 'Việt Nam', 'ACTIVE', '2026-01-01 08:00:00'),
(2, 'Trần Thị QTV', 'admin2@voucher.vn', '0901000002', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'ADMIN', 'FEMALE', 'Việt Nam', 'ACTIVE', '2026-01-01 08:30:00'),
(3, 'Lê Văn Đối Tác F&B', 'partner_fb@voucher.vn', '0902000001', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'PARTNER', 'MALE', 'Việt Nam', 'ACTIVE', '2026-01-02 09:00:00'),
(4, 'Phạm Thị Spa Đối Tác', 'partner_spa@voucher.vn', '0902000002', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'PARTNER', 'FEMALE', 'Việt Nam', 'ACTIVE', '2026-01-02 09:30:00'),
(5, 'Hoàng Văn Travel Đối Tác', 'partner_travel@voucher.vn', '0902000003', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'PARTNER', 'MALE', 'Việt Nam', 'ACTIVE', '2026-01-02 10:00:00'),
(6, 'Nguyễn Nhân Viên F&B', 'employee_fb1@voucher.vn', '0903000001', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'PARTNER_EMPLOYEE', 'MALE', 'Việt Nam', 'ACTIVE', '2026-01-03 10:30:00'),
(7, 'Đỗ Nhân Viên Spa', 'employee_spa1@voucher.vn', '0903000002', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'PARTNER_EMPLOYEE', 'FEMALE', 'Việt Nam', 'ACTIVE', '2026-01-03 11:00:00'),
(8, 'Vũ Thị Khách Hàng 1', 'customer1@gmail.com', '0904000001', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'CUSTOMER', 'FEMALE', 'Việt Nam', 'ACTIVE', '2026-01-04 14:00:00'),
(9, 'Bùi Văn Khách Hàng 2', 'customer2@gmail.com', '0904000002', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'CUSTOMER', 'MALE', 'Việt Nam', 'ACTIVE', '2026-01-04 15:00:00'),
(10, 'Đặng Thị Khách Hàng 3', 'customer3@gmail.com', '0904000003', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'CUSTOMER', 'FEMALE', 'Việt Nam', 'ACTIVE', '2026-01-04 16:00:00');

-- 2. Insert partners (3 rows)
INSERT INTO partners (user_id, business_name, tax_code, approval_status, activity_status, registered_at) VALUES
(3, 'Công ty TNHH Ẩm Thực Việt', '0101234567', 'APPROVED', 'ACTIVE', '2026-01-02 09:05:00'),
(4, 'Công ty Cổ phần Thẩm mỹ Spa Hương Sen', '0107654321', 'APPROVED', 'ACTIVE', '2026-01-02 09:35:00'),
(5, 'Công ty Du lịch & Khách sạn Biển Bạc', '0109998887', 'APPROVED', 'ACTIVE', '2026-01-02 10:05:00');

-- 3. Insert categories (4 rows)
INSERT INTO categories (category_id, category_name, description, status) VALUES
(1, 'Ẩm thực & Nhà hàng', 'Voucher giảm giá ăn uống tại nhà hàng, quán cafe', 'ACTIVE'),
(2, 'Làm đẹp & Spa', 'Dịch vụ chăm sóc sức khỏe, dịch vụ thư giãn spa', 'ACTIVE'),
(3, 'Du lịch & Khách sạn', 'Voucher nghỉ dưỡng khách sạn, tour du lịch', 'ACTIVE'),
(4, 'Giải trí & Sự kiện', 'Vé xem phim, khu vui chơi, nghe nhạc', 'ACTIVE');

-- 4. Insert branches (5 rows)
INSERT INTO branches (branch_id, partner_id, branch_name, address, region, phone, status) VALUES
(1, 3, 'Ẩm Thực Việt - Chi nhánh Quận 1', '123 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM', 'Miền Nam', '02838221234', 'ACTIVE'),
(2, 3, 'Ẩm Thực Việt - Chi nhánh Hoàn Kiếm', '45 Tràng Tiền, Quận Hoàn Kiếm, Hà Nội', 'Miền Bắc', '02439349999', 'ACTIVE'),
(3, 4, 'Spa Hương Sen - Chi nhánh Cầu Giấy', '88 Xuân Thủy, Quận Cầu Giấy, Hà Nội', 'Miền Bắc', '02437681234', 'ACTIVE'),
(4, 4, 'Spa Hương Sen - Chi nhánh Quận 3', '200 Điện Biên Phủ, Quận 3, TP.HCM', 'Miền Nam', '02839305678', 'ACTIVE'),
(5, 5, 'Biển Bạc Hotel - Chi nhánh Nha Trang', '01 Trần Phú, TP. Nha Trang, Khánh Hòa', 'Miền Trung', '02583521234', 'ACTIVE');

-- 5. Insert partner_employees (2 rows)
INSERT INTO partner_employees (user_id, branch_id) VALUES
(6, 1),
(7, 3);

-- 6. Insert voucher_programs (5 rows)
-- Note: discount_amount is automatically computed as (original_price - sale_price)
INSERT INTO voucher_programs (program_id, partner_id, category_id, program_name, original_price, sale_price, issue_quantity, sale_start_at, sale_end_at, use_start_at, use_end_at, display_status) VALUES
(1, 3, 1, 'Buffet Lẩu Nướng Cao Cấp Giảm 30%', 100000.00, 70000.00, 500, '2026-01-05 00:00:00', '2026-12-31 23:59:59', '2026-01-05 00:00:00', '2027-01-05 23:59:59', 'PUBLISHED'),
(2, 3, 1, 'Voucher Ăn Trưa 500k Giảm Còn 350k', 500000.00, 350000.00, 200, '2026-01-05 00:00:00', '2026-12-31 23:59:59', '2026-01-05 00:00:00', '2027-01-05 23:59:59', 'PUBLISHED'),
(3, 4, 2, 'Liệu Trình Spa Thảo Dược 60 Phút', 200000.00, 150000.00, 100, '2026-01-06 00:00:00', '2026-12-31 23:59:59', '2026-01-06 00:00:00', '2027-01-06 23:59:59', 'PUBLISHED'),
(4, 4, 2, 'Gói Chăm Sóc Da Mặt Chuyên Sâu', 300000.00, 200000.00, 150, '2026-01-06 00:00:00', '2026-12-31 23:59:59', '2026-01-06 00:00:00', '2027-01-06 23:59:59', 'DRAFT'),
(5, 5, 3, 'Voucher Phòng Deluxe 2N1Đ Biển Bạc Nha Trang', 150000.00, 100000.00, 50, '2026-01-07 00:00:00', '2026-12-31 23:59:59', '2026-01-07 00:00:00', '2027-01-07 23:59:59', 'PUBLISHED');

-- 7. Insert voucher_program_branches (7 rows)
INSERT INTO voucher_program_branches (program_id, branch_id) VALUES
(1, 1),
(1, 2),
(2, 1),
(2, 2),
(3, 3),
(3, 4),
(5, 5);

-- 8. Insert voucher_approval_requests (5 rows)
INSERT INTO voucher_approval_requests (approval_request_id, program_id, admin_id, submitted_at, reviewed_at, approval_status, admin_feedback) VALUES
(1, 1, 1, '2026-01-04 10:00:00', '2026-01-04 11:00:00', 'APPROVED', 'Chương trình đáp ứng đủ điều kiện.'),
(2, 2, 1, '2026-01-04 10:30:00', '2026-01-04 11:30:00', 'APPROVED', 'Duyệt chương trình ăn trưa.'),
(3, 3, 2, '2026-01-05 09:00:00', '2026-01-05 10:00:00', 'APPROVED', 'Chương trình Spa hợp lệ.'),
(4, 4, 2, '2026-01-05 09:30:00', NULL, 'PENDING', NULL),
(5, 5, 1, '2026-01-06 08:00:00', '2026-01-06 09:00:00', 'APPROVED', 'Duyệt voucher khách sạn Nha Trang.');

-- 9. Insert cart_items (4 rows)
INSERT INTO cart_items (cart_item_id, customer_id, program_id, quantity) VALUES
(1, 8, 3, 1),
(2, 8, 5, 2),
(3, 9, 1, 3),
(4, 10, 2, 1);

-- 10. Insert orders (4 rows)
INSERT INTO orders (order_id, buyer_user_id, recipient_user_id, created_at, total_amount, payment_method, payment_status, order_status) VALUES
(1, 8, NULL, '2026-01-10 10:00:00', 140000.00, 'VNPAY', 'PAID', 'COMPLETED'),
(2, 8, 9, '2026-01-11 11:00:00', 350000.00, 'MOMO', 'PAID', 'COMPLETED'),
(3, 9, NULL, '2026-01-12 14:00:00', 300000.00, 'CREDIT_CARD', 'PAID', 'CONFIRMED'),
(4, 10, NULL, '2026-01-13 16:00:00', 100000.00, 'BANK_TRANSFER', 'REFUNDED', 'CANCELLED');

-- 11. Insert order_items (4 rows)
-- Note: line_total is automatically computed as (quantity * unit_price)
INSERT INTO order_items (order_item_id, order_id, program_id, quantity, unit_price) VALUES
(1, 1, 1, 2, 70000.00),
(2, 2, 2, 1, 350000.00),
(3, 3, 3, 2, 150000.00),
(4, 4, 5, 1, 100000.00);

-- 12. Insert issued_vouchers (6 rows)
INSERT INTO issued_vouchers (issued_voucher_id, program_id, order_item_id, owner_user_id, voucher_code, qr_code, usage_status, issued_at, expires_at, applicable_region, used_at, discount_amount) VALUES
(1, 1, 1, 8, 'VCH-FB-0001', 'https://qr.voucher.vn/VCH-FB-0001', 'USED', '2026-01-10 10:01:00', '2027-01-05 23:59:59', 'Miền Nam', '2026-01-15 12:30:00', 30000.00),
(2, 1, 1, 8, 'VCH-FB-0002', 'https://qr.voucher.vn/VCH-FB-0002', 'UNUSED', '2026-01-10 10:01:00', '2027-01-05 23:59:59', 'Miền Nam', NULL, 30000.00),
(3, 2, 2, 9, 'VCH-FB-0003', 'https://qr.voucher.vn/VCH-FB-0003', 'UNUSED', '2026-01-11 11:01:00', '2027-01-05 23:59:59', 'Miền Nam', NULL, 150000.00),
(4, 3, 3, 9, 'VCH-SPA-0001', 'https://qr.voucher.vn/VCH-SPA-0001', 'UNUSED', '2026-01-12 14:01:00', '2027-01-06 23:59:59', 'Miền Bắc', NULL, 50000.00),
(5, 3, 3, 9, 'VCH-SPA-0002', 'https://qr.voucher.vn/VCH-SPA-0002', 'UNUSED', '2026-01-12 14:01:00', '2027-01-06 23:59:59', 'Miền Bắc', NULL, 50000.00),
(6, 5, 4, 10, 'VCH-TVL-0001', 'https://qr.voucher.vn/VCH-TVL-0001', 'CANCELLED', '2026-01-13 16:01:00', '2027-01-07 23:59:59', 'Miền Trung', NULL, 50000.00);

-- 13. Insert reviews_feedback (3 rows)
INSERT INTO reviews_feedback (review_id, issued_voucher_id, customer_id, rating, review_content, complaint_content, submitted_at) VALUES
(1, 1, 8, 5, 'Thức ăn rất ngon, phục vụ chu đáo tận tình!', NULL, '2026-01-15 14:00:00'),
(2, 2, 8, 4, 'Đã mua voucher thứ 2, dùng rất tiện lợi.', NULL, '2026-01-16 09:00:00'),
(3, 6, 10, 1, 'Hủy đơn hàng hoàn tiền chậm.', 'Đã quá 3 ngày chưa nhận lại tiền chuyển khoản.', '2026-01-14 10:00:00');

-- 14. Insert order_cancellations (1 row)
INSERT INTO order_cancellations (cancellation_id, order_id, admin_id, requested_at, reason) VALUES
(1, 4, 1, '2026-01-13 16:30:00', 'Khách hàng đổi ý muốn chuyển sang mua gói khác.');

-- 15. Insert banners (3 rows)
INSERT INTO banners (banner_id, program_id, title, image_url, target_url, display_position, display_from, display_to, status) VALUES
(1, 1, 'Bùng Nổ Tiệc Buffet Giảm 30%', 'https://cdn.voucher.vn/banners/buffet30.jpg', 'https://voucher.vn/programs/1', 'HOME_TOP', '2026-01-05 00:00:00', '2026-06-30 23:59:59', 'ACTIVE'),
(2, 3, 'Thư Giãn Cùng Spa Hương Sen', 'https://cdn.voucher.vn/banners/spa.jpg', 'https://voucher.vn/programs/3', 'CATEGORY_HEADER', '2026-01-06 00:00:00', '2026-06-30 23:59:59', 'ACTIVE'),
(3, 5, 'Nghỉ Dưỡng Biển Nha Trang Giá Cực Tốt', 'https://cdn.voucher.vn/banners/nhatrang.jpg', 'https://voucher.vn/programs/5', 'HOME_MIDDLE', '2026-01-07 00:00:00', '2026-06-30 23:59:59', 'ACTIVE');

-- 16. Insert popups (2 rows)
INSERT INTO popups (popup_id, program_id, title, content, target_url, image_url, start_at, end_at, status) VALUES
(1, 1, 'Săn Voucher Buffet Giá Sốc', 'Giảm trực tiếp 30k khi mua hôm nay!', 'https://voucher.vn/programs/1', 'https://cdn.voucher.vn/popups/buffet.jpg', '2026-01-05 00:00:00', '2026-02-28 23:59:59', 'ACTIVE'),
(2, 3, 'Đón Xuân Cùng Spa Hương Sen', 'Khuyến mãi tri ân khách hàng thân thiết.', 'https://voucher.vn/programs/3', 'https://cdn.voucher.vn/popups/spa.jpg', '2026-01-06 00:00:00', '2026-02-28 23:59:59', 'ACTIVE');

-- 17. Insert contents (3 rows)
INSERT INTO contents (content_id, program_id, title, body, content_type, created_at, updated_at, status) VALUES
(1, 1, 'Điều khoản & Điều kiện sử dụng Voucher Buffet', 'Voucher áp dụng tất cả các ngày trong tuần, không áp dụng lễ tết...', 'POLICY', '2026-01-05 08:00:00', NULL, 'ACTIVE'),
(2, 3, 'Trải nghiệm liệu trình Spa Hương Sen', 'Bài viết đánh giá chi tiết về quy trình chăm sóc da mặt...', 'ARTICLE', '2026-01-06 09:00:00', NULL, 'ACTIVE'),
(3, 5, 'Hướng dẫn đặt phòng tại Biển Bạc Hotel', 'Quy trình đặt phòng và xác nhận mã voucher khi nhận phòng...', 'GUIDE', '2026-01-07 10:00:00', NULL, 'ACTIVE');

-- 18. Insert system_logs (10 rows)
INSERT INTO system_logs (log_id, user_id, action, object_id, object_type, old_value, new_value, performed_at, result) VALUES
(1, 1, 'CREATE_USER', '1', 'USER', NULL, '{"role": "ADMIN", "email": "admin1@voucher.vn"}'::jsonb, '2026-01-01 08:00:00', 'SUCCESS'),
(2, 3, 'REGISTER_PARTNER', '3', 'PARTNER', NULL, '{"business_name": "Công ty TNHH Ẩm Thực Việt"}'::jsonb, '2026-01-02 09:05:00', 'SUCCESS'),
(3, 3, 'CREATE_VOUCHER_PROGRAM', '1', 'VOUCHER_PROGRAM', NULL, '{"program_name": "Buffet Lẩu Nướng Cao Cấp Giảm 30%"}'::jsonb, '2026-01-04 09:50:00', 'SUCCESS'),
(4, 1, 'APPROVE_VOUCHER_PROGRAM', '1', 'APPROVAL_REQUEST', '{"status": "PENDING"}'::jsonb, '{"status": "APPROVED"}'::jsonb, '2026-01-04 11:00:00', 'SUCCESS'),
(5, 8, 'ADD_TO_CART', '1', 'CART_ITEM', NULL, '{"program_id": 3, "quantity": 1}'::jsonb, '2026-01-09 15:00:00', 'SUCCESS'),
(6, 8, 'CREATE_ORDER', '1', 'ORDER', NULL, '{"total_amount": 140000.00, "payment_method": "VNPAY"}'::jsonb, '2026-01-10 10:00:00', 'SUCCESS'),
(7, 8, 'ISSUE_VOUCHER', '1', 'ISSUED_VOUCHER', NULL, '{"voucher_code": "VCH-FB-0001"}'::jsonb, '2026-01-10 10:01:00', 'SUCCESS'),
(8, 8, 'USE_VOUCHER', '1', 'ISSUED_VOUCHER', '{"usage_status": "UNUSED"}'::jsonb, '{"usage_status": "USED"}'::jsonb, '2026-01-15 12:30:00', 'SUCCESS'),
(9, 8, 'CREATE_REVIEW', '1', 'REVIEW_FEEDBACK', NULL, '{"rating": 5, "content": "Thức ăn rất ngon"}'::jsonb, '2026-01-15 14:00:00', 'SUCCESS'),
(10, 10, 'REQUEST_CANCEL_ORDER', '4', 'ORDER_CANCELLATION', NULL, '{"reason": "Khách hàng đổi ý"}'::jsonb, '2026-01-13 16:30:00', 'SUCCESS');

-- Reset IDENTITY sequences sau khi seed data tường minh
-- Đảm bảo INSERT tiếp theo không bị duplicate key
SELECT setval(pg_get_serial_sequence('users', 'user_id'), (SELECT MAX(user_id) FROM users));
SELECT setval(pg_get_serial_sequence('categories', 'category_id'), (SELECT MAX(category_id) FROM categories));
SELECT setval(pg_get_serial_sequence('branches', 'branch_id'), (SELECT MAX(branch_id) FROM branches));
SELECT setval(pg_get_serial_sequence('voucher_programs', 'program_id'), (SELECT MAX(program_id) FROM voucher_programs));
SELECT setval(pg_get_serial_sequence('voucher_approval_requests', 'approval_request_id'), (SELECT MAX(approval_request_id) FROM voucher_approval_requests));
SELECT setval(pg_get_serial_sequence('cart_items', 'cart_item_id'), (SELECT MAX(cart_item_id) FROM cart_items));
SELECT setval(pg_get_serial_sequence('orders', 'order_id'), (SELECT MAX(order_id) FROM orders));
SELECT setval(pg_get_serial_sequence('order_items', 'order_item_id'), (SELECT MAX(order_item_id) FROM order_items));
SELECT setval(pg_get_serial_sequence('issued_vouchers', 'issued_voucher_id'), (SELECT MAX(issued_voucher_id) FROM issued_vouchers));
SELECT setval(pg_get_serial_sequence('reviews_feedback', 'review_id'), (SELECT MAX(review_id) FROM reviews_feedback));
SELECT setval(pg_get_serial_sequence('order_cancellations', 'cancellation_id'), (SELECT MAX(cancellation_id) FROM order_cancellations));
SELECT setval(pg_get_serial_sequence('banners', 'banner_id'), (SELECT MAX(banner_id) FROM banners));
SELECT setval(pg_get_serial_sequence('popups', 'popup_id'), (SELECT MAX(popup_id) FROM popups));
SELECT setval(pg_get_serial_sequence('contents', 'content_id'), (SELECT MAX(content_id) FROM contents));
SELECT setval(pg_get_serial_sequence('system_logs', 'log_id'), (SELECT MAX(log_id) FROM system_logs));
