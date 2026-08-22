-- PostgreSQL Seed Data Script for Voucher System
-- Insert initial test/demonstration data for all 19 tables
-- Rich demo dataset for Dashboard (Today, Week, Month, Custom date ranges)

-- Clear existing data
TRUNCATE TABLE system_logs, contents, popups, banners, order_cancellations,
               reviews_feedback, issued_vouchers, order_items, orders, cart_items,
               voucher_approval_requests, voucher_program_images, voucher_program_branches, voucher_programs,
               partner_employee_approval_requests, partner_employees, branches, categories, partner_approval_requests, partners, user_locks, users RESTART IDENTITY CASCADE;

-- =========================================================================
-- THÔNG TIN TÀI KHOẢN MẪU DÙNG ĐĂNG NHẬP / TEST HỆ THỐNG:
-- 1. Tài khoản Quản trị viên (Admin):
--    TK: admin@voucher.vn
--    Pass: @Admin123
-- 2. Tài khoản Nhân viên đối tác (Partner Employee):
--    TK: employee_spa1@voucher.vn 
--    Pass: 12345876
-- (Ghi chú: Tất cả các tài khoản demo còn lại có mật khẩu mặc định là 12345876)
-- =========================================================================

-- 1. Insert users (36 rows, exactly 1 ADMIN with user_id = 1)
INSERT INTO users (user_id, full_name, email, phone, password_hash, role, gender, identity_no, nationality, status, created_at) VALUES
(1, 'Ngô Thế Đạt', 'admin@voucher.vn', '0901000001', '$2b$10$JITaepX2GQH3.6T2KhDIiuh4OcJulzeW80vyNF4jfdjV3JpJ5prNq', 'ADMIN', 'MALE', '001090000001', 'Việt Nam', 'ACTIVE', '2026-01-01 08:00:00'),
(2, 'Trần Thị Thu Hà', 'thuha@gmail.com', '0904000004', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'CUSTOMER', 'FEMALE', '001195000002', 'Việt Nam', 'ACTIVE', '2026-01-01 08:30:00'),
(3, 'Lê Văn Đối Tác F&B', 'partner_fb@voucher.vn', '0902000001', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER', 'MALE', '001088000003', 'Việt Nam', 'ACTIVE', '2026-01-02 09:00:00'),
(4, 'Phạm Thị Spa Đối Tác', 'partner_spa@voucher.vn', '0902000002', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER', 'FEMALE', '001185000004', 'Việt Nam', 'ACTIVE', '2026-01-02 09:30:00'),
(5, 'Hoàng Văn Travel Đối Tác', 'partner_travel@voucher.vn', '0902000003', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER', 'MALE', '001089000005', 'Việt Nam', 'ACTIVE', '2026-01-02 10:00:00'),
(6, 'Nguyễn Nhân Viên F&B', 'employee_fb1@voucher.vn', '0903000001', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER_EMPLOYEE', 'MALE', '001092000006', 'Việt Nam', 'ACTIVE', '2026-01-03 10:30:00'),
(7, 'Đỗ Nhân Viên Spa', 'employee_spa1@voucher.vn', '0903000002', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER_EMPLOYEE', 'FEMALE', '001194000007', 'Việt Nam', 'ACTIVE', '2026-01-03 11:00:00'),
(8, 'Vũ Thị Khách Hàng 1', 'customer1@gmail.com', '0904000001', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'CUSTOMER', 'FEMALE', '001196000008', 'Việt Nam', 'ACTIVE', '2026-01-04 14:00:00'),
(9, 'Bùi Văn Khách Hàng 2', 'customer2@gmail.com', '0904000002', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'CUSTOMER', 'MALE', '001097000009', 'Việt Nam', 'ACTIVE', '2026-01-04 15:00:00'),
(10, 'Đặng Thị Khách Hàng 3', 'customer3@gmail.com', '0904000003', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'CUSTOMER', 'FEMALE', '001198000010', 'Việt Nam', 'ACTIVE', '2026-01-04 16:00:00'),
(11, 'Nguyễn Thị Sen', 'partner_sen@senvang.vn', '0905000011', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER', 'FEMALE', '001196000011', 'Việt Nam', 'ACTIVE', '2026-08-01 14:30:00'),
(12, 'Trần Văn Hải', 'partner_haisanx@gmail.com', '0905000012', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER', 'MALE', '001097000012', 'Việt Nam', 'ACTIVE', '2026-07-31 09:15:00'),
(13, 'Nguyễn Thị Hương', 'partner_highlands@coffee.vn', '0905000013', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER', 'FEMALE', '001198000013', 'Việt Nam', 'ACTIVE', '2026-07-28 10:20:00'),
(14, 'Lê Quốc Trung', 'partner_cgv@cinema.vn', '0905000014', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER', 'MALE', '001099000014', 'Việt Nam', 'ACTIVE', '2026-07-25 11:00:00'),
(15, 'Hoàng Văn Tuấn', 'partner_tocotoco@bubbletea.vn', '0905000015', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER', 'MALE', '001090000015', 'Việt Nam', 'ACTIVE', '2026-08-02 16:15:00'),
(16, 'Phạm Văn Long', 'partner_goldengate@restaurant.vn', '0906000016', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER', 'MALE', '001091000016', 'Việt Nam', 'ACTIVE', '2026-08-04 09:00:00'),
(17, 'Nguyễn Thị Thùy Dung', 'partner_cali@fitness.vn', '0906000017', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER', 'FEMALE', '001192000017', 'Việt Nam', 'ACTIVE', '2026-08-04 10:30:00'),
(18, 'Vũ Đình Toàn', 'partner_tch@coffeehouse.vn', '0906000018', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER', 'MALE', '001093000018', 'Việt Nam', 'ACTIVE', '2026-08-03 14:15:00'),
(19, 'Hoàng Mai Anh', 'partner_seoulcenter@spa.vn', '0906000019', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER', 'FEMALE', '001194000019', 'Việt Nam', 'ACTIVE', '2026-08-02 11:20:00'),
(20, 'Trần Minh Đức', 'partner_muongthanh@hotel.vn', '0906000020', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER', 'MALE', '001095000020', 'Việt Nam', 'ACTIVE', '2026-08-01 16:45:00'),
(21, 'Đỗ Quốc Bảo', 'partner_haidilao@hotpot.vn', '0906000021', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER', 'MALE', '001096000021', 'Việt Nam', 'ACTIVE', '2026-07-30 08:30:00'),
-- Khách hàng mới trong tháng 7 và tháng 8/2026
(22, 'Lê Hoàng Yến', 'hoangyen@gmail.com', '0907000022', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'CUSTOMER', 'FEMALE', '001198000022', 'Việt Nam', 'ACTIVE', '2026-07-15 10:00:00'),
(23, 'Trịnh Quốc Thái', 'quocthai@gmail.com', '0907000023', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'CUSTOMER', 'MALE', '001098000023', 'Việt Nam', 'ACTIVE', '2026-07-25 14:20:00'),
(24, 'Ngô Gia Huy', 'giahuy@gmail.com', '0907000024', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'CUSTOMER', 'MALE', '001098000024', 'Việt Nam', 'ACTIVE', '2026-08-04 09:30:00'),
(25, 'Vương Thúy Kiều', 'thuykieu@gmail.com', '0907000025', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'CUSTOMER', 'FEMALE', '001198000025', 'Việt Nam', 'ACTIVE', '2026-08-08 11:15:00'),
(26, 'Phan Hải Đăng', 'haidang@gmail.com', '0907000026', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'CUSTOMER', 'MALE', '001098000026', 'Việt Nam', 'ACTIVE', '2026-08-10 08:30:00'),
(27, 'Lâm Bích Ngọc', 'bichngoc@gmail.com', '0907000027', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'CUSTOMER', 'FEMALE', '001198000027', 'Việt Nam', 'ACTIVE', '2026-08-11 15:45:00'),
(28, 'Dương Minh Khang', 'minhkhang@gmail.com', '0907000028', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'CUSTOMER', 'MALE', '001098000028', 'Việt Nam', 'ACTIVE', '2026-08-12 08:15:00'),
(29, 'Tạ Thanh Thảo', 'thanhthao@gmail.com', '0907000029', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'CUSTOMER', 'FEMALE', '001198000029', 'Việt Nam', 'ACTIVE', '2026-08-12 11:30:00'),
(30, 'Cao Tuấn Anh', 'tuananh@gmail.com', '0907000030', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'CUSTOMER', 'MALE', '001098000030', 'Việt Nam', 'ACTIVE', '2026-08-12 16:45:00'),
-- Đối tác bổ sung mới
(31, 'Lâm Thị Mỹ Hạnh', 'partner_phuclong@tea.vn', '0908000031', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER', 'FEMALE', '001198000031', 'Việt Nam', 'ACTIVE', '2026-08-05 09:15:00'),
(32, 'Trần Gia Bảo', 'partner_shopeefood@food.vn', '0908000032', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER', 'MALE', '001098000032', 'Việt Nam', 'ACTIVE', '2026-08-06 10:30:00'),
(33, 'Vũ Hải Nam', 'partner_uniqlo@fashion.vn', '0908000033', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER', 'MALE', '001098000033', 'Việt Nam', 'ACTIVE', '2026-08-07 14:00:00'),
-- Nhân viên đối tác mới chờ duyệt (PENDING)
(34, 'Phạm Minh Quân', 'employee_quan@voucher.vn', '0903000034', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER_EMPLOYEE', 'MALE', '001095000034', 'Việt Nam', 'ACTIVE', '2026-08-14 09:30:00'),
(35, 'Trần Ngọc Linh', 'employee_linh@voucher.vn', '0903000035', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER_EMPLOYEE', 'FEMALE', '001196000035', 'Việt Nam', 'ACTIVE', '2026-08-15 14:15:00'),
(36, 'Lê Quốc Bảo', 'employee_bao@voucher.vn', '0903000036', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER_EMPLOYEE', 'MALE', '001097000036', 'Việt Nam', 'ACTIVE', '2026-08-16 10:00:00');

-- 2. Insert partners (17 rows: 12 ACTIVE, 5 INACTIVE)
INSERT INTO partners (user_id, business_name, tax_code, activity_status, registered_at, business_license_no, license_issue_date, license_issue_place, brand_logo) VALUES
-- Đối tác hoạt động (ACTIVE)
(3, 'Công ty TNHH Ẩm Thực Việt', '0101234567', 'ACTIVE', '2026-01-02 09:05:00', '0101234567-001', '2020-05-10', 'Sở KH&ĐT TP. Hà Nội', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&auto=format&fit=crop&q=80'),
(4, 'Công ty Cổ phần Thẩm mỹ Spa Hương Sen', '0107654321', 'ACTIVE', '2026-01-02 09:35:00', '0107654321-001', '2021-08-15', 'Sở KH&ĐT TP. Hà Nội', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&auto=format&fit=crop&q=80'),
(5, 'Công ty Du lịch & Khách sạn Biển Bạc', '0109998887', 'ACTIVE', '2026-01-02 10:05:00', '0109998887-001', '2019-11-20', 'Sở KH&ĐT TP. Hồ Chí Minh', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&auto=format&fit=crop&q=80'),
(11, 'Công ty TNHH Dịch vụ Spa Sen Vàng', '0102123456', 'ACTIVE', '2026-08-01 14:30:00', '0102123456-001', '2022-03-15', 'Sở KH&ĐT TP. Hà Nội', 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&auto=format&fit=crop&q=80'),
(13, 'Công ty Cổ phần DV Cà Phê Cao Nguyên (Highlands)', '0303725714', 'ACTIVE', '2026-07-28 10:20:00', '0303725714-001', '2020-01-18', 'Sở KH&ĐT TP. Hồ Chí Minh', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&auto=format&fit=crop&q=80'),
(14, 'Công ty TNHH CJ CGV Việt Nam', '0303675394', 'ACTIVE', '2026-07-25 11:00:00', '0303675394-001', '2018-09-05', 'Sở KH&ĐT TP. Hồ Chí Minh', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80'),
(15, 'Công ty Cổ phần Trà sữa TocoToco', '0106789012', 'ACTIVE', '2026-08-02 16:15:00', '0106789012-001', '2023-02-20', 'Sở KH&ĐT TP. Hà Nội', 'https://images.unsplash.com/photo-1558857563-b37cf0c793ff?w=400&auto=format&fit=crop&q=80'),
(16, 'Công ty TNHH Golden Gate Restaurant Group', '0102721191', 'ACTIVE', '2026-08-04 09:00:00', '0102721191-001', '2021-04-10', 'Sở KH&ĐT TP. Hà Nội', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=80'),
(17, 'Công ty Cổ phần Thương mại Dịch vụ California Fitness & Yoga', '0305123987', 'ACTIVE', '2026-08-04 10:30:00', '0305123987-001', '2020-08-20', 'Sở KH&ĐT TP. Hồ Chí Minh', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=80'),
(20, 'Công ty Cổ phần Đầu tư Du lịch Mường Thanh', '0101998877', 'ACTIVE', '2026-08-01 16:45:00', '0101998877-001', '2019-09-01', 'Sở KH&ĐT Tỉnh Nghệ An', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&auto=format&fit=crop&q=80'),
(31, 'Công ty Cổ phần Phúc Long Heritage', '0302789123', 'ACTIVE', '2026-08-05 09:15:00', '0302789123-001', '2021-03-10', 'Sở KH&ĐT TP. Hồ Chí Minh', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80'),
(32, 'Công ty Cổ phần Foody Việt Nam (ShopeeFood)', '0314567890', 'ACTIVE', '2026-08-06 10:30:00', '0314567890-001', '2019-12-05', 'Sở KH&ĐT TP. Hồ Chí Minh', 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=400&auto=format&fit=crop&q=80'),
-- Đối tác chưa kích hoạt / Đang chờ duyệt (INACTIVE)
(18, 'Hộ Kinh Doanh Chuỗi Cafe The Coffee House', '0312345678', 'INACTIVE', '2026-08-03 14:15:00', '0312345678-001', '2022-11-15', 'Sở KH&ĐT TP. Hồ Chí Minh', 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&auto=format&fit=crop&q=80'),
(19, 'Công ty TNHH Thẩm Mỹ Viện Quốc Tế Seoul Center', '0108889999', 'INACTIVE', '2026-08-02 11:20:00', '0108889999-001', '2023-05-12', 'Sở KH&ĐT TP. Hà Nội', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&auto=format&fit=crop&q=80'),
(33, 'Công ty TNHH Uniqlo Việt Nam', '0315678901', 'INACTIVE', '2026-08-07 14:00:00', '0315678901-001', '2023-08-01', 'Sở KH&ĐT TP. Hồ Chí Minh', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&auto=format&fit=crop&q=80'),
(21, 'Công ty TNHH Lẩu Nướng Haidilao Việt Nam', '0315897462', 'INACTIVE', '2026-07-30 08:30:00', '0315897462-001', '2022-07-15', 'Sở KH&ĐT TP. Hồ Chí Minh', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&auto=format&fit=crop&q=80'),
(12, 'Công ty Cổ phần Nhà hàng Hải Sản X', '0103456789', 'INACTIVE', '2026-07-31 09:15:00', '0103456789-001', '2021-06-10', 'Sở KH&ĐT TP. Hồ Chí Minh', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&auto=format&fit=crop&q=80');

-- 2a. Insert partner_approval_requests (17 rows: 12 APPROVED, 4 PENDING, 1 REJECTED)
INSERT INTO partner_approval_requests (approval_request_id, partner_id, admin_id, submitted_at, reviewed_at, approval_status, admin_feedback) VALUES
-- Đối tác đã duyệt (APPROVED)
(1, 3, 1, '2026-01-02 09:05:00', '2026-01-02 10:00:00', 'APPROVED', 'Hồ sơ đầy đủ, hợp lệ.'),
(2, 4, 1, '2026-01-02 09:35:00', '2026-01-02 10:30:00', 'APPROVED', 'Hồ sơ đầy đủ, hợp lệ.'),
(3, 5, 1, '2026-01-02 10:05:00', '2026-01-02 11:00:00', 'APPROVED', 'Hồ sơ đầy đủ, hợp lệ.'),
(4, 11, 1, '2026-08-01 14:30:00', '2026-08-01 15:30:00', 'APPROVED', 'Hồ sơ đối tác đã duyệt.'),
(5, 13, 1, '2026-07-28 10:20:00', '2026-07-28 11:00:00', 'APPROVED', 'Hồ sơ đối tác đã duyệt.'),
(6, 14, 1, '2026-07-25 11:00:00', '2026-07-25 11:30:00', 'APPROVED', 'Hồ sơ đối tác đã duyệt.'),
(7, 15, 1, '2026-08-02 16:15:00', '2026-08-02 17:00:00', 'APPROVED', 'Hồ sơ đối tác đã duyệt.'),
(8, 16, 1, '2026-08-04 09:00:00', '2026-08-04 09:45:00', 'APPROVED', 'Hồ sơ đối tác đã duyệt.'),
(9, 17, 1, '2026-08-04 10:30:00', '2026-08-04 11:15:00', 'APPROVED', 'Hồ sơ đối tác đã duyệt.'),
(10, 20, 1, '2026-08-01 16:45:00', '2026-08-01 17:30:00', 'APPROVED', 'Hồ sơ đối tác đã duyệt.'),
(11, 31, 1, '2026-08-05 09:15:00', '2026-08-05 10:00:00', 'APPROVED', 'Hồ sơ đối tác đã duyệt.'),
(12, 32, 1, '2026-08-06 10:30:00', '2026-08-06 11:15:00', 'APPROVED', 'Hồ sơ đối tác đã duyệt.'),
-- Đối tác chờ duyệt (PENDING)
(13, 18, NULL, '2026-08-03 14:15:00', NULL, 'PENDING', NULL),
(14, 19, NULL, '2026-08-02 11:20:00', NULL, 'PENDING', NULL),
(15, 33, NULL, '2026-08-07 14:00:00', NULL, 'PENDING', NULL),
(16, 21, NULL, '2026-07-30 08:30:00', NULL, 'PENDING', NULL),
-- Đối tác bị từ chối (REJECTED)
(17, 12, 1, '2026-07-31 09:15:00', '2026-07-31 10:00:00', 'REJECTED', 'Hồ sơ không đầy đủ thông tin pháp lý.');

-- 3. Insert categories (4 rows)
INSERT INTO categories (category_id, category_name, description, status) VALUES
(1, 'Ẩm thực & Nhà hàng', 'Voucher giảm giá ăn uống tại nhà hàng, quán cafe', 'ACTIVE'),
(2, 'Làm đẹp & Spa', 'Dịch vụ chăm sóc sức khỏe, dịch vụ thư giãn spa', 'ACTIVE'),
(3, 'Du lịch & Khách sạn', 'Voucher nghỉ dưỡng khách sạn, tour du lịch', 'ACTIVE'),
(4, 'Giải trí & Sự kiện', 'Vé xem phim, khu vui chơi, nghe nhạc', 'ACTIVE');

-- 4. Insert branches (25 rows)
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
(13, 16, 'Manwah Hotpot - Vincom Center Landmark 81', '772 Điện Biên Phủ, Phường 22, Bình Thạnh, TP.HCM', 'Miền Nam', '02873007044', 'ACTIVE'),
(14, 16, 'Kichi Kichi - Vincom Bà Triệu', '191 Bà Triệu, Lê Đại Hành, Hai Bà Trưng, Hà Nội', 'Miền Bắc', '02473007338', 'ACTIVE'),
(15, 17, 'California Fitness - Pearl Plaza', '561A Điện Biên Phủ, Phường 25, Bình Thạnh, TP.HCM', 'Miền Nam', '02871097889', 'ACTIVE'),
(16, 18, 'The Coffee House - Cao Thắng', '86 Cao Thắng, Phường 4, Quận 3, TP.HCM', 'Miền Nam', '02871087088', 'ACTIVE'),
(17, 18, 'The Coffee House - Thái Hà', '56 Thái Hà, Đống Đa, Hà Nội', 'Miền Bắc', '02471087088', 'ACTIVE'),
(18, 19, 'Seoul Center - Chi nhánh Cách Mạng Tháng 8', '375 Nguyễn Thượng Hiền, Phường 11, Quận 10, TP.HCM', 'Miền Nam', '1800088878', 'ACTIVE'),
(19, 20, 'Mường Thanh Luxury Đà Nẵng', '270 Võ Nguyên Giáp, Bắc Mỹ Phú, Ngũ Hành Sơn, Đà Nẵng', 'Miền Trung', '02363956789', 'ACTIVE'),
(20, 21, 'Haidilao Hotpot - Bitexco Financial Tower', 'Tầng 2 Bitexco, 2 Hải Triều, Bến Nghé, Quận 1, TP.HCM', 'Miền Nam', '02822539156', 'ACTIVE'),
(21, 31, 'Phúc Long Coffee & Tea - Chi nhánh Hàm Nghi', '29 Ngô Đức Kế, Bến Nghé, Quận 1, TP.HCM', 'Miền Nam', '02838218181', 'ACTIVE'),
(22, 31, 'Phúc Long Coffee & Tea - Chi nhánh Nhà Thờ', '23 Nhà Thờ, Hàng Trống, Hoàn Kiếm, Hà Nội', 'Miền Bắc', '02438289898', 'ACTIVE'),
(23, 32, 'ShopeeFood Trung Tâm Vận Hành', 'Tầng 12 Saigon Centre, 65 Lê Lợi, Quận 1, TP.HCM', 'Miền Nam', '19002042', 'ACTIVE'),
(24, 33, 'Uniqlo Đồng Khởi', 'Vincom Center Đồng Khởi, 72 Lê Thánh Tôn, Quận 1, TP.HCM', 'Miền Nam', '02838279999', 'ACTIVE'),
(25, 33, 'Uniqlo Vincom Phạm Ngọc Thạch', '02 Phạm Ngọc Thạch, Trung Tự, Đống Đa, Hà Nội', 'Miền Bắc', '02438278888', 'ACTIVE');

-- 5. Insert partner_employees (5 rows)
INSERT INTO partner_employees (user_id, branch_id) VALUES
(6, 1),
(7, 3),
(34, 1),
(35, 3),
(36, 5);

-- 5a. Insert partner_employee_approval_requests (5 rows)
INSERT INTO partner_employee_approval_requests (approval_request_id, user_id, admin_id, submitted_at, reviewed_at, approval_status, admin_feedback) VALUES
(1, 6, 1, '2026-01-03 10:30:00', '2026-01-03 11:00:00', 'APPROVED', NULL),
(2, 7, 1, '2026-01-03 11:00:00', '2026-01-03 11:30:00', 'APPROVED', NULL),
(3, 34, NULL, '2026-08-14 09:30:00', NULL, 'PENDING', NULL),
(4, 35, NULL, '2026-08-15 14:15:00', NULL, 'PENDING', NULL),
(5, 36, NULL, '2026-08-16 10:00:00', NULL, 'PENDING', NULL);

-- 6. Insert voucher_programs (18 rows đa dạng danh mục)
INSERT INTO voucher_programs (program_id, partner_id, category_id, program_name, original_price, sale_price, issue_quantity, sale_start_at, sale_end_at, use_start_at, use_end_at, display_status) VALUES
-- Programs đã PUBLISHED (Đang bán)
(1, 3, 1, 'Buffet Lẩu Nướng Cao Cấp Giảm 30%', 100000.00, 70000.00, 500, '2026-01-05 00:00:00', '2026-12-31 23:59:59', '2026-01-05 00:00:00', '2027-01-05 23:59:59', 'PUBLISHED'),
(2, 3, 1, 'Voucher Ăn Trưa 500k Giảm Còn 350k', 500000.00, 350000.00, 200, '2026-01-05 00:00:00', '2026-12-31 23:59:59', '2026-01-05 00:00:00', '2027-01-05 23:59:59', 'PUBLISHED'),
(3, 4, 2, 'Liệu Trình Spa Thảo Dược 60 Phút', 200000.00, 150000.00, 100, '2026-01-06 00:00:00', '2026-12-31 23:59:59', '2026-01-06 00:00:00', '2027-01-06 23:59:59', 'PUBLISHED'),
(5, 5, 3, 'Voucher Phòng Deluxe 2N1Đ Biển Bạc Nha Trang', 1500000.00, 1000000.00, 50, '2026-01-07 00:00:00', '2026-12-31 23:59:59', '2026-01-07 00:00:00', '2027-01-07 23:59:59', 'PUBLISHED'),
(6, 13, 1, 'Voucher 50.000đ Highlands Coffee Toàn Quốc', 50000.00, 35000.00, 5000, '2026-07-01 00:00:00', '2026-12-31 23:59:59', '2026-07-01 00:00:00', '2027-01-31 23:59:59', 'PUBLISHED'),
(8, 14, 4, 'Vé Xem Phim 2D Cuối Tuần CGV Cinemas Kèm Bắp Nước', 120000.00, 79000.00, 3000, '2026-07-01 00:00:00', '2026-12-31 23:59:59', '2026-07-01 00:00:00', '2027-01-31 23:59:59', 'PUBLISHED'),
(10, 15, 1, 'Trà Sữa Trân Châu Đường Đen TocoToco Giảm 40%', 60000.00, 36000.00, 2000, '2026-07-15 00:00:00', '2026-12-31 23:59:59', '2026-07-15 00:00:00', '2027-01-05 23:59:59', 'PUBLISHED'),
(14, 3, 1, 'Flash Sale Trưa: Cơm Tấm Sườn Bì Chả Đặc Biệt', 80000.00, 45000.00, 500, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-01-01 00:00:00', '2027-01-01 23:59:59', 'PUBLISHED'),
(16, 16, 1, 'Buffet Lẩu Đài Loan Manwah Hotpot Thượng Hạng', 399000.00, 289000.00, 1000, '2026-08-01 00:00:00', '2026-12-31 23:59:59', '2026-08-01 00:00:00', '2027-01-31 23:59:59', 'PUBLISHED'),
(17, 17, 2, 'Gói Hội Viên Tập Gym Yoga 1 Tháng Tại California Fitness', 600000.00, 450000.00, 800, '2026-08-01 00:00:00', '2026-12-31 23:59:59', '2026-08-01 00:00:00', '2027-01-31 23:59:59', 'PUBLISHED'),
(18, 20, 3, 'Combo Nghỉ Dưỡng 3N2Đ Khách Sạn Mường Thanh Đà Nẵng', 2500000.00, 1850000.00, 300, '2026-08-01 00:00:00', '2026-12-31 23:59:59', '2026-08-01 00:00:00', '2027-01-31 23:59:59', 'PUBLISHED'),

-- Programs PENDING (Chờ duyệt)
(4, 4, 2, 'Gói Chăm Sóc Da Mặt Chuyên Sâu Tái Tạo', 300000.00, 200000.00, 150, '2026-08-01 00:00:00', '2026-12-31 23:59:59', '2026-08-01 00:00:00', '2027-01-06 23:59:59', 'DRAFT'),
(7, 3, 1, 'Buffet Lẩu Băng Chuyền Kichi Kichi Ưu Đãi 20%', 350000.00, 280000.00, 1200, '2026-08-10 00:00:00', '2026-11-30 23:59:59', '2026-08-10 00:00:00', '2026-12-15 23:59:59', 'DRAFT'),
(9, 11, 2, 'Chiến dịch ưu đãi sai quy định (Cảnh báo sai giá bán)', 100000.00, 120000.00, 500, '2026-08-01 00:00:00', '2026-10-31 23:59:59', '2026-08-01 00:00:00', '2026-11-30 23:59:59', 'DRAFT'),

-- Programs Quản lý: HIDDEN & ENDED
(11, 15, 1, 'Voucher Ưu Đãi Trà Sữa Tocotoco Mua 1 Tặng 1', 60000.00, 42000.00, 1500, '2026-07-15 00:00:00', '2026-12-31 23:59:59', '2026-07-15 00:00:00', '2027-01-15 23:59:59', 'HIDDEN'),
(12, 14, 4, 'Vé Xem Phim Bom Tấn IMAX Suất Chiếu Đặc Biệt', 150000.00, 99000.00, 500, '2026-07-01 00:00:00', '2026-12-31 23:59:59', '2026-07-01 00:00:00', '2027-01-01 23:59:59', 'HIDDEN'),
(13, 5, 4, 'Chiến dịch Mùa Hè Rực Rỡ - Giảm 50% Vé Công Viên Nước', 200000.00, 100000.00, 800, '2026-05-01 00:00:00', '2026-07-31 23:59:59', '2026-05-01 00:00:00', '2026-08-31 23:59:59', 'ENDED'),
(15, 3, 1, 'Set Menu Tiệc Tất Niên Gia Đình Ấm Cúng 2025', 1200000.00, 850000.00, 100, '2025-01-01 00:00:00', '2025-02-15 23:59:59', '2025-01-01 00:00:00', '2025-02-28 23:59:59', 'PUBLISHED');

-- 6a. Insert voucher_program_images (24 rows)
INSERT INTO voucher_program_images (image_id, program_id, image_url, is_primary, sort_order) VALUES
(1, 1, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80', TRUE, 0),
(2, 1, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&auto=format&fit=crop&q=80', FALSE, 1),
(3, 2, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&auto=format&fit=crop&q=80', TRUE, 0),
(4, 3, 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=1200&auto=format&fit=crop&q=80', TRUE, 0),
(5, 3, 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=1200&auto=format&fit=crop&q=80', FALSE, 1),
(6, 4, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&auto=format&fit=crop&q=80', TRUE, 0),
(7, 5, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&auto=format&fit=crop&q=80', TRUE, 0),
(8, 5, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&auto=format&fit=crop&q=80', FALSE, 1),
(9, 6, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1200&auto=format&fit=crop&q=80', TRUE, 0),
(10, 7, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200&auto=format&fit=crop&q=80', TRUE, 0),
(11, 8, 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=1200&auto=format&fit=crop&q=80', TRUE, 0),
(12, 8, 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80', FALSE, 1),
(13, 9, 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&auto=format&fit=crop&q=80', TRUE, 0),
(14, 10, 'https://images.unsplash.com/photo-1558857563-b37cf0c793ff?w=1200&auto=format&fit=crop&q=80', TRUE, 0),
(15, 11, 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=1200&auto=format&fit=crop&q=80', TRUE, 0),
(16, 12, 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&auto=format&fit=crop&q=80', TRUE, 0),
(17, 13, 'https://images.unsplash.com/photo-1582650625119-3a31f841807d?w=1200&auto=format&fit=crop&q=80', TRUE, 0),
(18, 14, 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=1200&auto=format&fit=crop&q=80', TRUE, 0),
(19, 15, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80', TRUE, 0),
(20, 16, 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=1200&auto=format&fit=crop&q=80', TRUE, 0),
(21, 16, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80', FALSE, 1),
(22, 17, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80', TRUE, 0),
(23, 18, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80', TRUE, 0),
(24, 18, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&auto=format&fit=crop&q=80', FALSE, 1);

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
(15, 1), (15, 2),
(16, 13), (16, 14),
(17, 15),
(18, 19);

-- 8. Insert voucher_approval_requests
INSERT INTO voucher_approval_requests (approval_request_id, program_id, admin_id, submitted_at, reviewed_at, approval_status, admin_feedback) VALUES
(1, 1, 1, '2026-01-04 10:00:00', '2026-01-04 11:00:00', 'APPROVED', 'Chương trình đáp ứng đủ điều kiện.'),
(2, 2, 1, '2026-01-04 10:30:00', '2026-01-04 11:30:00', 'APPROVED', 'Duyệt chương trình ăn trưa.'),
(3, 3, 1, '2026-01-05 09:00:00', '2026-01-05 10:00:00', 'APPROVED', 'Chương trình Spa hợp lệ.'),
(5, 5, 1, '2026-01-06 08:00:00', '2026-01-06 09:00:00', 'APPROVED', 'Duyệt voucher khách sạn Nha Trang.'),
(6, 6, 1, '2026-07-01 08:00:00', '2026-07-01 09:00:00', 'APPROVED', 'Duyệt voucher Highlands Coffee.'),
(8, 8, 1, '2026-07-01 10:00:00', '2026-07-01 10:30:00', 'APPROVED', 'Duyệt vé xem phim CGV.'),
(10, 10, 1, '2026-07-15 09:00:00', '2026-07-15 09:30:00', 'APPROVED', 'Duyệt trà sữa TocoToco.'),
(16, 16, 1, '2026-08-01 08:30:00', '2026-08-01 09:00:00', 'APPROVED', 'Duyệt Buffet Manwah.'),
(17, 17, 1, '2026-08-01 10:00:00', '2026-08-01 10:30:00', 'APPROVED', 'Duyệt thẻ tập California.'),
(18, 18, 1, '2026-08-01 14:00:00', '2026-08-01 14:30:00', 'APPROVED', 'Duyệt combo Mường Thanh Đà Nẵng.'),
-- Yêu cầu PENDING
(4, 4, NULL, '2026-08-01 09:30:00', NULL, 'PENDING', NULL),
(7, 7, NULL, '2026-08-02 09:15:00', NULL, 'PENDING', NULL),
(9, 9, NULL, '2026-08-01 16:45:00', NULL, 'PENDING', NULL);

-- 9. Insert cart_items (4 rows)
INSERT INTO cart_items (cart_item_id, customer_id, program_id, quantity) VALUES
(1, 8, 3, 1),
(2, 8, 5, 2),
(3, 9, 1, 3),
(4, 10, 2, 1);

-- 10. Insert orders (25 rows phong phú trải đều từ tháng 1 đến ngày hôm nay 12/08/2026)
INSERT INTO orders (order_id, buyer_user_id, recipient_user_id, created_at, total_amount, payment_method, payment_status, order_status) VALUES
-- Tháng 1/2026
(1, 8, NULL, '2026-01-10 10:00:00', 140000.00, 'VNPAY', 'PAID', 'COMPLETED'),
(2, 8, 9, '2026-01-11 11:00:00', 350000.00, 'MOMO', 'PAID', 'COMPLETED'),
(3, 9, NULL, '2026-01-12 14:00:00', 300000.00, 'CREDIT_CARD', 'PAID', 'COMPLETED'),
(4, 10, NULL, '2026-01-13 16:00:00', 100000.00, 'BANK_TRANSFER', 'REFUNDED', 'CANCELLED'),
(5, 8, NULL, '2026-01-14 12:00:00', 225000.00, 'MOMO', 'PAID', 'COMPLETED'),
-- Tháng 7/2026 (Kỳ trước của Tháng này)
(6, 22, NULL, '2026-07-16 10:30:00', 700000.00, 'VNPAY', 'PAID', 'COMPLETED'),
(7, 23, NULL, '2026-07-20 14:15:00', 450000.00, 'MOMO', 'PAID', 'COMPLETED'),
(8, 22, 23, '2026-07-28 16:45:00', 158000.00, 'CREDIT_CARD', 'PAID', 'COMPLETED'),
(9, 23, NULL, '2026-07-30 19:20:00', 1000000.00, 'VNPAY', 'PAID', 'COMPLETED'),
-- Tuần trước (03/08 - 09/08/2026)
(10, 24, NULL, '2026-08-04 10:00:00', 578000.00, 'MOMO', 'PAID', 'COMPLETED'),
(11, 24, NULL, '2026-08-05 12:30:00', 105000.00, 'VNPAY', 'PAID', 'COMPLETED'),
(12, 25, NULL, '2026-08-07 15:45:00', 300000.00, 'CREDIT_CARD', 'PAID', 'COMPLETED'),
(13, 25, 24, '2026-08-08 19:00:00', 237000.00, 'MOMO', 'PAID', 'COMPLETED'),
(14, 25, NULL, '2026-08-09 11:20:00', 1850000.00, 'BANK_TRANSFER', 'PAID', 'COMPLETED'),
-- Tuần này (10/08 - 11/08/2026)
(15, 26, NULL, '2026-08-10 09:15:00', 140000.00, 'VNPAY', 'PAID', 'COMPLETED'),
(16, 26, NULL, '2026-08-10 18:30:00', 867000.00, 'MOMO', 'PAID', 'COMPLETED'),
(17, 27, NULL, '2026-08-11 10:00:00', 450000.00, 'CREDIT_CARD', 'PAID', 'COMPLETED'),
(18, 27, NULL, '2026-08-11 14:20:00', 158000.00, 'VNPAY', 'PAID', 'COMPLETED'),
(19, 27, 26, '2026-08-11 20:00:00', 700000.00, 'MOMO', 'PAID', 'COMPLETED'),
-- Hôm nay (12/08/2026)
(20, 28, NULL, '2026-08-12 02:30:00', 158000.00, 'MOMO', 'PAID', 'COMPLETED'),
(21, 28, NULL, '2026-08-12 07:45:00', 140000.00, 'VNPAY', 'PAID', 'COMPLETED'),
(22, 29, NULL, '2026-08-12 10:15:00', 578000.00, 'CREDIT_CARD', 'PAID', 'COMPLETED'),
(23, 29, NULL, '2026-08-12 13:00:00', 300000.00, 'VNPAY', 'PAID', 'COMPLETED'),
(24, 30, NULL, '2026-08-12 16:30:00', 108000.00, 'MOMO', 'PAID', 'COMPLETED'),
(25, 30, 28, '2026-08-12 19:15:00', 1850000.00, 'BANK_TRANSFER', 'PAID', 'COMPLETED');

-- 11. Insert order_items (27 rows tương ứng các orders)
INSERT INTO order_items (order_item_id, order_id, program_id, quantity, unit_price) VALUES
(1, 1, 1, 2, 70000.00),
(2, 2, 2, 1, 350000.00),
(3, 3, 3, 2, 150000.00),
(4, 4, 5, 1, 100000.00),
(5, 5, 14, 5, 45000.00),
(6, 6, 2, 2, 350000.00),
(7, 7, 17, 1, 450000.00),
(8, 8, 8, 2, 79000.00),
(9, 9, 13, 10, 100000.00),
(10, 10, 16, 2, 289000.00),
(11, 11, 6, 3, 35000.00),
(12, 12, 3, 2, 150000.00),
(13, 13, 8, 3, 79000.00),
(14, 14, 18, 1, 1850000.00),
(15, 15, 6, 4, 35000.00),
(16, 16, 16, 3, 289000.00),
(17, 17, 17, 1, 450000.00),
(18, 18, 8, 2, 79000.00),
(19, 19, 2, 2, 350000.00),
(20, 20, 8, 2, 79000.00),
(21, 21, 6, 4, 35000.00),
(22, 22, 16, 2, 289000.00),
(23, 23, 3, 2, 150000.00),
(24, 24, 10, 3, 36000.00),
(25, 25, 18, 1, 1850000.00);

-- 12. Insert issued_vouchers (45 rows với tỷ lệ quy đổi thực tế ~88%)
INSERT INTO issued_vouchers (issued_voucher_id, program_id, order_item_id, owner_user_id, voucher_code, qr_code, usage_status, issued_at, expires_at, applicable_region, used_at, discount_amount) VALUES
-- Tháng 1
(1, 1, 1, 8, 'VCH-FB-0001', 'https://qr.voucher.vn/VCH-FB-0001', 'USED', '2026-01-10 10:01:00', '2027-01-05 23:59:59', 'Miền Nam', '2026-01-15 12:30:00', 30000.00),
(2, 1, 1, 8, 'VCH-FB-0002', 'https://qr.voucher.vn/VCH-FB-0002', 'USED', '2026-01-10 10:01:00', '2027-01-05 23:59:59', 'Miền Nam', '2026-01-18 19:30:00', 30000.00),
(3, 2, 2, 9, 'VCH-FB-0003', 'https://qr.voucher.vn/VCH-FB-0003', 'USED', '2026-01-11 11:01:00', '2027-01-05 23:59:59', 'Miền Nam', '2026-01-20 12:00:00', 150000.00),
(4, 3, 3, 9, 'VCH-SPA-0001', 'https://qr.voucher.vn/VCH-SPA-0001', 'USED', '2026-01-12 14:01:00', '2027-01-06 23:59:59', 'Miền Bắc', '2026-01-25 15:00:00', 50000.00),
(5, 3, 3, 9, 'VCH-SPA-0002', 'https://qr.voucher.vn/VCH-SPA-0002', 'UNUSED', '2026-01-12 14:01:00', '2027-01-06 23:59:59', 'Miền Bắc', NULL, 50000.00),
(6, 5, 4, 10, 'VCH-TVL-0001', 'https://qr.voucher.vn/VCH-TVL-0001', 'CANCELLED', '2026-01-13 16:01:00', '2027-01-07 23:59:59', 'Miền Trung', NULL, 500000.00),
(7, 14, 5, 8, 'VCH-FS-0001', 'https://qr.voucher.vn/VCH-FS-0001', 'USED', '2026-01-14 12:01:00', '2027-01-01 23:59:59', 'Miền Nam', '2026-01-14 12:45:00', 35000.00),
(8, 14, 5, 8, 'VCH-FS-0002', 'https://qr.voucher.vn/VCH-FS-0002', 'USED', '2026-01-14 12:01:00', '2027-01-01 23:59:59', 'Miền Nam', '2026-01-15 13:00:00', 35000.00),
(9, 14, 5, 8, 'VCH-FS-0003', 'https://qr.voucher.vn/VCH-FS-0003', 'USED', '2026-01-14 12:01:00', '2027-01-01 23:59:59', 'Miền Nam', '2026-01-16 12:15:00', 35000.00),
(10, 14, 5, 8, 'VCH-FS-0004', 'https://qr.voucher.vn/VCH-FS-0004', 'UNUSED', '2026-01-14 12:01:00', '2027-01-01 23:59:59', 'Miền Nam', NULL, 35000.00),
(11, 14, 5, 8, 'VCH-FS-0005', 'https://qr.voucher.vn/VCH-FS-0005', 'UNUSED', '2026-01-14 12:01:00', '2027-01-01 23:59:59', 'Miền Nam', NULL, 35000.00),

-- Tháng 7
(12, 2, 6, 22, 'VCH-FB-0701', 'https://qr.voucher.vn/VCH-FB-0701', 'USED', '2026-07-16 10:31:00', '2027-01-05 23:59:59', 'Miền Nam', '2026-07-18 12:00:00', 150000.00),
(13, 2, 6, 22, 'VCH-FB-0702', 'https://qr.voucher.vn/VCH-FB-0702', 'USED', '2026-07-16 10:31:00', '2027-01-05 23:59:59', 'Miền Nam', '2026-07-22 19:00:00', 150000.00),
(14, 17, 7, 23, 'VCH-GYM-0701', 'https://qr.voucher.vn/VCH-GYM-0701', 'USED', '2026-07-20 14:16:00', '2027-01-31 23:59:59', 'Miền Nam', '2026-07-25 09:00:00', 150000.00),
(15, 8, 8, 23, 'VCH-CGV-0701', 'https://qr.voucher.vn/VCH-CGV-0701', 'USED', '2026-07-28 16:46:00', '2027-01-31 23:59:59', 'Miền Nam', '2026-07-29 20:30:00', 41000.00),
(16, 8, 8, 23, 'VCH-CGV-0702', 'https://qr.voucher.vn/VCH-CGV-0702', 'USED', '2026-07-28 16:46:00', '2027-01-31 23:59:59', 'Miền Nam', '2026-07-30 18:45:00', 41000.00),
(17, 13, 9, 23, 'VCH-SUM-0701', 'https://qr.voucher.vn/VCH-SUM-0701', 'USED', '2026-07-30 19:21:00', '2027-01-07 23:59:59', 'Miền Trung', '2026-08-02 14:00:00', 100000.00),

-- Tuần trước (03/08 - 09/08)
(18, 16, 10, 24, 'VCH-MAN-0801', 'https://qr.voucher.vn/VCH-MAN-0801', 'USED', '2026-08-04 10:01:00', '2027-01-31 23:59:59', 'Miền Nam', '2026-08-05 19:00:00', 110000.00),
(19, 16, 10, 24, 'VCH-MAN-0802', 'https://qr.voucher.vn/VCH-MAN-0802', 'USED', '2026-08-04 10:01:00', '2027-01-31 23:59:59', 'Miền Nam', '2026-08-06 20:00:00', 110000.00),
(20, 6, 11, 24, 'VCH-HL-0801', 'https://qr.voucher.vn/VCH-HL-0801', 'USED', '2026-08-05 12:31:00', '2027-01-31 23:59:59', 'Miền Nam', '2026-08-05 14:00:00', 15000.00),
(21, 6, 11, 24, 'VCH-HL-0802', 'https://qr.voucher.vn/VCH-HL-0802', 'USED', '2026-08-05 12:31:00', '2027-01-31 23:59:59', 'Miền Nam', '2026-08-06 08:30:00', 15000.00),
(22, 6, 11, 24, 'VCH-HL-0803', 'https://qr.voucher.vn/VCH-HL-0803', 'UNUSED', '2026-08-05 12:31:00', '2027-01-31 23:59:59', 'Miền Nam', NULL, 15000.00),
(23, 3, 12, 25, 'VCH-SPA-0801', 'https://qr.voucher.vn/VCH-SPA-0801', 'USED', '2026-08-07 15:46:00', '2027-01-06 23:59:59', 'Miền Bắc', '2026-08-08 10:00:00', 50000.00),
(24, 3, 12, 25, 'VCH-SPA-0802', 'https://qr.voucher.vn/VCH-SPA-0802', 'USED', '2026-08-07 15:46:00', '2027-01-06 23:59:59', 'Miền Bắc', '2026-08-09 14:00:00', 50000.00),
(25, 8, 13, 24, 'VCH-CGV-0801', 'https://qr.voucher.vn/VCH-CGV-0801', 'USED', '2026-08-08 19:01:00', '2027-01-31 23:59:59', 'Miền Nam', '2026-08-08 21:00:00', 41000.00),
(26, 8, 13, 24, 'VCH-CGV-0802', 'https://qr.voucher.vn/VCH-CGV-0802', 'USED', '2026-08-08 19:01:00', '2027-01-31 23:59:59', 'Miền Nam', '2026-08-08 21:00:00', 41000.00),
(27, 8, 13, 24, 'VCH-CGV-0803', 'https://qr.voucher.vn/VCH-CGV-0803', 'UNUSED', '2026-08-08 19:01:00', '2027-01-31 23:59:59', 'Miền Nam', NULL, 41000.00),
(28, 18, 14, 25, 'VCH-MT-0801', 'https://qr.voucher.vn/VCH-MT-0801', 'USED', '2026-08-09 11:21:00', '2027-01-31 23:59:59', 'Miền Trung', '2026-08-11 14:00:00', 650000.00),

-- Tuần này (10/08 - 11/08)
(29, 6, 15, 26, 'VCH-HL-0810A', 'https://qr.voucher.vn/VCH-HL-0810A', 'USED', '2026-08-10 09:16:00', '2027-01-05 23:59:59', 'Miền Nam', '2026-08-10 12:30:00', 30000.00),
(30, 6, 15, 26, 'VCH-HL-0810B', 'https://qr.voucher.vn/VCH-HL-0810B', 'USED', '2026-08-10 09:16:00', '2027-01-05 23:59:59', 'Miền Nam', '2026-08-10 19:45:00', 30000.00),
(31, 16, 16, 26, 'VCH-MAN-0810A', 'https://qr.voucher.vn/VCH-MAN-0810A', 'USED', '2026-08-10 18:31:00', '2027-01-31 23:59:59', 'Miền Nam', '2026-08-10 20:00:00', 110000.00),
(32, 16, 16, 26, 'VCH-MAN-0810B', 'https://qr.voucher.vn/VCH-MAN-0810B', 'USED', '2026-08-10 18:31:00', '2027-01-31 23:59:59', 'Miền Nam', '2026-08-11 12:15:00', 110000.00),
(33, 16, 16, 26, 'VCH-MAN-0810C', 'https://qr.voucher.vn/VCH-MAN-0810C', 'UNUSED', '2026-08-10 18:31:00', '2027-01-31 23:59:59', 'Miền Nam', NULL, 110000.00),
(34, 17, 17, 27, 'VCH-GYM-0811A', 'https://qr.voucher.vn/VCH-GYM-0811A', 'USED', '2026-08-11 10:01:00', '2027-01-31 23:59:59', 'Miền Nam', '2026-08-11 17:30:00', 150000.00),
(35, 8, 18, 27, 'VCH-CGV-0811A', 'https://qr.voucher.vn/VCH-CGV-0811A', 'USED', '2026-08-11 14:21:00', '2027-01-31 23:59:59', 'Miền Nam', '2026-08-11 20:00:00', 41000.00),
(36, 8, 18, 27, 'VCH-CGV-0811B', 'https://qr.voucher.vn/VCH-CGV-0811B', 'USED', '2026-08-11 14:21:00', '2027-01-31 23:59:59', 'Miền Nam', '2026-08-11 20:00:00', 41000.00),
(37, 2, 19, 26, 'VCH-FB-0811A', 'https://qr.voucher.vn/VCH-FB-0811A', 'USED', '2026-08-11 20:01:00', '2027-01-05 23:59:59', 'Miền Nam', '2026-08-12 12:00:00', 150000.00),
(38, 2, 19, 26, 'VCH-FB-0811B', 'https://qr.voucher.vn/VCH-FB-0811B', 'UNUSED', '2026-08-11 20:01:00', '2027-01-05 23:59:59', 'Miền Nam', NULL, 150000.00),

-- Hôm nay (12/08/2026)
(39, 8, 20, 28, 'VCH-CGV-0812A', 'https://qr.voucher.vn/VCH-CGV-0812A', 'USED', '2026-08-12 02:31:00', '2027-01-31 23:59:59', 'Miền Nam', '2026-08-12 10:00:00', 41000.00),
(40, 8, 20, 28, 'VCH-CGV-0812B', 'https://qr.voucher.vn/VCH-CGV-0812B', 'UNUSED', '2026-08-12 02:31:00', '2027-01-31 23:59:59', 'Miền Nam', NULL, 41000.00),
(41, 6, 21, 28, 'VCH-HL-0812A', 'https://qr.voucher.vn/VCH-HL-0812A', 'USED', '2026-08-12 07:46:00', '2027-01-31 23:59:59', 'Miền Nam', '2026-08-12 08:30:00', 15000.00),
(42, 6, 21, 28, 'VCH-HL-0812B', 'https://qr.voucher.vn/VCH-HL-0812B', 'USED', '2026-08-12 07:46:00', '2027-01-31 23:59:59', 'Miền Nam', '2026-08-12 11:45:00', 15000.00),
(43, 6, 21, 28, 'VCH-HL-0812C', 'https://qr.voucher.vn/VCH-HL-0812C', 'USED', '2026-08-12 07:46:00', '2027-01-31 23:59:59', 'Miền Nam', '2026-08-12 15:20:00', 15000.00),
(44, 6, 21, 28, 'VCH-HL-0812D', 'https://qr.voucher.vn/VCH-HL-0812D', 'UNUSED', '2026-08-12 07:46:00', '2027-01-31 23:59:59', 'Miền Nam', NULL, 15000.00),
(45, 16, 22, 29, 'VCH-MAN-0812A', 'https://qr.voucher.vn/VCH-MAN-0812A', 'USED', '2026-08-12 10:16:00', '2027-01-31 23:59:59', 'Miền Nam', '2026-08-12 12:30:00', 110000.00),
(46, 16, 22, 29, 'VCH-MAN-0812B', 'https://qr.voucher.vn/VCH-MAN-0812B', 'USED', '2026-08-12 10:16:00', '2027-01-31 23:59:59', 'Miền Nam', '2026-08-12 19:30:00', 110000.00),
(47, 3, 23, 29, 'VCH-SPA-0812A', 'https://qr.voucher.vn/VCH-SPA-0812A', 'USED', '2026-08-12 13:01:00', '2027-01-06 23:59:59', 'Miền Bắc', '2026-08-12 14:15:00', 50000.00),
(48, 3, 23, 29, 'VCH-SPA-0812B', 'https://qr.voucher.vn/VCH-SPA-0812B', 'UNUSED', '2026-08-12 13:01:00', '2027-01-06 23:59:59', 'Miền Bắc', NULL, 50000.00),
(49, 10, 24, 30, 'VCH-TC-0812A', 'https://qr.voucher.vn/VCH-TC-0812A', 'USED', '2026-08-12 16:31:00', '2027-01-05 23:59:59', 'Miền Nam', '2026-08-12 17:00:00', 24000.00),
(50, 10, 24, 30, 'VCH-TC-0812B', 'https://qr.voucher.vn/VCH-TC-0812B', 'USED', '2026-08-12 16:31:00', '2027-01-05 23:59:59', 'Miền Nam', '2026-08-12 18:30:00', 24000.00),
(51, 10, 24, 30, 'VCH-TC-0812C', 'https://qr.voucher.vn/VCH-TC-0812C', 'UNUSED', '2026-08-12 16:31:00', '2027-01-05 23:59:59', 'Miền Nam', NULL, 24000.00),
(52, 18, 25, 28, 'VCH-MT-0812A', 'https://qr.voucher.vn/VCH-MT-0812A', 'UNUSED', '2026-08-12 19:16:00', '2027-01-31 23:59:59', 'Miền Trung', NULL, 650000.00);

-- 13. Insert reviews_feedback (5 rows)
INSERT INTO reviews_feedback (review_id, issued_voucher_id, customer_id, rating, review_content, complaint_content, submitted_at) VALUES
(1, 1, 8, 5, 'Thức ăn rất ngon, phục vụ chu đáo tận tình!', NULL, '2026-01-15 14:00:00'),
(2, 2, 8, 4, 'Đã mua voucher thứ 2, dùng rất tiện lợi.', NULL, '2026-01-16 09:00:00'),
(3, 6, 10, 1, 'Hủy đơn hàng hoàn tiền chậm.', 'Đã quá 3 ngày chưa nhận lại tiền chuyển khoản.', '2026-01-14 10:00:00'),
(4, 18, 24, 5, 'Lẩu Manwah rất ngon, quét mã voucher nhanh gọn!', NULL, '2026-08-05 21:00:00'),
(5, 45, 29, 5, 'Dịch vụ tuyệt vời, giảm giá trực tiếp rất hời.', NULL, '2026-08-12 13:00:00');

-- 14. Insert order_cancellations (1 row)
INSERT INTO order_cancellations (cancellation_id, order_id, admin_id, requested_at, reason) VALUES
(1, 4, 1, '2026-01-13 16:30:00', 'Khách hàng đổi ý muốn chuyển sang mua gói khác.');

-- 15. Insert banners (3 rows)
INSERT INTO banners (banner_id, program_id, title, image_url, target_url, display_position, display_from, display_to, status) VALUES
(1, 1, 'Bùng Nổ Tiệc Buffet Giảm 30%', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1600&auto=format&fit=crop&q=80', 'https://voucher.vn/programs/1', 'HOME_TOP', '2026-01-05 00:00:00', '2026-12-31 23:59:59', 'ACTIVE'),
(2, 3, 'Thư Giãn Cùng Spa Hương Sen', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1600&auto=format&fit=crop&q=80', 'https://voucher.vn/programs/3', 'CATEGORY_HEADER', '2026-01-06 00:00:00', '2026-12-31 23:59:59', 'ACTIVE'),
(3, 5, 'Nghỉ Dưỡng Biển Nha Trang Giá Cực Tốt', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80', 'https://voucher.vn/programs/5', 'HOME_MIDDLE', '2026-01-07 00:00:00', '2026-12-31 23:59:59', 'ACTIVE');

-- 16. Insert popups (2 rows)
INSERT INTO popups (popup_id, program_id, title, content, target_url, image_url, start_at, end_at, status) VALUES
(1, 1, 'Săn Voucher Buffet Giá Sốc', 'Giảm trực tiếp 30k khi mua hôm nay!', 'https://voucher.vn/programs/1', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80', '2026-01-05 00:00:00', '2026-12-31 23:59:59', 'ACTIVE'),
(2, 3, 'Đón Xuân Cùng Spa Hương Sen', 'Khuyến mãi tri ân khách hàng thân thiết.', 'https://voucher.vn/programs/3', 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&auto=format&fit=crop&q=80', '2026-01-06 00:00:00', '2026-12-31 23:59:59', 'ACTIVE');

-- 17. Insert contents (3 rows)
INSERT INTO contents (content_id, program_id, title, body, content_type, created_at, updated_at, status) VALUES
(1, 1, 'Điều khoản & Điều kiện sử dụng Voucher Buffet', 'Voucher áp dụng tất cả các ngày trong tuần, không áp dụng lễ tết...', 'POLICY', '2026-01-05 08:00:00', NULL, 'ACTIVE'),
(2, 3, 'Trải nghiệm liệu trình Spa Hương Sen', 'Bài viết đánh giá chi tiết về quy trình chăm sóc da mặt...', 'ARTICLE', '2026-01-06 09:00:00', NULL, 'ACTIVE'),
(3, 5, 'Hướng dẫn đặt phòng tại Biển Bạc Hotel', 'Quy trình đặt phòng và xác nhận mã voucher khi nhận phòng...', 'ARTICLE', '2026-01-07 10:00:00', NULL, 'ACTIVE');

-- 18. Insert system_logs (14 rows)
INSERT INTO system_logs (log_id, user_id, action, object_id, object_type, old_value, new_value, performed_at, result) VALUES
(1, 3, 'REGISTER_PARTNER', '3', 'PARTNER', NULL, '{"business_name": "Công ty TNHH Ẩm Thực Việt"}'::jsonb, '2026-01-02 09:05:00', 'SUCCESS'),
(2, 3, 'CREATE_VOUCHER_PROGRAM', '1', 'VOUCHER_PROGRAM', NULL, '{"program_name": "Buffet Lẩu Nướng Cao Cấp Giảm 30%"}'::jsonb, '2026-01-04 09:50:00', 'SUCCESS'),
(3, 1, 'APPROVE_VOUCHER_PROGRAM', '1', 'APPROVAL_REQUEST', '{"status": "PENDING"}'::jsonb, '{"status": "APPROVED"}'::jsonb, '2026-01-04 11:00:00', 'SUCCESS'),
(4, 8, 'ADD_TO_CART', '1', 'CART_ITEM', NULL, '{"program_id": 3, "quantity": 1}'::jsonb, '2026-01-09 15:00:00', 'SUCCESS'),
(5, 8, 'CREATE_ORDER', '1', 'ORDER', NULL, '{"total_amount": 140000.00, "payment_method": "VNPAY"}'::jsonb, '2026-01-10 10:00:00', 'SUCCESS'),
(6, 8, 'ISSUE_VOUCHER', '1', 'ISSUED_VOUCHER', NULL, '{"voucher_code": "VCH-FB-0001"}'::jsonb, '2026-01-10 10:01:00', 'SUCCESS'),
(7, 8, 'USE_VOUCHER', '1', 'ISSUED_VOUCHER', '{"usage_status": "UNUSED"}'::jsonb, '{"usage_status": "USED"}'::jsonb, '2026-01-15 12:30:00', 'SUCCESS'),
(8, 8, 'CREATE_REVIEW', '1', 'REVIEW_FEEDBACK', NULL, '{"rating": 5, "content": "Thức ăn rất ngon"}'::jsonb, '2026-01-15 14:00:00', 'SUCCESS'),
(9, 10, 'REQUEST_CANCEL_ORDER', '4', 'ORDER_CANCELLATION', NULL, '{"reason": "Khách hàng đổi ý"}'::jsonb, '2026-01-13 16:30:00', 'SUCCESS'),
(10, 28, 'CREATE_ORDER', '20', 'ORDER', NULL, '{"total_amount": 158000.00, "payment_method": "MOMO"}'::jsonb, '2026-08-12 02:30:00', 'SUCCESS'),
(11, 28, 'CREATE_ORDER', '21', 'ORDER', NULL, '{"total_amount": 140000.00, "payment_method": "VNPAY"}'::jsonb, '2026-08-12 07:45:00', 'SUCCESS'),
(12, 29, 'CREATE_ORDER', '22', 'ORDER', NULL, '{"total_amount": 578000.00, "payment_method": "CREDIT_CARD"}'::jsonb, '2026-08-12 10:15:00', 'SUCCESS'),
(13, 29, 'USE_VOUCHER', '45', 'ISSUED_VOUCHER', '{"usage_status": "UNUSED"}'::jsonb, '{"usage_status": "USED"}'::jsonb, '2026-08-12 12:30:00', 'SUCCESS'),
(14, 30, 'CREATE_ORDER', '24', 'ORDER', NULL, '{"total_amount": 108000.00, "payment_method": "MOMO"}'::jsonb, '2026-08-12 16:30:00', 'SUCCESS');

-- Reset IDENTITY sequences sau khi seed data tường minh
SELECT setval(pg_get_serial_sequence('users', 'user_id'), (SELECT COALESCE(MAX(user_id), 1) FROM users));
SELECT setval(pg_get_serial_sequence('categories', 'category_id'), (SELECT COALESCE(MAX(category_id), 1) FROM categories));
SELECT setval(pg_get_serial_sequence('branches', 'branch_id'), (SELECT COALESCE(MAX(branch_id), 1) FROM branches));
SELECT setval(pg_get_serial_sequence('partner_approval_requests', 'approval_request_id'), (SELECT COALESCE(MAX(approval_request_id), 1) FROM partner_approval_requests));
SELECT setval(pg_get_serial_sequence('partner_employee_approval_requests', 'approval_request_id'), (SELECT COALESCE(MAX(approval_request_id), 1) FROM partner_employee_approval_requests));
SELECT setval(pg_get_serial_sequence('voucher_programs', 'program_id'), (SELECT COALESCE(MAX(program_id), 1) FROM voucher_programs));
SELECT setval(pg_get_serial_sequence('voucher_program_images', 'image_id'), (SELECT COALESCE(MAX(image_id), 1) FROM voucher_program_images));
SELECT setval(pg_get_serial_sequence('voucher_approval_requests', 'approval_request_id'), (SELECT COALESCE(MAX(approval_request_id), 1) FROM voucher_approval_requests));
SELECT setval(pg_get_serial_sequence('cart_items', 'cart_item_id'), (SELECT COALESCE(MAX(cart_item_id), 1) FROM cart_items));
SELECT setval(pg_get_serial_sequence('orders', 'order_id'), (SELECT COALESCE(MAX(order_id), 1) FROM orders));
SELECT setval(pg_get_serial_sequence('order_items', 'order_item_id'), (SELECT COALESCE(MAX(order_item_id), 1) FROM order_items));
SELECT setval(pg_get_serial_sequence('issued_vouchers', 'issued_voucher_id'), (SELECT COALESCE(MAX(issued_voucher_id), 1) FROM issued_vouchers));
SELECT setval(pg_get_serial_sequence('reviews_feedback', 'review_id'), (SELECT COALESCE(MAX(review_id), 1) FROM reviews_feedback));
SELECT setval(pg_get_serial_sequence('order_cancellations', 'cancellation_id'), (SELECT COALESCE(MAX(cancellation_id), 1) FROM order_cancellations));
SELECT setval(pg_get_serial_sequence('banners', 'banner_id'), (SELECT COALESCE(MAX(banner_id), 1) FROM banners));
SELECT setval(pg_get_serial_sequence('popups', 'popup_id'), (SELECT COALESCE(MAX(popup_id), 1) FROM popups));
SELECT setval(pg_get_serial_sequence('contents', 'content_id'), (SELECT COALESCE(MAX(content_id), 1) FROM contents));
SELECT setval(pg_get_serial_sequence('system_logs', 'log_id'), (SELECT COALESCE(MAX(log_id), 1) FROM system_logs));
