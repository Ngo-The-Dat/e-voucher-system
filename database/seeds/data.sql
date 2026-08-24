-- PostgreSQL Seed Data Script for Voucher System
-- Initial baseline data for system accounts and categories.
-- Note: Dummy test vouchers and demo partners are commented out below to use real scraped data.

-- Clear existing data
TRUNCATE TABLE system_logs, contents, popups, banners, order_cancellations,
               reviews_feedback, issued_vouchers, order_items, orders, cart_items,
               voucher_approval_requests, voucher_program_images, voucher_program_branches, voucher_programs,
               partner_employee_approval_requests, partner_employees, branches, categories, partner_approval_requests, partners, user_locks, users RESTART IDENTITY CASCADE;

-- =========================================================================
-- THÔNG TIN TÀI KHOẢN HỆ THỐNG CƠ BẢN:
-- 1. Tài khoản Quản trị viên (Admin):
--    TK: admin@voucher.vn
--    Pass: @Admin123
-- 2. Tài khoản Khách hàng mẫu (Customer):
--    TK: thuha@gmail.com 
--    Pass: 12345876
-- =========================================================================

-- 1. Insert core system users (Admin + Customer + Locked Accounts for testing)
INSERT INTO users (user_id, full_name, email, phone, password_hash, role, gender, identity_no, nationality, status, created_at) VALUES
(1, 'Ngô Thế Đạt', 'admin@voucher.vn', '0901000001', '$2b$10$JITaepX2GQH3.6T2KhDIiuh4OcJulzeW80vyNF4jfdjV3JpJ5prNq', 'ADMIN', 'MALE', '001090000001', 'Việt Nam', 'ACTIVE', '2026-01-01 08:00:00'),
(2, 'Trần Thị Thu Hà', 'thuha@gmail.com', '0904000004', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'CUSTOMER', 'FEMALE', '001195000002', 'Việt Nam', 'ACTIVE', '2026-01-01 08:30:00'),
(991, 'Vũ Đình Khóa', 'locked_user@gmail.com', '0909000991', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'CUSTOMER', 'MALE', '001090000991', 'Việt Nam', 'LOCKED', '2026-01-10 09:00:00'),
(992, 'Công ty TNHH Khóa Mẫu', 'locked_partner@demo.vn', '0909000992', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER', 'MALE', '001090000992', 'Việt Nam', 'LOCKED', '2026-01-10 10:00:00');

INSERT INTO user_locks (user_id, reason) VALUES
(991, 'Vi phạm chính sách thanh toán voucher nhiều lần.'),
(992, 'Tạm khóa để kiểm tra đối soát công nợ chi nhánh.');

-- 2. Insert standard categories (12 rich categories)
INSERT INTO categories (category_id, category_name, description, status) VALUES
(1, 'Ẩm thực & Nhà hàng', 'Voucher giảm giá ăn uống tại nhà hàng, quán ăn, món ngon đặc sản', 'ACTIVE'),
(2, 'Buffet Thượng Hạng', 'Buffet lẩu nướng, buffet hải sản cao cấp', 'ACTIVE'),
(3, 'Ẩm thực Chay', 'Buffet chay thanh tịnh, ẩm thực chay thuần tự nhiên', 'ACTIVE'),
(4, 'Spa & Làm đẹp', 'Dịch vụ chăm sóc da mặt, trẻ hóa da, thẩm mỹ viện', 'ACTIVE'),
(5, 'Massage & Trị liệu', 'Massage body, foot, đả thông kinh lạc cổ vai gáy', 'ACTIVE'),
(6, 'Chăm sóc Tóc & Nail', 'Gội đầu dưỡng sinh, salon tóc, làm móng nghệ thuật', 'ACTIVE'),
(7, 'Nha khoa Thẩm mỹ', 'Cạo vôi, tẩy trắng răng, bọc răng sứ, nha khoa gia đình', 'ACTIVE'),
(8, 'Khách sạn & Resort', 'Nghỉ dưỡng khách sạn và resort cao cấp toàn quốc', 'ACTIVE'),
(9, 'Tour Du lịch', 'Tour du lịch khám phá trong và ngoài nước trọn gói', 'ACTIVE'),
(10, 'Khu Vui Chơi & Giải Trí', 'Công viên nước, khu vui chơi liên hợp, vé xem phim, giải trí', 'ACTIVE'),
(11, 'Thể thao & Gym / Yoga', 'Thẻ tập thể hình, yoga, rèn luyện sức khỏe', 'ACTIVE'),
(12, 'Khóa học & Đào tạo', 'Lớp học kỹ năng mềm, ngoại ngữ, nghệ thuật', 'ACTIVE');

/*
-- =========================================================================
-- DỮ LIỆU DEMO MẪU CŨ (ĐÃ ĐƯỢC TẠM THỜI COMMENT ĐỂ SỬ DỤNG DỮ LIỆU CÀO THỰC TẾ)
-- =========================================================================

-- Demo Users
INSERT INTO users (user_id, full_name, email, phone, password_hash, role, gender, identity_no, nationality, status, created_at) VALUES
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
(22, 'Lê Hoàng Yến', 'hoangyen@gmail.com', '0907000022', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'CUSTOMER', 'FEMALE', '001198000022', 'Việt Nam', 'ACTIVE', '2026-07-15 10:00:00'),
(23, 'Trịnh Quốc Thái', 'quocthai@gmail.com', '0907000023', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'CUSTOMER', 'MALE', '001098000023', 'Việt Nam', 'ACTIVE', '2026-07-25 14:20:00'),
(24, 'Ngô Gia Huy', 'giahuy@gmail.com', '0907000024', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'CUSTOMER', 'MALE', '001098000024', 'Việt Nam', 'ACTIVE', '2026-08-04 09:30:00'),
(25, 'Vương Thúy Kiều', 'thuykieu@gmail.com', '0907000025', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'CUSTOMER', 'FEMALE', '001198000025', 'Việt Nam', 'ACTIVE', '2026-08-08 11:15:00'),
(26, 'Phan Hải Đăng', 'haidang@gmail.com', '0907000026', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'CUSTOMER', 'MALE', '001098000026', 'Việt Nam', 'ACTIVE', '2026-08-10 08:30:00'),
(27, 'Lâm Bích Ngọc', 'bichngoc@gmail.com', '0907000027', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'CUSTOMER', 'FEMALE', '001198000027', 'Việt Nam', 'ACTIVE', '2026-08-11 15:45:00'),
(28, 'Dương Minh Khang', 'minhkhang@gmail.com', '0907000028', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'CUSTOMER', 'MALE', '001098000028', 'Việt Nam', 'ACTIVE', '2026-08-12 08:15:00'),
(29, 'Tạ Thanh Thảo', 'thanhthao@gmail.com', '0907000029', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'CUSTOMER', 'FEMALE', '001198000029', 'Việt Nam', 'ACTIVE', '2026-08-12 11:30:00'),
(30, 'Cao Tuấn Anh', 'tuananh@gmail.com', '0907000030', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'CUSTOMER', 'MALE', '001098000030', 'Việt Nam', 'ACTIVE', '2026-08-12 16:45:00'),
(31, 'Lâm Thị Mỹ Hạnh', 'partner_phuclong@tea.vn', '0908000031', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER', 'FEMALE', '001198000031', 'Việt Nam', 'ACTIVE', '2026-08-05 09:15:00'),
(32, 'Trần Gia Bảo', 'partner_shopeefood@food.vn', '0908000032', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER', 'MALE', '001098000032', 'Việt Nam', 'ACTIVE', '2026-08-06 10:30:00'),
(33, 'Vũ Hải Nam', 'partner_uniqlo@fashion.vn', '0908000033', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER', 'MALE', '001098000033', 'Việt Nam', 'ACTIVE', '2026-08-07 14:00:00'),
(34, 'Phạm Minh Quân', 'employee_quan@voucher.vn', '0903000034', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER_EMPLOYEE', 'MALE', '001095000034', 'Việt Nam', 'ACTIVE', '2026-08-14 09:30:00'),
(35, 'Trần Ngọc Linh', 'employee_linh@voucher.vn', '0903000035', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER_EMPLOYEE', 'FEMALE', '001196000035', 'Việt Nam', 'ACTIVE', '2026-08-15 14:15:00'),
(36, 'Lê Quốc Bảo', 'employee_bao@voucher.vn', '0903000036', '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW', 'PARTNER_EMPLOYEE', 'MALE', '001097000036', 'Việt Nam', 'ACTIVE', '2026-08-16 10:00:00');

-- Demo Partners
INSERT INTO partners (user_id, business_name, tax_code, activity_status, registered_at, business_license_no, license_issue_date, license_issue_place, brand_logo) VALUES
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
(18, 'Hộ Kinh Doanh Chuỗi Cafe The Coffee House', '0312345678', 'INACTIVE', '2026-08-03 14:15:00', '0312345678-001', '2022-11-15', 'Sở KH&ĐT TP. Hồ Chí Minh', 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&auto=format&fit=crop&q=80'),
(19, 'Công ty TNHH Thẩm Mỹ Viện Quốc Tế Seoul Center', '0108889999', 'INACTIVE', '2026-08-02 11:20:00', '0108889999-001', '2023-05-12', 'Sở KH&ĐT TP. Hà Nội', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&auto=format&fit=crop&q=80'),
(33, 'Công ty TNHH Uniqlo Việt Nam', '0315678901', 'INACTIVE', '2026-08-07 14:00:00', '0315678901-001', '2023-08-01', 'Sở KH&ĐT TP. Hồ Chí Minh', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&auto=format&fit=crop&q=80'),
(21, 'Công ty TNHH Lẩu Nướng Haidilao Việt Nam', '0315897462', 'INACTIVE', '2026-07-30 08:30:00', '0315897462-001', '2022-07-15', 'Sở KH&ĐT TP. Hồ Chí Minh', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&auto=format&fit=crop&q=80'),
(12, 'Công ty Cổ phần Nhà hàng Hải Sản X', '0103456789', 'INACTIVE', '2026-07-31 09:15:00', '0103456789-001', '2021-06-10', 'Sở KH&ĐT TP. Hồ Chí Minh', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&auto=format&fit=crop&q=80');

-- Demo Partner Approval Requests
INSERT INTO partner_approval_requests (approval_request_id, partner_id, admin_id, submitted_at, reviewed_at, approval_status, admin_feedback) VALUES
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
(13, 18, NULL, '2026-08-03 14:15:00', NULL, 'PENDING', NULL),
(14, 19, NULL, '2026-08-02 11:20:00', NULL, 'PENDING', NULL),
(15, 33, NULL, '2026-08-07 14:00:00', NULL, 'PENDING', NULL),
(16, 21, NULL, '2026-07-30 08:30:00', NULL, 'PENDING', NULL),
(17, 12, 1, '2026-07-31 09:15:00', '2026-07-31 10:00:00', 'REJECTED', 'Hồ sơ không đầy đủ thông tin pháp lý.');

-- Demo Branches
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

-- Demo Partner Employees
INSERT INTO partner_employees (user_id, branch_id) VALUES
(6, 1), (7, 3), (34, 1), (35, 3), (36, 5);

INSERT INTO partner_employee_approval_requests (approval_request_id, user_id, admin_id, submitted_at, reviewed_at, approval_status, admin_feedback) VALUES
(1, 6, 1, '2026-01-03 10:30:00', '2026-01-03 11:00:00', 'APPROVED', NULL),
(2, 7, 1, '2026-01-03 11:00:00', '2026-01-03 11:30:00', 'APPROVED', NULL),
(3, 34, NULL, '2026-08-14 09:30:00', NULL, 'PENDING', NULL),
(4, 35, NULL, '2026-08-15 14:15:00', NULL, 'PENDING', NULL),
(5, 36, NULL, '2026-08-16 10:00:00', NULL, 'PENDING', NULL);

-- Demo Voucher Programs
INSERT INTO voucher_programs (program_id, partner_id, category_id, program_name, original_price, sale_price, issue_quantity, sale_start_at, sale_end_at, use_start_at, use_end_at, display_status) VALUES
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
(4, 4, 2, 'Gói Chăm Sóc Da Mặt Chuyên Sâu Tái Tạo', 300000.00, 200000.00, 150, '2026-08-01 00:00:00', '2026-12-31 23:59:59', '2026-08-01 00:00:00', '2027-01-06 23:59:59', 'DRAFT'),
(7, 3, 1, 'Buffet Lẩu Băng Chuyền Kichi Kichi Ưu Đãi 20%', 350000.00, 280000.00, 1200, '2026-08-10 00:00:00', '2026-11-30 23:59:59', '2026-08-10 00:00:00', '2026-12-15 23:59:59', 'DRAFT'),
(9, 11, 2, 'Chiến dịch ưu đãi sai quy định (Cảnh báo sai giá bán)', 100000.00, 120000.00, 500, '2026-08-01 00:00:00', '2026-10-31 23:59:59', '2026-08-01 00:00:00', '2026-11-30 23:59:59', 'DRAFT'),
(11, 15, 1, 'Voucher Ưu Đãi Trà Sữa Tocotoco Mua 1 Tặng 1', 60000.00, 42000.00, 1500, '2026-07-15 00:00:00', '2026-12-31 23:59:59', '2026-07-15 00:00:00', '2027-01-15 23:59:59', 'HIDDEN'),
(12, 14, 4, 'Vé Xem Phim Bom Tấn IMAX Suất Chiếu Đặc Biệt', 150000.00, 99000.00, 500, '2026-07-01 00:00:00', '2026-12-31 23:59:59', '2026-07-01 00:00:00', '2027-01-01 23:59:59', 'HIDDEN'),
(13, 5, 4, 'Chiến dịch Mùa Hè Rực Rỡ - Giảm 50% Vé Công Viên Nước', 200000.00, 100000.00, 800, '2026-05-01 00:00:00', '2026-07-31 23:59:59', '2026-05-01 00:00:00', '2026-08-31 23:59:59', 'ENDED'),
(15, 3, 1, 'Set Menu Tiệc Tất Niên Gia Đình Ấm Cúng 2025', 1200000.00, 850000.00, 100, '2025-01-01 00:00:00', '2025-02-15 23:59:59', '2025-01-01 00:00:00', '2025-02-28 23:59:59', 'PUBLISHED');

-- Demo Images
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

-- Demo Program Branches
INSERT INTO voucher_program_branches (program_id, branch_id) VALUES
(1, 1), (1, 2), (2, 1), (2, 2), (3, 3), (3, 4), (4, 3), (4, 4), (5, 5), (6, 9),
(7, 1), (7, 2), (8, 11), (8, 12), (9, 6), (9, 7), (10, 10), (11, 10), (12, 11), (12, 12),
(13, 5), (14, 1), (15, 1), (15, 2), (16, 13), (16, 14), (17, 15), (18, 19);

-- Demo Voucher Approval Requests
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
(4, 4, NULL, '2026-08-01 09:30:00', NULL, 'PENDING', NULL),
(7, 7, NULL, '2026-08-02 09:15:00', NULL, 'PENDING', NULL),
(9, 9, NULL, '2026-08-01 16:45:00', NULL, 'PENDING', NULL);

-- Demo Banners, Popups, Contents
INSERT INTO banners (banner_id, program_id, title, image_url, target_url, display_position, display_from, display_to, status) VALUES
(1, 1, 'Bùng Nổ Tiệc Buffet Giảm 30%', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1600&auto=format&fit=crop&q=80', 'https://voucher.vn/programs/1', 'HOME_TOP', '2026-01-05 00:00:00', '2026-12-31 23:59:59', 'ACTIVE'),
(2, 3, 'Thư Giãn Cùng Spa Hương Sen', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1600&auto=format&fit=crop&q=80', 'https://voucher.vn/programs/3', 'CATEGORY_HEADER', '2026-01-06 00:00:00', '2026-12-31 23:59:59', 'ACTIVE'),
(3, 5, 'Nghỉ Dưỡng Biển Nha Trang Giá Cực Tốt', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80', 'https://voucher.vn/programs/5', 'HOME_MIDDLE', '2026-01-07 00:00:00', '2026-12-31 23:59:59', 'ACTIVE');

INSERT INTO popups (popup_id, program_id, title, content, target_url, image_url, start_at, end_at, status) VALUES
(1, 1, 'Săn Voucher Buffet Giá Sốc', 'Giảm trực tiếp 30k khi mua hôm nay!', 'https://voucher.vn/programs/1', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80', '2026-01-05 00:00:00', '2026-12-31 23:59:59', 'ACTIVE'),
(2, 3, 'Đón Xuân Cùng Spa Hương Sen', 'Khuyến mãi tri ân khách hàng thân thiết.', 'https://voucher.vn/programs/3', 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&auto=format&fit=crop&q=80', '2026-01-06 00:00:00', '2026-12-31 23:59:59', 'ACTIVE');

INSERT INTO contents (content_id, program_id, title, body, content_type, created_at, updated_at, status) VALUES
(1, 1, 'Điều khoản & Điều kiện sử dụng Voucher Buffet', 'Voucher áp dụng tất cả các ngày trong tuần, không áp dụng lễ tết...', 'POLICY', '2026-01-05 08:00:00', NULL, 'ACTIVE'),
(2, 3, 'Trải nghiệm liệu trình Spa Hương Sen', 'Bài viết đánh giá chi tiết về quy trình chăm sóc da mặt...', 'ARTICLE', '2026-01-06 09:00:00', NULL, 'ACTIVE'),
(3, 5, 'Hướng dẫn đặt phòng tại Biển Bạc Hotel', 'Quy trình đặt phòng và xác nhận mã voucher khi nhận phòng...', 'ARTICLE', '2026-01-07 10:00:00', NULL, 'ACTIVE');
*/

-- Reset IDENTITY sequences sau khi seed data
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
