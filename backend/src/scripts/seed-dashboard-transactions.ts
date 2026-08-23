/**
 * @file seed-dashboard-transactions.ts
 * @description Script tạo dữ liệu giao dịch mẫu (đơn hàng, voucher phát hành, đánh giá, nhật ký, nhân viên)
 * liên kết trực tiếp với các chương trình Voucher và Đối tác cào thực tế, phục vụ demo Dashboard Admin & Partner.
 */

import pool from '../config/db.js';

// Mật khẩu mặc định: 12345876
const DEFAULT_HASH = '$2b$10$mhm5mMiiPXKJx8JrARS/wemVunACuQI2Ug6ezweTw2jB8Z2fQ92zW';

async function seedTransactions() {
  console.log('🚀 Bắt đầu khởi tạo dữ liệu giao dịch mẫu cho Dashboard...');

  // 1. Lấy danh sách Partner, Branch và Voucher Program thực tế hiện có trong DB
  const partnersRes = await pool.query(`
    SELECT p.user_id as partner_id, p.business_name, u.full_name, u.email
    FROM partners p
    JOIN users u ON p.user_id = u.user_id
    ORDER BY p.user_id ASC
  `);
  const partners = partnersRes.rows;

  const branchesRes = await pool.query(`
    SELECT branch_id, partner_id, branch_name, region
    FROM branches
    ORDER BY branch_id ASC
  `);
  const branches = branchesRes.rows;

  const programsRes = await pool.query(`
    SELECT program_id, partner_id, category_id, program_name, original_price, sale_price
    FROM voucher_programs
    WHERE display_status = 'PUBLISHED'
    ORDER BY program_id ASC
  `);
  const programs = programsRes.rows;

  if (programs.length === 0 || partners.length === 0) {
    console.error('❌ Không tìm thấy chương trình voucher hoặc đối tác trong database. Vui lòng chạy scraper trước.');
    process.exit(1);
  }

  console.log(`📌 Tìm thấy ${partners.length} đối tác, ${branches.length} chi nhánh, ${programs.length} voucher programs.`);

  // 2. Tạo thêm tài khoản Khách hàng mẫu (Demo Customers)
  const customersData = [
    { name: 'Lê Hoàng Yến', email: 'hoangyen@gmail.com', phone: '0907000022', gender: 'FEMALE' },
    { name: 'Trịnh Quốc Thái', email: 'quocthai@gmail.com', phone: '0907000023', gender: 'MALE' },
    { name: 'Ngô Gia Huy', email: 'giahuy@gmail.com', phone: '0907000024', gender: 'MALE' },
    { name: 'Vương Thúy Kiều', email: 'thuykieu@gmail.com', phone: '0907000025', gender: 'FEMALE' },
    { name: 'Phan Hải Đăng', email: 'haidang@gmail.com', phone: '0907000026', gender: 'MALE' },
    { name: 'Lâm Bích Ngọc', email: 'bichngoc@gmail.com', phone: '0907000027', gender: 'FEMALE' },
    { name: 'Dương Minh Khang', email: 'minhkhang@gmail.com', phone: '0907000028', gender: 'MALE' },
    { name: 'Tạ Thanh Thảo', email: 'thanhthao@gmail.com', phone: '0907000029', gender: 'FEMALE' },
    { name: 'Cao Tuấn Anh', email: 'tuananh@gmail.com', phone: '0907000030', gender: 'MALE' },
  ];

  const customerUserIds: number[] = [2]; // 2 là Trần Thị Thu Hà có sẵn
  for (const c of customersData) {
    const res = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, gender, nationality, status, created_at)
       VALUES ($1, $2, $3, $4, 'CUSTOMER', $5, 'Việt Nam', 'ACTIVE', '2026-07-01 08:00:00')
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING user_id`,
      [c.name, c.email, c.phone, DEFAULT_HASH, c.gender]
    );
    customerUserIds.push(res.rows[0].user_id);
  }
  console.log(`✅ Đã chuẩn bị ${customerUserIds.length} tài khoản khách hàng.`);

  // 3. Tạo tài khoản Nhân viên đối tác (Partner Employees) cho các thương hiệu chính
  const employeeAccounts = [
    { name: 'Nguyễn Văn Đệ Nhất', email: 'employee_denhat@voucher.vn', phone: '0903000001', partnerIndex: 0 },
    { name: 'Trần Thị Towa', email: 'employee_towa@voucher.vn', phone: '0903000002', partnerIndex: 1 },
    { name: 'Lê Văn Úc Châu', email: 'employee_ucchau@voucher.vn', phone: '0903000003', partnerIndex: 2 },
    { name: 'Phạm Thị Suki Nails', email: 'employee_suki@voucher.vn', phone: '0903000004', partnerIndex: 3 },
    { name: 'Hoàng Văn Suối Tiên', email: 'employee_suoitien@voucher.vn', phone: '0903000005', partnerIndex: 4 },
    { name: 'Vũ Thị Đầm Sen', email: 'employee_damsen@voucher.vn', phone: '0903000006', partnerIndex: 5 },
  ];

  for (const emp of employeeAccounts) {
    const partner = partners[emp.partnerIndex % partners.length];
    const branch = branches.find((b) => b.partner_id === partner.partner_id) || branches[0];

    const uRes = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, status, created_at)
       VALUES ($1, $2, $3, $4, 'PARTNER_EMPLOYEE', 'ACTIVE', '2026-07-10 09:00:00')
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING user_id`,
      [emp.name, emp.email, emp.phone, DEFAULT_HASH]
    );
    const empUserId = uRes.rows[0].user_id;

    if (branch) {
      await pool.query(
        `INSERT INTO partner_employees (user_id, branch_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET branch_id = EXCLUDED.branch_id`,
        [empUserId, branch.branch_id]
      );

      await pool.query(
        `INSERT INTO partner_employee_approval_requests (user_id, admin_id, submitted_at, reviewed_at, approval_status, admin_feedback)
         VALUES ($1, 1, '2026-07-10 09:10:00', '2026-07-10 10:00:00', 'APPROVED', 'Duyệt nhân viên đối tác')`,
        [empUserId]
      );
    }
  }
  console.log(`✅ Đã tạo ${employeeAccounts.length} tài khoản nhân viên đối tác liên kết chi nhánh.`);

  // 4. Tạo chương trình Pending để demo phê duyệt Admin
  if (partners.length > 0) {
    const p1 = partners[0];
    await pool.query(
      `INSERT INTO voucher_programs (partner_id, category_id, program_name, original_price, sale_price, issue_quantity, sale_start_at, sale_end_at, use_start_at, use_end_at, display_status)
       VALUES ($1, 1, 'Set Menu Thượng Hạng Mùa Thu 2026 (Chờ Duyệt Mẫu)', 500000.00, 350000.00, 200, '2026-08-25 00:00:00', '2026-12-31 23:59:59', '2026-08-25 00:00:00', '2027-01-31 23:59:59', 'PENDING_APPROVAL')
       ON CONFLICT DO NOTHING`,
      [p1.partner_id]
    );
  }

  // 5. Xóa dữ liệu giao dịch cũ trước khi nạp giao dịch phong phú
  await pool.query(`
    DELETE FROM system_logs;
    DELETE FROM reviews_feedback;
    DELETE FROM order_cancellations;
    DELETE FROM issued_vouchers;
    DELETE FROM order_items;
    DELETE FROM orders;
  `);

  // 6. Danh sách các mốc thời gian trải dài theo thời gian hiện tại
  const now = new Date();
  const formatSqlDate = (d: Date) => d.toISOString().replace('T', ' ').substring(0, 19);
  const addHours = (d: Date, h: number) => new Date(d.getTime() + h * 3600000);
  const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);

  const timeTemplates = [
    // Hôm nay (Live Today)
    { date: formatSqlDate(addHours(now, -1)), status: 'PAID', count: 8 },
    { date: formatSqlDate(addHours(now, -3)), status: 'PAID', count: 6 },
    { date: formatSqlDate(addHours(now, -5)), status: 'PAID', count: 5 },
    { date: formatSqlDate(addHours(now, -2)), status: 'UNPAID', count: 2 },
    // Hôm qua
    { date: formatSqlDate(addDays(now, -1)), status: 'PAID', count: 13 },
    // Tuần này (2 - 4 ngày trước)
    { date: formatSqlDate(addDays(now, -2)), status: 'PAID', count: 8 },
    { date: formatSqlDate(addDays(now, -3)), status: 'PAID', count: 7 },
    { date: formatSqlDate(addDays(now, -4)), status: 'PAID', count: 6 },
    { date: formatSqlDate(addDays(now, -5)), status: 'PAID', count: 8 },
    // Tuần trước (7 - 13 ngày trước)
    { date: formatSqlDate(addDays(now, -7)), status: 'PAID', count: 9 },
    { date: formatSqlDate(addDays(now, -9)), status: 'PAID', count: 8 },
    { date: formatSqlDate(addDays(now, -11)), status: 'PAID', count: 7 },
    { date: formatSqlDate(addDays(now, -13)), status: 'PAID', count: 6 },
    // Tháng trước (15 - 30 ngày trước)
    { date: formatSqlDate(addDays(now, -18)), status: 'PAID', count: 8 },
    { date: formatSqlDate(addDays(now, -22)), status: 'PAID', count: 7 },
    { date: formatSqlDate(addDays(now, -26)), status: 'PAID', count: 8 },
    { date: formatSqlDate(addDays(now, -30)), status: 'PAID', count: 6 },
  ];

  const paymentMethods = ['MOMO', 'VNPAY', 'CREDIT_CARD', 'ZALOPAY'];
  let orderCounter = 0;
  let voucherCounter = 0;
  let reviewCounter = 0;

  const sampleReviews = [
    'Dịch vụ rất tốt, nhân viên thân thiện và chu đáo!',
    'Không gian đẹp, món ăn ngon chuẩn vị, quét mã voucher nhanh gọn.',
    'Trải nghiệm tuyệt vời, giá ưu đãi rất hời so với chất lượng thực tế.',
    'Khu vui chơi nhiều trò thú vị, các bé nhà mình rất thích!',
    'Liệu trình massage thư giãn, cơ thể nhẹ nhõm hẳn sau khi làm.',
    'Quá hời! Đã rủ bạn bè mua thêm voucher thứ hai.',
    'Nhân viên hỗ trợ nhiệt tình, làm thủ tục check-in chưa tới 1 phút.',
  ];

  for (const t of timeTemplates) {
    for (let i = 0; i < t.count; i++) {
      orderCounter++;
      const buyerId = customerUserIds[orderCounter % customerUserIds.length];
      // Chọn đều các voucher programs khắp tất cả danh mục
      const prog = programs[(orderCounter * 7 + i) % programs.length];
      const qty = (orderCounter % 3) + 1; // 1, 2, hoặc 3 voucher
      const unitPrice = parseFloat(prog.sale_price);
      const totalAmount = unitPrice * qty;
      const payMethod = paymentMethods[orderCounter % paymentMethods.length];
      const isPaid = t.status === 'PAID';
      const orderStatus = isPaid ? 'COMPLETED' : 'PENDING';

      // Tạo Order
      const orderRes = await pool.query(
        `INSERT INTO orders (buyer_user_id, total_amount, payment_method, payment_status, order_status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING order_id`,
        [buyerId, totalAmount, payMethod, t.status, orderStatus, t.date]
      );
      const orderId = orderRes.rows[0].order_id;

      // Tạo Order Item
      const itemRes = await pool.query(
        `INSERT INTO order_items (order_id, program_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)
         RETURNING order_item_id`,
        [orderId, prog.program_id, qty, unitPrice]
      );
      const orderItemId = itemRes.rows[0].order_item_id;

      // Nếu đã thanh toán, phát hành Issued Vouchers
      if (isPaid) {
        for (let q = 0; q < qty; q++) {
          voucherCounter++;
          const code = `VCH-${prog.program_id}-${orderId}${q}${String(voucherCounter).padStart(3, '0')}`;
          const qrUrl = `https://qr.voucher.vn/${code}`;

          // Tỷ lệ sử dụng: 65% USED, 30% UNUSED, 5% EXPIRED
          let usageStatus = 'USED';
          let usedAt: string | null = t.date;
          if (voucherCounter % 10 === 0) {
            usageStatus = 'EXPIRED';
            usedAt = null;
          } else if (voucherCounter % 3 === 0) {
            usageStatus = 'UNUSED';
            usedAt = null;
          }

          const discountAmount = parseFloat(prog.original_price) - parseFloat(prog.sale_price);

          const voucherRes = await pool.query(
            `INSERT INTO issued_vouchers (program_id, order_item_id, owner_user_id, voucher_code, qr_code, usage_status, issued_at, expires_at, applicable_region, used_at, discount_amount)
             VALUES ($1, $2, $3, $4, $5, $6, $7, '2027-01-31 23:59:59', 'Miền Nam', $8, $9)
             RETURNING issued_voucher_id`,
            [prog.program_id, orderItemId, buyerId, code, qrUrl, usageStatus, t.date, usedAt, discountAmount]
          );
          const issuedVoucherId = voucherRes.rows[0].issued_voucher_id;

          // Nếu voucher đã dùng và tỷ lệ chẵn -> Thêm Đánh giá feedback
          if (usageStatus === 'USED' && voucherCounter % 2 === 0) {
            reviewCounter++;
            const rating = reviewCounter % 5 === 0 ? 4 : 5;
            const reviewText = sampleReviews[reviewCounter % sampleReviews.length];
            await pool.query(
              `INSERT INTO reviews_feedback (issued_voucher_id, customer_id, rating, review_content, submitted_at)
               VALUES ($1, $2, $3, $4, $5)`,
              [issuedVoucherId, buyerId, rating, reviewText, t.date]
            );
          }
        }
      }
    }
  }

  console.log(`✅ Đã tạo thành công ${orderCounter} đơn hàng và ${voucherCounter} voucher phát hành.`);

  // 7. Tạo Nhật ký hệ thống (System Logs) phong phú cho Admin & Partner
  const logEntries = [
    { userId: 1, action: 'LOGIN', objId: '1', objType: 'USER', res: 'SUCCESS', date: '2026-08-22 08:00:00' },
    { userId: 1, action: 'APPROVE_PARTNER', objId: '101', objType: 'PARTNER', res: 'SUCCESS', date: '2026-08-22 08:15:00' },
    { userId: 1, action: 'APPROVE_VOUCHER_PROGRAM', objId: '2', objType: 'VOUCHER_PROGRAM', res: 'SUCCESS', date: '2026-08-22 08:30:00' },
    { userId: 2, action: 'CREATE_ORDER', objId: '1', objType: 'ORDER', res: 'SUCCESS', date: '2026-08-22 09:05:00' },
    { userId: 2, action: 'USE_VOUCHER', objId: '1', objType: 'ISSUED_VOUCHER', res: 'SUCCESS', date: '2026-08-22 12:30:00' },
    { userId: 2, action: 'CREATE_REVIEW', objId: '1', objType: 'REVIEW_FEEDBACK', res: 'SUCCESS', date: '2026-08-22 13:00:00' },
    { userId: customerUserIds[1], action: 'CREATE_ORDER', objId: '2', objType: 'ORDER', res: 'SUCCESS', date: '2026-08-22 14:00:00' },
    { userId: customerUserIds[2], action: 'CREATE_ORDER', objId: '3', objType: 'ORDER', res: 'SUCCESS', date: '2026-08-22 14:30:00' },
    { userId: customerUserIds[3], action: 'USE_VOUCHER', objId: '5', objType: 'ISSUED_VOUCHER', res: 'SUCCESS', date: '2026-08-22 15:00:00' },
  ];

  for (const log of logEntries) {
    await pool.query(
      `INSERT INTO system_logs (user_id, action, object_id, object_type, performed_at, result)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [log.userId, log.action, log.objId, log.objType, log.date, log.res]
    );
  }
  console.log(`✅ Đã tạo nhật ký hệ thống audit log.`);

  // 8. Cập nhật lại Identity Sequence cho các bảng
  await pool.query(`
    SELECT setval(pg_get_serial_sequence('users', 'user_id'), (SELECT COALESCE(MAX(user_id), 1) FROM users));
    SELECT setval(pg_get_serial_sequence('orders', 'order_id'), (SELECT COALESCE(MAX(order_id), 1) FROM orders));
    SELECT setval(pg_get_serial_sequence('order_items', 'order_item_id'), (SELECT COALESCE(MAX(order_item_id), 1) FROM order_items));
    SELECT setval(pg_get_serial_sequence('issued_vouchers', 'issued_voucher_id'), (SELECT COALESCE(MAX(issued_voucher_id), 1) FROM issued_vouchers));
    SELECT setval(pg_get_serial_sequence('reviews_feedback', 'review_id'), (SELECT COALESCE(MAX(review_id), 1) FROM reviews_feedback));
    SELECT setval(pg_get_serial_sequence('system_logs', 'log_id'), (SELECT COALESCE(MAX(log_id), 1) FROM system_logs));
    SELECT setval(pg_get_serial_sequence('partner_employee_approval_requests', 'approval_request_id'), (SELECT COALESCE(MAX(approval_request_id), 1) FROM partner_employee_approval_requests));
  `);

  console.log('🎉 Hoàn thành nạp dữ liệu giao dịch mẫu thành công!');
  await pool.end();
}

seedTransactions().catch((err) => {
  console.error('Lỗi seed transactions:', err);
  process.exit(1);
});
