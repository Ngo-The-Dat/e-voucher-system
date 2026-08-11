-- PostgreSQL Seed Data Script for Voucher System
-- Insert initial test/demonstration data for all 19 tables

-- Clear existing data
TRUNCATE TABLE system_logs, contents, popups, banners, order_cancellations,
               reviews_feedback, issued_vouchers, order_items, orders, cart_items,
               voucher_approval_requests, voucher_program_branches, voucher_programs,
               partner_employees, branches, categories, partners, user_locks, users RESTART IDENTITY CASCADE;

-- 1. Insert users (21 rows, exactly 1 ADMIN with user_id = 1)
INSERT INTO users (user_id, full_name, email, phone, password_hash, role, gender, identity_no, nationality, status, created_at) VALUES
(1, 'Nguyễn Văn Admin', 'admin1@voucher.vn', '0901000001', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'ADMIN', 'MALE', '001090000001', 'Việt Nam', 'ACTIVE', '2026-01-01 08:00:00'),
(2, 'Trần Thị Thu Hà', 'thuha@gmail.com', '0904000004', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'CUSTOMER', 'FEMALE', '001195000002', 'Việt Nam', 'ACTIVE', '2026-01-01 08:30:00'),
(3, 'Lê Văn Đối Tác F&B', 'partner_fb@voucher.vn', '0902000001', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'PARTNER', 'MALE', '001088000003', 'Việt Nam', 'ACTIVE', '2026-01-02 09:00:00'),
(4, 'Phạm Thị Spa Đối Tác', 'partner_spa@voucher.vn', '0902000002', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'PARTNER', 'FEMALE', '001185000004', 'Việt Nam', 'ACTIVE', '2026-01-02 09:30:00'),
(5, 'Hoàng Văn Travel Đối Tác', 'partner_travel@voucher.vn', '0902000003', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'PARTNER', 'MALE', '001089000005', 'Việt Nam', 'ACTIVE', '2026-01-02 10:00:00'),
(6, 'Nguyễn Nhân Viên F&B', 'employee_fb1@voucher.vn', '0903000001', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'PARTNER_EMPLOYEE', 'MALE', '001092000006', 'Việt Nam', 'ACTIVE', '2026-01-03 10:30:00'),
(7, 'Đỗ Nhân Viên Spa', 'employee_spa1@voucher.vn', '0903000002', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'PARTNER_EMPLOYEE', 'FEMALE', '001194000007', 'Việt Nam', 'ACTIVE', '2026-01-03 11:00:00'),
(8, 'Vũ Thị Khách Hàng 1', 'customer1@gmail.com', '0904000001', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'CUSTOMER', 'FEMALE', '001196000008', 'Việt Nam', 'ACTIVE', '2026-01-04 14:00:00'),
(9, 'Bùi Văn Khách Hàng 2', 'customer2@gmail.com', '0904000002', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'CUSTOMER', 'MALE', '001097000009', 'Việt Nam', 'ACTIVE', '2026-01-04 15:00:00'),
(10, 'Đặng Thị Khách Hàng 3', 'customer3@gmail.com', '0904000003', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'CUSTOMER', 'FEMALE', '001198000010', 'Việt Nam', 'ACTIVE', '2026-01-04 16:00:00'),
(11, 'Nguyễn Thị Sen', 'partner_sen@senvang.vn', '0905000011', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'PARTNER', 'FEMALE', '001196000011', 'Việt Nam', 'ACTIVE', '2026-08-01 14:30:00'),
(12, 'Trần Văn Hải', 'partner_haisanx@gmail.com', '0905000012', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'PARTNER', 'MALE', '001097000012', 'Việt Nam', 'ACTIVE', '2026-07-31 09:15:00'),
(13, 'Nguyễn Thị Hương', 'partner_highlands@coffee.vn', '0905000013', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'PARTNER', 'FEMALE', '001198000013', 'Việt Nam', 'ACTIVE', '2026-07-28 10:20:00'),
(14, 'Lê Quốc Trung', 'partner_cgv@cinema.vn', '0905000014', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'PARTNER', 'MALE', '001099000014', 'Việt Nam', 'ACTIVE', '2026-07-25 11:00:00'),
(15, 'Hoàng Văn Tuấn', 'partner_tocotoco@bubbletea.vn', '0905000015', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'PARTNER', 'MALE', '001090000015', 'Việt Nam', 'ACTIVE', '2026-08-02 16:15:00'),
-- Thêm các đối tác chờ duyệt và yêu cầu sửa đổi
(16, 'Phạm Văn Long', 'partner_goldengate@restaurant.vn', '0906000016', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'PARTNER', 'MALE', '001091000016', 'Việt Nam', 'ACTIVE', '2026-08-04 09:00:00'),
(17, 'Nguyễn Thị Thùy Dung', 'partner_cali@fitness.vn', '0906000017', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'PARTNER', 'FEMALE', '001192000017', 'Việt Nam', 'ACTIVE', '2026-08-04 10:30:00'),
(18, 'Vũ Đình Toàn', 'partner_tch@coffeehouse.vn', '0906000018', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'PARTNER', 'MALE', '001093000018', 'Việt Nam', 'ACTIVE', '2026-08-03 14:15:00'),
(19, 'Hoàng Mai Anh', 'partner_seoulcenter@spa.vn', '0906000019', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'PARTNER', 'FEMALE', '001194000019', 'Việt Nam', 'ACTIVE', '2026-08-02 11:20:00'),
(20, 'Trần Minh Đức', 'partner_muongthanh@hotel.vn', '0906000020', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'PARTNER', 'MALE', '001095000020', 'Việt Nam', 'ACTIVE', '2026-08-01 16:45:00'),
(21, 'Đỗ Quốc Bảo', 'partner_haidilao@hotpot.vn', '0906000021', '$2a$12$eImiTXuWVxfM37uY4JANjO46d6k3x1H9k0L8M2N3O4P5Q6R7S8T9U', 'PARTNER', 'MALE', '001096000021', 'Việt Nam', 'ACTIVE', '2026-07-30 08:30:00');

-- 2. Insert partners (14 rows: 6 APPROVED, 6 PENDING, 1 REVISION_REQUESTED, 1 REJECTED)
INSERT INTO partners (user_id, business_name, tax_code, approval_status, activity_status, registered_at, business_license_no, license_issue_date, license_issue_place) VALUES
-- Đối tác đã duyệt (APPROVED)
(3, 'Công ty TNHH Ẩm Thực Việt', '0101234567', 'APPROVED', 'ACTIVE', '2026-01-02 09:05:00', '0101234567-001', '2020-05-10', 'Sở KH&ĐT TP. Hà Nội'),
(4, 'Công ty Cổ phần Thẩm mỹ Spa Hương Sen', '0107654321', 'APPROVED', 'ACTIVE', '2026-01-02 09:35:00', '0107654321-001', '2021-08-15', 'Sở KH&ĐT TP. Hà Nội'),
(5, 'Công ty Du lịch & Khách sạn Biển Bạc', '0109998887', 'APPROVED', 'ACTIVE', '2026-01-02 10:05:00', '0109998887-001', '2019-11-20', 'Sở KH&ĐT TP. Hồ Chí Minh'),
(11, 'Công ty TNHH Dịch vụ Spa Sen Vàng', '0102123456', 'APPROVED', 'ACTIVE', '2026-08-01 14:30:00', '0102123456-001', '2022-03-15', 'Sở KH&ĐT TP. Hà Nội'),
(13, 'Công ty Cổ phần DV Cà Phê Cao Nguyên (Highlands)', '0303725714', 'APPROVED', 'ACTIVE', '2026-07-28 10:20:00', '0303725714-001', '2020-01-18', 'Sở KH&ĐT TP. Hồ Chí Minh'),
(14, 'Công ty TNHH CJ CGV Việt Nam', '0303675394', 'APPROVED', 'ACTIVE', '2026-07-25 11:00:00', '0303675394-001', '2018-09-05', 'Sở KH&ĐT TP. Hồ Chí Minh'),
(15, 'Công ty Cổ phần Trà sữa TocoToco', '0106789012', 'APPROVED', 'ACTIVE', '2026-08-02 16:15:00', '0106789012-001', '2023-02-20', 'Sở KH&ĐT TP. Hà Nội'),

-- Đối tác chờ duyệt (PENDING)
(16, 'Công ty TNHH Golden Gate Restaurant Group', '0102721191', 'PENDING', 'INACTIVE', '2026-08-04 09:00:00', '0102721191-001', '2021-04-10', 'Sở KH&ĐT TP. Hà Nội'),
(17, 'Công ty Cổ phần Thương mại Dịch vụ California Fitness & Yoga', '0305123987', 'PENDING', 'INACTIVE', '2026-08-04 10:30:00', '0305123987-001', '2020-08-20', 'Sở KH&ĐT TP. Hồ Chí Minh'),
(18, 'Hộ Kinh Doanh Chuỗi Cafe The Coffee House', '0312345678', 'PENDING', 'INACTIVE', '2026-08-03 14:15:00', '0312345678-001', '2022-11-15', 'Sở KH&ĐT TP. Hồ Chí Minh'),
(19, 'Công ty TNHH Thẩm Mỹ Viện Quốc Tế Seoul Center', '0108889999', 'PENDING', 'INACTIVE', '2026-08-02 11:20:00', '0108889999-001', '2023-05-12', 'Sở KH&ĐT TP. Hà Nội'),
(20, 'Công ty Cổ phần Đầu tư Du lịch Mường Thanh', '0101998877', 'PENDING', 'INACTIVE', '2026-08-01 16:45:00', '0101998877-001', '2019-09-01', 'Sở KH&ĐT Tỉnh Nghệ An'),

-- Đối tác yêu cầu sửa đổi (REVISION_REQUESTED)
(21, 'Công ty TNHH Lẩu Nướng Haidilao Việt Nam', '0315897462', 'REVISION_REQUESTED', 'INACTIVE', '2026-07-30 08:30:00', '0315897462-001', '2022-07-15', 'Sở KH&ĐT TP. Hồ Chí Minh'),

-- Đối tác bị từ chối (REJECTED)
(12, 'Công ty Cổ phần Nhà hàng Hải Sản X', '0103456789', 'REJECTED', 'INACTIVE', '2026-07-31 09:15:00', '0103456789-001', '2021-06-10', 'Sở KH&ĐT TP. Hồ Chí Minh');

-- 3. Insert categories (4 rows)
INSERT INTO categories (category_id, category_name, description, status) VALUES
(1, 'Ẩm thực & Nhà hàng', 'Voucher giảm giá ăn uống tại nhà hàng, quán cafe', 'ACTIVE'),
(2, 'Làm đẹp & Spa', 'Dịch vụ chăm sóc sức khỏe, dịch vụ thư giãn spa', 'ACTIVE'),
(3, 'Du lịch & Khách sạn', 'Voucher nghỉ dưỡng khách sạn, tour du lịch', 'ACTIVE'),
(4, 'Giải trí & Sự kiện', 'Vé xem phim, khu vui chơi, nghe nhạc', 'ACTIVE');

-- 4. Insert branches (20 rows)
INSERT INTO branches (branch_id, partner_id, branch_name, address, region, phone, status) VALUES
(1, 3, 'Ẩm Thực Việt - Chi nhánh Quận 1', '123 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM', 'Miền Nam', '02838221234', 'ACTIVE'),
(2, 3, 'Ẩm Thực Việt - Chi nhánh Hoàn Kiếm', '45 Tràng Tiền, Quận Hoàn Kiếm, Hà Nội', 'Miền Bắc', '02439349999', 'ACTIVE'),
(3, 4, 'Spa Hương Sen - Chi nhánh Cầu Giấy', '88 Xuân Thủy, Quận Cầu Giấy, Hà Nội', 'Miền Bắc', '02437681234', 'ACTIVE'),
(4, 4, 'Spa Hương Sen - Chi nhánh Quận 3', '200 Điện Biên Phủ, Quận 3, TP.HCM', 'Miền Nam', '02839305678', 'ACTIVE'),
(5, 5, 'Biển Bạc Hotel - Chi nhánh Nha Trang', '01 Trần Phú, TP. Nha Trang, Khánh Hòa', 'Miền Trung', '02583521234', 'ACTIVE'),
(6, 11, 'Spa Sen Vàng - Chi nhánh Liễu Giai', '54 Liễu Giai, Cống Vị, Ba Đình, Hà Nội', 'Miền Bắc', '02438889999', 'ACTIVE'),
(7, 11, 'Spa Sen Vàng - Chi nhánh Nguyễn Trãi', '234 Nguyễn Trãi, Thanh Xuân, Hà Nội', 'Miền Bắc', '02438888888', 'ACTIVE'),
(8, 12, 'Hải Sản X - Chi nhánh Quận 1', '99 Trần Hưng Đạo, Quận 1, TP.HCM', 'Miền Nam', '02839998888', 'INACTIVE'),
(9, 13, 'Highlands Coffee - Chi nhánh Quận 1', '135 Nguyễn Huệ, Bến Nghé, Quận 1, TP.HCM', 'Miền Nam', '02838218888', 'ACTIVE'),
(10, 15, 'TocoToco - Chi nhánh Nguyễn Trãi', '182 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM', 'Miền Nam', '02839257777', 'ACTIVE'),
(11, 14, 'CGV Sư Vạn Hạnh Mall', 'Vạn Hạnh Mall, 11 Sư Vạn Hạnh, Quận 10, TP.HCM', 'Miền Nam', '02838688888', 'ACTIVE'),
(12, 14, 'CGV Vincom Đồng Khởi', '72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM', 'Miền Nam', '02838229999', 'ACTIVE'),
-- Chi nhánh của các đối tác mới
(13, 16, 'Manwah Hotpot - Vincom Center Landmark 81', '772 Điện Biên Phủ, Phường 22, Bình Thạnh, TP.HCM', 'Miền Nam', '02873007044', 'ACTIVE'),
(14, 16, 'Kichi Kichi - Vincom Bà Triệu', '191 Bà Triệu, Lê Đại Hành, Hai Bà Trưng, Hà Nội', 'Miền Bắc', '02473007338', 'ACTIVE'),
(15, 17, 'California Fitness - Pearl Plaza', '561A Điện Biên Phủ, Phường 25, Bình Thạnh, TP.HCM', 'Miền Nam', '02871097889', 'ACTIVE'),
(16, 18, 'The Coffee House - Cao Thắng', '86 Cao Thắng, Phường 4, Quận 3, TP.HCM', 'Miền Nam', '02871087088', 'ACTIVE'),
(17, 18, 'The Coffee House - Thái Hà', '56 Thái Hà, Đống Đa, Hà Nội', 'Miền Bắc', '02471087088', 'ACTIVE'),
(18, 19, 'Seoul Center - Chi nhánh Cách Mạng Tháng 8', '375 Nguyễn Thượng Hiền, Phường 11, Quận 10, TP.HCM', 'Miền Nam', '1800088878', 'ACTIVE'),
(19, 20, 'Mường Thanh Luxury Đà Nẵng', '270 Võ Nguyên Giáp, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng', 'Miền Trung', '02363956789', 'ACTIVE'),
(20, 21, 'Haidilao Hotpot - Bitexco Financial Tower', 'Tầng 2 Bitexco, 2 Hải Triều, Bến Nghé, Quận 1, TP.HCM', 'Miền Nam', '02822539156', 'ACTIVE');

-- 5. Insert partner_employees (2 rows)
INSERT INTO partner_employees (user_id, branch_id) VALUES
(6, 1),
(7, 3);

-- 6. Insert voucher_programs (15 rows phong phú mọi tình huống)
INSERT INTO voucher_programs (program_id, partner_id, category_id, program_name, original_price, sale_price, issue_quantity, sale_start_at, sale_end_at, use_start_at, use_end_at, display_status) VALUES
-- Programs đã PUBLISHED (Đang bán)
(1, 3, 1, 'Buffet Lẩu Nướng Cao Cấp Giảm 30%', 100000.00, 70000.00, 500, '2026-01-05 00:00:00', '2026-12-31 23:59:59', '2026-01-05 00:00:00', '2027-01-05 23:59:59', 'PUBLISHED'),
(2, 3, 1, 'Voucher Ăn Trưa 500k Giảm Còn 350k', 500000.00, 350000.00, 200, '2026-01-05 00:00:00', '2026-12-31 23:59:59', '2026-01-05 00:00:00', '2027-01-05 23:59:59', 'PUBLISHED'),
(3, 4, 2, 'Liệu Trình Spa Thảo Dược 60 Phút', 200000.00, 150000.00, 100, '2026-01-06 00:00:00', '2026-12-31 23:59:59', '2026-01-06 00:00:00', '2027-01-06 23:59:59', 'PUBLISHED'),
(5, 5, 3, 'Voucher Phòng Deluxe 2N1Đ Biển Bạc Nha Trang', 1500000.00, 1000000.00, 50, '2026-01-07 00:00:00', '2026-12-31 23:59:59', '2026-01-07 00:00:00', '2027-01-07 23:59:59', 'PUBLISHED'),

-- Programs PENDING (Chờ duyệt - DRAFT / PENDING_APPROVAL)
(4, 4, 2, 'Gói Chăm Sóc Da Mặt Chuyên Sâu Tái Tạo', 300000.00, 200000.00, 150, '2026-08-01 00:00:00', '2026-12-31 23:59:59', '2026-08-01 00:00:00', '2027-01-06 23:59:59', 'DRAFT'),
(6, 13, 1, 'Voucher 50.000đ áp dụng toàn hệ thống Highlands Coffee', 50000.00, 35000.00, 5000, '2026-08-05 00:00:00', '2026-12-31 23:59:59', '2026-08-05 00:00:00', '2027-01-31 23:59:59', 'DRAFT'),
(7, 3, 1, 'Buffet Lẩu Băng Chuyền Kichi Kichi Ưu Đãi 20%', 350000.00, 280000.00, 1200, '2026-08-10 00:00:00', '2026-11-30 23:59:59', '2026-08-10 00:00:00', '2026-12-15 23:59:59', 'DRAFT'),
(8, 14, 4, 'Vé Xem Phim 2D Cuối Tuần CGV Cinemas Tặng Popcorn', 120000.00, 79000.00, 3000, '2026-08-08 00:00:00', '2026-12-31 23:59:59', '2026-08-08 00:00:00', '2027-01-31 23:59:59', 'DRAFT'),
(9, 11, 2, 'Chiến dịch ưu đãi sai quy định (Cảnh báo sai giá bán)', 100000.00, 120000.00, 500, '2026-08-01 00:00:00', '2026-10-31 23:59:59', '2026-08-01 00:00:00', '2026-11-30 23:59:59', 'DRAFT'),
(10, 15, 1, 'Trà Sữa Trân Châu Đường Đen TocoToco Giảm 40%', 60000.00, 36000.00, 2000, '2026-08-05 00:00:00', '2026-12-31 23:59:59', '2026-08-05 00:00:00', '2027-01-05 23:59:59', 'DRAFT'),

-- Programs Quản lý: HIDDEN (Tạm ngưng)
(11, 15, 1, 'Voucher Ưu Đãi Trà Sữa Tocotoco Mua 1 Tặng 1', 60000.00, 42000.00, 1500, '2026-07-15 00:00:00', '2026-12-31 23:59:59', '2026-07-15 00:00:00', '2027-01-15 23:59:59', 'HIDDEN'),
(12, 14, 4, 'Vé Xem Phim Bom Tấn IMAX Suất Chiếu Đặc Biệt', 150000.00, 99000.00, 500, '2026-07-01 00:00:00', '2026-12-31 23:59:59', '2026-07-01 00:00:00', '2027-01-01 23:59:59', 'HIDDEN'),

-- Programs Quản lý: ENDED (Ngừng bán)
(13, 5, 4, 'Chiến dịch Mùa Hè Rực Rỡ - Giảm 50% Vé Công Viên Nước', 200000.00, 100000.00, 800, '2026-05-01 00:00:00', '2026-07-31 23:59:59', '2026-05-01 00:00:00', '2026-08-31 23:59:59', 'ENDED'),

-- Programs Quản lý: Hết hàng (stock = 0)
(14, 3, 1, 'Flash Sale Trưa 12h: Cơm Tấm Sườn Bì Chả Đặc Biệt', 80000.00, 45000.00, 5, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-01-01 00:00:00', '2027-01-01 23:59:59', 'PUBLISHED'),

-- Programs Quản lý: Quá hạn bán (sale_end_at < hiện tại)
(15, 3, 1, 'Set Menu Tiệc Tất Niên Gia Đình Ấm Cúng 2025', 1200000.00, 850000.00, 100, '2025-01-01 00:00:00', '2025-02-15 23:59:59', '2025-01-01 00:00:00', '2025-02-28 23:59:59', 'PUBLISHED');

-- 7. Insert voucher_program_branches
INSERT INTO voucher_program_branches (program_id, branch_id) VALUES
(1, 1), (1, 2),
(2, 1), (2, 2),
(3, 3), (3, 4),
(4, 3), (4, 4),
(5, 5),
(6, 9),
(7, 1), (7, 2),
(8, 11), (8, 12),
(9, 6), (9, 7),
(10, 10),
(11, 10),
(12, 11), (12, 12),
(13, 5),
(14, 1),
(15, 1), (15, 2);

-- 8. Insert voucher_approval_requests (bao gồm 6 yêu cầu PENDING và các yêu cầu APPROVED)
INSERT INTO voucher_approval_requests (approval_request_id, program_id, admin_id, submitted_at, reviewed_at, approval_status, admin_feedback) VALUES
(1, 1, 1, '2026-01-04 10:00:00', '2026-01-04 11:00:00', 'APPROVED', 'Chương trình đáp ứng đủ điều kiện.'),
(2, 2, 1, '2026-01-04 10:30:00', '2026-01-04 11:30:00', 'APPROVED', 'Duyệt chương trình ăn trưa.'),
(3, 3, 1, '2026-01-05 09:00:00', '2026-01-05 10:00:00', 'APPROVED', 'Chương trình Spa hợp lệ.'),
(5, 5, 1, '2026-01-06 08:00:00', '2026-01-06 09:00:00', 'APPROVED', 'Duyệt voucher khách sạn Nha Trang.'),
-- 6 Yêu cầu PENDING để kiểm thử duyệt voucher
(4, 4, NULL, '2026-08-01 09:30:00', NULL, 'PENDING', NULL),
(6, 6, NULL, '2026-08-03 14:30:00', NULL, 'PENDING', NULL),
(7, 7, NULL, '2026-08-02 09:15:00', NULL, 'PENDING', NULL),
(8, 8, NULL, '2026-08-04 11:20:00', NULL, 'PENDING', NULL),
(9, 9, NULL, '2026-08-01 16:45:00', NULL, 'PENDING', NULL),
(10, 10, NULL, '2026-08-05 10:00:00', NULL, 'PENDING', NULL);

-- 9. Insert cart_items (4 rows)
INSERT INTO cart_items (cart_item_id, customer_id, program_id, quantity) VALUES
(1, 8, 3, 1),
(2, 8, 5, 2),
(3, 9, 1, 3),
(4, 10, 2, 1);

-- 10. Insert orders (5 rows)
INSERT INTO orders (order_id, buyer_user_id, recipient_user_id, created_at, total_amount, payment_method, payment_status, order_status) VALUES
(1, 8, NULL, '2026-01-10 10:00:00', 140000.00, 'VNPAY', 'PAID', 'COMPLETED'),
(2, 8, 9, '2026-01-11 11:00:00', 350000.00, 'MOMO', 'PAID', 'COMPLETED'),
(3, 9, NULL, '2026-01-12 14:00:00', 300000.00, 'CREDIT_CARD', 'PAID', 'CONFIRMED'),
(4, 10, NULL, '2026-01-13 16:00:00', 100000.00, 'BANK_TRANSFER', 'REFUNDED', 'CANCELLED'),
(5, 8, NULL, '2026-01-14 12:00:00', 225000.00, 'MOMO', 'PAID', 'COMPLETED');

-- 11. Insert order_items (5 rows)
INSERT INTO order_items (order_item_id, order_id, program_id, quantity, unit_price) VALUES
(1, 1, 1, 2, 70000.00),
(2, 2, 2, 1, 350000.00),
(3, 3, 3, 2, 150000.00),
(4, 4, 5, 1, 100000.00),
(5, 5, 14, 5, 45000.00);

-- 12. Insert issued_vouchers (11 rows)
INSERT INTO issued_vouchers (issued_voucher_id, program_id, order_item_id, owner_user_id, voucher_code, qr_code, usage_status, issued_at, expires_at, applicable_region, used_at, discount_amount) VALUES
(1, 1, 1, 8, 'VCH-FB-0001', 'https://qr.voucher.vn/VCH-FB-0001', 'USED', '2026-01-10 10:01:00', '2027-01-05 23:59:59', 'Miền Nam', '2026-01-15 12:30:00', 30000.00),
(2, 1, 1, 8, 'VCH-FB-0002', 'https://qr.voucher.vn/VCH-FB-0002', 'UNUSED', '2026-01-10 10:01:00', '2027-01-05 23:59:59', 'Miền Nam', NULL, 30000.00),
(3, 2, 2, 9, 'VCH-FB-0003', 'https://qr.voucher.vn/VCH-FB-0003', 'UNUSED', '2026-01-11 11:01:00', '2027-01-05 23:59:59', 'Miền Nam', NULL, 150000.00),
(4, 3, 3, 9, 'VCH-SPA-0001', 'https://qr.voucher.vn/VCH-SPA-0001', 'UNUSED', '2026-01-12 14:01:00', '2027-01-06 23:59:59', 'Miền Bắc', NULL, 50000.00),
(5, 3, 3, 9, 'VCH-SPA-0002', 'https://qr.voucher.vn/VCH-SPA-0002', 'UNUSED', '2026-01-12 14:01:00', '2027-01-06 23:59:59', 'Miền Bắc', NULL, 50000.00),
(6, 5, 4, 10, 'VCH-TVL-0001', 'https://qr.voucher.vn/VCH-TVL-0001', 'CANCELLED', '2026-01-13 16:01:00', '2027-01-07 23:59:59', 'Miền Trung', NULL, 500000.00),
(7, 14, 5, 8, 'VCH-FS-0001', 'https://qr.voucher.vn/VCH-FS-0001', 'UNUSED', '2026-01-14 12:01:00', '2027-01-01 23:59:59', 'Miền Nam', NULL, 35000.00),
(8, 14, 5, 8, 'VCH-FS-0002', 'https://qr.voucher.vn/VCH-FS-0002', 'UNUSED', '2026-01-14 12:01:00', '2027-01-01 23:59:59', 'Miền Nam', NULL, 35000.00),
(9, 14, 5, 8, 'VCH-FS-0003', 'https://qr.voucher.vn/VCH-FS-0003', 'UNUSED', '2026-01-14 12:01:00', '2027-01-01 23:59:59', 'Miền Nam', NULL, 35000.00),
(10, 14, 5, 8, 'VCH-FS-0004', 'https://qr.voucher.vn/VCH-FS-0004', 'UNUSED', '2026-01-14 12:01:00', '2027-01-01 23:59:59', 'Miền Nam', NULL, 35000.00),
(11, 14, 5, 8, 'VCH-FS-0005', 'https://qr.voucher.vn/VCH-FS-0005', 'UNUSED', '2026-01-14 12:01:00', '2027-01-01 23:59:59', 'Miền Nam', NULL, 35000.00);

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
