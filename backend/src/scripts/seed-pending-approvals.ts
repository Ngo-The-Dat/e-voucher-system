/**
 * @file seed-pending-approvals.ts
 * @description Script tạo dữ liệu mẫu cho Admin phê duyệt:
 * 1. Đối tác chờ duyệt (Pending Partners) - 6 đối tác
 * 2. Nhân viên đối tác chờ duyệt (Pending Partner Employees) - 6 nhân viên
 * 3. Voucher Programs chờ duyệt (Pending Vouchers) - 6 chương trình
 */

import pool from '../config/db.js';

// Mật khẩu mặc định: 12345876
const DEFAULT_HASH = '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW';

export async function seedPendingApprovals() {
  console.log('🚀 Bắt đầu khởi tạo dữ liệu mẫu chờ duyệt cho Admin...');

  const now = new Date();
  const formatSqlDate = (d: Date) => d.toISOString().replace('T', ' ').substring(0, 19);
  const addHours = (d: Date, h: number) => new Date(d.getTime() + h * 3600000);
  const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. TẠO 6 ĐỐI TÁC CHỜ DUYỆT (PENDING PARTNERS)
  // ─────────────────────────────────────────────────────────────────────────────
  const pendingPartnersData = [
    {
      fullName: 'Nguyễn Văn An',
      email: 'partner.thecoffeehouse@demo.vn',
      phone: '0901234001',
      identityNo: '079090001001',
      businessName: 'Công ty Cổ phần Thương mại Dịch vụ Trà Cà Phê VN (The Coffee House)',
      taxCode: '0312863763',
      licenseNo: '0312863763',
      licenseDate: '2020-05-15',
      licensePlace: 'Sở Kế hoạch & Đầu tư TP.HCM',
      repTitle: 'Giám đốc Điều hành',
      logo: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400',
      branch: {
        name: 'The Coffee House - Chi nhánh Nguyễn Huệ',
        address: '68 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
        region: 'Miền Nam',
        phone: '02871087088'
      }
    },
    {
      fullName: 'Trần Minh Hoàng',
      email: 'partner.haidilao@demo.vn',
      phone: '0901234002',
      identityNo: '079090001002',
      businessName: 'Công ty TNHH Dịch vụ Ẩm thực Haidilao Việt Nam',
      taxCode: '0315998124',
      licenseNo: '0315998124',
      licenseDate: '2019-11-20',
      licensePlace: 'Sở Kế hoạch & Đầu tư TP.HCM',
      repTitle: 'Tổng Giám đốc',
      logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400',
      branch: {
        name: 'Haidilao Hotpot - Vincom Center Đồng Khởi',
        address: 'Tầng L3, 72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM',
        region: 'Miền Nam',
        phone: '02862731001'
      }
    },
    {
      fullName: 'Lê Thu Hà',
      email: 'partner.california@demo.vn',
      phone: '0901234003',
      identityNo: '079090001003',
      businessName: 'Công ty TNHH Trung Tâm Thể Dục Thể Hình & Yoga California',
      taxCode: '0305662198',
      licenseNo: '0305662198',
      licenseDate: '2018-08-10',
      licensePlace: 'Sở Kế hoạch & Đầu tư TP.HCM',
      repTitle: 'Phó Giám đốc Vận hành',
      logo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
      branch: {
        name: 'California Centuryon Landmark 81',
        address: 'Tầng 3, TTTM Vincom Landmark 81, 208 Nguyễn Hữu Cảnh, Bình Thạnh, TP.HCM',
        region: 'Miền Nam',
        phone: '02871079999'
      }
    },
    {
      fullName: 'Phạm Quỳnh Nga',
      email: 'partner.shiseido@demo.vn',
      phone: '0901234004',
      identityNo: '079090001004',
      businessName: 'Công ty TNHH Mỹ phẩm & Spa Shiseido Việt Nam',
      taxCode: '0309988771',
      licenseNo: '0309988771',
      licenseDate: '2017-03-25',
      licensePlace: 'Sở Kế hoạch & Đầu tư TP.HCM',
      repTitle: 'Giám đốc Phát triển Chuỗi Spa',
      logo: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400',
      branch: {
        name: 'Shiseido Spa & Beauty - Saigon Centre',
        address: 'Tầng 2, Saigon Centre, 65 Lê Lợi, Bến Nghé, Quận 1, TP.HCM',
        region: 'Miền Nam',
        phone: '02838211005'
      }
    },
    {
      fullName: 'Hoàng Đức Long',
      email: 'partner.vinwonders@demo.vn',
      phone: '0901234005',
      identityNo: '079090001005',
      businessName: 'Công ty Cổ phần Vinpearl - Chi nhánh Vui chơi Giải trí VinWonders',
      taxCode: '4200456848',
      licenseNo: '4200456848',
      licenseDate: '2021-01-18',
      licensePlace: 'Sở Kế hoạch & Đầu tư Tỉnh Khánh Hòa',
      repTitle: 'Giám đốc Kinh doanh Vé & Voucher',
      logo: 'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=400',
      branch: {
        name: 'VinWonders Grand Park - Phòng Vé Trải Nghiệm',
        address: 'Khu Đô Thị Vinhomes Grand Park, Long Bình, TP. Thủ Đức, TP.HCM',
        region: 'Miền Nam',
        phone: '19006677'
      }
    },
    {
      fullName: 'Đỗ Kim Phượng',
      email: 'partner.nhakhoaparis@demo.vn',
      phone: '0901234006',
      identityNo: '079090001006',
      businessName: 'Công ty Cổ phần Nha Khoa Tiêu Chuẩn Pháp Paris',
      taxCode: '0106678239',
      licenseNo: '0106678239',
      licenseDate: '2016-09-12',
      licensePlace: 'Sở Kế hoạch & Đầu tư TP. Hà Nội',
      repTitle: 'Bác sĩ Trưởng Khoa Thẩm Mỹ',
      logo: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400',
      branch: {
        name: 'Nha Khoa Paris - Cơ sở Bà Huyện Thanh Quan',
        address: '84A Bà Huyện Thanh Quan, Phường 9, Quận 3, TP.HCM',
        region: 'Miền Nam',
        phone: '02873022226'
      }
    }
  ];

  const createdPendingPartnerIds: number[] = [];
  const createdPendingBranchIds: number[] = [];

  for (let i = 0; i < pendingPartnersData.length; i++) {
    const p = pendingPartnersData[i];
    const submitTime = formatSqlDate(addHours(now, - (i + 1) * 3));

    // Kiểm tra hoặc tạo User
    let userId: number;
    const existingUser = await pool.query('SELECT user_id FROM users WHERE email = $1', [p.email]);
    if (existingUser.rows.length > 0) {
      userId = Number(existingUser.rows[0].user_id);
      await pool.query(
        `UPDATE users SET full_name = $1, phone = $2, identity_no = $3, status = 'ACTIVE' WHERE user_id = $4`,
        [p.fullName, p.phone, p.identityNo, userId]
      );
    } else {
      const userRes = await pool.query(
        `INSERT INTO users (full_name, email, phone, password_hash, role, status, gender, nationality, identity_no, created_at)
         VALUES ($1, $2, $3, $4, 'PARTNER', 'ACTIVE', 'OTHER', 'Việt Nam', $5, $6)
         RETURNING user_id`,
        [p.fullName, p.email, p.phone, DEFAULT_HASH, p.identityNo, submitTime]
      );
      userId = Number(userRes.rows[0].user_id);
    }
    createdPendingPartnerIds.push(userId);

    // Upsert bảng partners với activity_status = 'INACTIVE'
    await pool.query(
      `INSERT INTO partners (user_id, business_name, tax_code, activity_status, registered_at, business_license_no, license_issue_date, license_issue_place, representative_title, brand_logo)
       VALUES ($1, $2, $3, 'INACTIVE', $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id) DO UPDATE SET
         business_name = EXCLUDED.business_name,
         tax_code = EXCLUDED.tax_code,
         activity_status = 'INACTIVE',
         business_license_no = EXCLUDED.business_license_no,
         brand_logo = EXCLUDED.brand_logo`,
      [userId, p.businessName, p.taxCode, submitTime, p.licenseNo, p.licenseDate, p.licensePlace, p.repTitle, p.logo]
    );

    // Tạo chi nhánh
    const branchRes = await pool.query(
      `INSERT INTO branches (partner_id, branch_name, address, region, phone, status)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
       RETURNING branch_id`,
      [userId, p.branch.name, p.branch.address, p.branch.region, p.branch.phone]
    );
    const branchId = Number(branchRes.rows[0].branch_id);
    createdPendingBranchIds.push(branchId);

    // Xóa request cũ (nếu có) và tạo yêu cầu duyệt PENDING
    await pool.query('DELETE FROM partner_approval_requests WHERE partner_id = $1', [userId]);
    await pool.query(
      `INSERT INTO partner_approval_requests (partner_id, submitted_at, approval_status, admin_feedback)
       VALUES ($1, $2, 'PENDING', NULL)`,
      [userId, submitTime]
    );
  }
  console.log(`✅ Đã tạo thành công ${pendingPartnersData.length} đối tác chờ duyệt (PENDING).`);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. TẠO 6 NHÂN VIÊN ĐỐI TÁC CHỜ DUYỆT (PENDING PARTNER EMPLOYEES)
  // ─────────────────────────────────────────────────────────────────────────────
  // Lấy các chi nhánh thực tế từ DB để liên kết nhân viên
  const allBranchesRes = await pool.query(`SELECT branch_id, partner_id FROM branches ORDER BY branch_id ASC LIMIT 10`);
  const availableBranches = allBranchesRes.rows;

  const pendingEmployeesData = [
    {
      fullName: 'Lê Thị Thu Thảo',
      email: 'emp.thao.le@partner.vn',
      phone: '0987111001',
      identityNo: '079198001234',
      gender: 'FEMALE',
      branchIndex: 0
    },
    {
      fullName: 'Nguyễn Trọng Nam',
      email: 'emp.nam.nguyen@partner.vn',
      phone: '0987111002',
      identityNo: '079198001235',
      gender: 'MALE',
      branchIndex: 1
    },
    {
      fullName: 'Trần Thị Bích Ngọc',
      email: 'emp.ngoc.tran@partner.vn',
      phone: '0987111003',
      identityNo: '079198001236',
      gender: 'FEMALE',
      branchIndex: 2
    },
    {
      fullName: 'Vũ Hoàng Long',
      email: 'emp.long.vu@partner.vn',
      phone: '0987111004',
      identityNo: '079198001237',
      gender: 'MALE',
      branchIndex: 3
    },
    {
      fullName: 'Phan Thảo Vy',
      email: 'emp.vy.phan@partner.vn',
      phone: '0987111005',
      identityNo: '079198001238',
      gender: 'FEMALE',
      branchIndex: 4
    },
    {
      fullName: 'Đặng Quốc Bảo',
      email: 'emp.bao.dang@partner.vn',
      phone: '0987111006',
      identityNo: '079198001239',
      gender: 'MALE',
      branchIndex: 5
    }
  ];

  for (let i = 0; i < pendingEmployeesData.length; i++) {
    const e = pendingEmployeesData[i];
    const submitTime = formatSqlDate(addHours(now, - (i + 2) * 2));
    const targetBranch = availableBranches[e.branchIndex % availableBranches.length];
    const targetBranchId = Number(targetBranch.branch_id);

    let empUserId: number;
    const existingEmp = await pool.query('SELECT user_id FROM users WHERE email = $1', [e.email]);
    if (existingEmp.rows.length > 0) {
      empUserId = Number(existingEmp.rows[0].user_id);
      await pool.query(
        `UPDATE users SET full_name = $1, phone = $2, identity_no = $3, status = 'ACTIVE' WHERE user_id = $4`,
        [e.fullName, e.phone, e.identityNo, empUserId]
      );
    } else {
      const empRes = await pool.query(
        `INSERT INTO users (full_name, email, phone, password_hash, role, status, gender, nationality, identity_no, created_at)
         VALUES ($1, $2, $3, $4, 'PARTNER_EMPLOYEE', 'ACTIVE', $5, 'Việt Nam', $6, $7)
         RETURNING user_id`,
        [e.fullName, e.email, e.phone, DEFAULT_HASH, e.gender, e.identityNo, submitTime]
      );
      empUserId = Number(empRes.rows[0].user_id);
    }

    // Upsert bảng partner_employees
    await pool.query(
      `INSERT INTO partner_employees (user_id, branch_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET branch_id = EXCLUDED.branch_id`,
      [empUserId, targetBranchId]
    );

    // Yêu cầu duyệt PENDING
    await pool.query('DELETE FROM partner_employee_approval_requests WHERE user_id = $1', [empUserId]);
    await pool.query(
      `INSERT INTO partner_employee_approval_requests (user_id, submitted_at, approval_status, admin_feedback)
       VALUES ($1, $2, 'PENDING', NULL)`,
      [empUserId, submitTime]
    );
  }
  console.log(`✅ Đã tạo thành công ${pendingEmployeesData.length} nhân viên đối tác chờ duyệt (PENDING).`);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. TẠO 6 VOUCHER PROGRAMS CHỜ DUYỆT (PENDING VOUCHERS)
  // ─────────────────────────────────────────────────────────────────────────────
  // Lấy danh sách đối tác đang ACTIVE để gán voucher chờ duyệt
  const activePartnersRes = await pool.query(`
    SELECT p.user_id as partner_id, p.business_name, b.branch_id
    FROM partners p
    JOIN branches b ON b.partner_id = p.user_id
    WHERE p.activity_status = 'ACTIVE'
    ORDER BY p.user_id ASC
  `);
  const activePartners = activePartnersRes.rows;

  const pendingVouchersData = [
    {
      name: 'The Coffee House - E-Voucher Thưởng Thức Menu Trà & Cà Phê 100K',
      categoryId: 1, // Ẩm thực & Nhà hàng
      originalPrice: 100000,
      salePrice: 69000,
      quantity: 500,
      image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
      description: 'Thưởng thức toàn bộ menu thức uống cà phê nguyên chất, trà sữa Phúc Long/The Coffee House với ưu đãi giảm 31% áp dụng toàn hệ thống.'
    },
    {
      name: 'Haidilao Hotpot - Đại Tiệc Lẩu Tứ Vị Thượng Hạng Dành Cho 4 Người',
      categoryId: 2, // Buffet Thượng Hạng
      originalPrice: 1200000,
      salePrice: 899000,
      quantity: 200,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
      description: 'Set menu lẩu 4 ngăn chuẩn vị Tứ Xuyên bao gồm bò Wagyu, hải sản tươi sống và quầy line gia vị tráng miệng không giới hạn.'
    },
    {
      name: 'California Fitness - Thẻ Tập Thử 1 Tháng Gym & Yoga Diamond VIP',
      categoryId: 11, // Thể thao & Gym / Yoga
      originalPrice: 1500000,
      salePrice: 399000,
      quantity: 150,
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
      description: 'Trải nghiệm không gian tập luyện đẳng cấp 5 sao với đầy đủ trang thiết bị hiện đại, phòng xông hơi Sauna và lớp Yoga không giới hạn.'
    },
    {
      name: 'Shiseido Beauty Spa - Liệu Trình Trẻ Hóa Da Tế Bào Gốc Cao Cấp 90 Phút',
      categoryId: 4, // Spa & Làm đẹp
      originalPrice: 2000000,
      salePrice: 650000,
      quantity: 100,
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
      description: 'Liệu trình chăm sóc da chuyên sâu với tinh chất collagen và tế bào gốc Nhật Bản, phục hồi độ đàn hồi và sáng mịn rạng rỡ.'
    },
    {
      name: 'Nha Khoa Paris - Tẩy Trắng Răng WhiteMax Công Nghệ Pháp Không Ê Buốt',
      categoryId: 7, // Nha khoa Thẩm mỹ
      originalPrice: 2500000,
      salePrice: 790000,
      quantity: 300,
      image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800',
      description: 'Tẩy trắng răng bằng công nghệ ánh sáng Plasma lạnh thế hệ mới từ Pháp, nâng tone răng tức thì an toàn tuyệt đối cho men răng.'
    },
    {
      name: 'VinWonders Grand Park - Vé Trọn Gói Vui Chơi Công Viên Nước & Khám Phá',
      categoryId: 10, // Khu Vui Chơi & Giải Trí
      originalPrice: 450000,
      salePrice: 280000,
      quantity: 1000,
      image: 'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=800',
      description: 'Trọn gói vé vào cổng và không giới hạn tất cả các trò chơi cảm giác mạnh, vịnh trượt nước kỳ thú tại thiên đường giải trí VinWonders.'
    }
  ];

  // Dọn dẹp voucher pending cũ để tránh nhân đôi
  await pool.query(`
    DELETE FROM contents WHERE program_id IN (SELECT program_id FROM voucher_programs WHERE display_status = 'PENDING_APPROVAL');
    DELETE FROM voucher_program_images WHERE program_id IN (SELECT program_id FROM voucher_programs WHERE display_status = 'PENDING_APPROVAL');
    DELETE FROM voucher_program_branches WHERE program_id IN (SELECT program_id FROM voucher_programs WHERE display_status = 'PENDING_APPROVAL');
    DELETE FROM voucher_approval_requests WHERE approval_status = 'PENDING' OR program_id IN (SELECT program_id FROM voucher_programs WHERE display_status = 'PENDING_APPROVAL');
    DELETE FROM voucher_programs WHERE display_status = 'PENDING_APPROVAL';
  `);

  for (let i = 0; i < pendingVouchersData.length; i++) {
    const v = pendingVouchersData[i];
    const partner = activePartners[i % activePartners.length] || { partner_id: createdPendingPartnerIds[0], branch_id: createdPendingBranchIds[0] };
    const partnerId = Number(partner.partner_id);
    const branchId = Number(partner.branch_id);
    const submitTime = formatSqlDate(addHours(now, - (i + 1) * 4));
    const saleStart = formatSqlDate(now);
    const saleEnd = formatSqlDate(addDays(now, 60));
    const useStart = formatSqlDate(now);
    const useEnd = formatSqlDate(addDays(now, 90));

    // Thêm voucher_programs với display_status = 'PENDING_APPROVAL'
    const progRes = await pool.query(
      `INSERT INTO voucher_programs (partner_id, category_id, program_name, original_price, sale_price, issue_quantity, sale_start_at, sale_end_at, use_start_at, use_end_at, display_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING_APPROVAL')
       RETURNING program_id`,
      [partnerId, v.categoryId, v.name, v.originalPrice, v.salePrice, v.quantity, saleStart, saleEnd, useStart, useEnd]
    );
    const programId = Number(progRes.rows[0].program_id);

    // Gán chi nhánh áp dụng
    await pool.query(
      `INSERT INTO voucher_program_branches (program_id, branch_id)
       VALUES ($1, $2)
       ON CONFLICT (program_id, branch_id) DO NOTHING`,
      [programId, branchId]
    );

    // Thêm hình ảnh đại diện
    await pool.query(
      `INSERT INTO voucher_program_images (program_id, image_url, is_primary, sort_order)
       VALUES ($1, $2, TRUE, 0)`,
      [programId, v.image]
    );

    // Thêm nội dung bài viết và chính sách
    await pool.query(
      `INSERT INTO contents (program_id, content_type, title, body, status)
       VALUES 
         ($1, 'ARTICLE', $2, $3, 'ACTIVE'),
         ($1, 'POLICY', 'Điều Kiện Sử Dụng & Quy Định', 'Áp dụng cho mọi khách hàng khi đặt chỗ trước 24h. Không áp dụng đồng thời với các chương trình khuyến mãi khác.', 'ACTIVE')`,
      [programId, v.name, v.description]
    );

    // Tạo yêu cầu duyệt voucher_approval_requests trạng thái PENDING
    await pool.query(
      `INSERT INTO voucher_approval_requests (program_id, submitted_at, approval_status, admin_feedback)
       VALUES ($1, $2, 'PENDING', NULL)`,
      [programId, submitTime]
    );
  }
  console.log(`✅ Đã tạo thành công ${pendingVouchersData.length} chương trình voucher chờ duyệt (PENDING_APPROVAL).`);

  // Cập nhật reset sequences
  await pool.query(`
    SELECT setval(pg_get_serial_sequence('users', 'user_id'), (SELECT COALESCE(MAX(user_id), 1) FROM users));
    SELECT setval(pg_get_serial_sequence('branches', 'branch_id'), (SELECT COALESCE(MAX(branch_id), 1) FROM branches));
    SELECT setval(pg_get_serial_sequence('voucher_programs', 'program_id'), (SELECT COALESCE(MAX(program_id), 1) FROM voucher_programs));
    SELECT setval(pg_get_serial_sequence('partner_approval_requests', 'approval_request_id'), (SELECT COALESCE(MAX(approval_request_id), 1) FROM partner_approval_requests));
    SELECT setval(pg_get_serial_sequence('partner_employee_approval_requests', 'approval_request_id'), (SELECT COALESCE(MAX(approval_request_id), 1) FROM partner_employee_approval_requests));
    SELECT setval(pg_get_serial_sequence('voucher_approval_requests', 'approval_request_id'), (SELECT COALESCE(MAX(approval_request_id), 1) FROM voucher_approval_requests));
  `);

  console.log('🎉 Hoàn thành nạp dữ liệu mẫu chờ duyệt thành công!');
}

// Cho phép chạy trực tiếp từ CLI
if (process.argv[1]?.includes('seed-pending-approvals')) {
  seedPendingApprovals()
    .then(() => {
      console.log('✅ Seed pending approvals completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Lỗi khi seed pending approvals:', err);
      process.exit(1);
    });
}
