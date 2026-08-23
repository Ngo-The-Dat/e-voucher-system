/**
 * @file test-admin-pending.ts
 * @description Kiểm tra các API truy vấn danh sách chờ duyệt của Admin:
 * - Đối tác chờ duyệt
 * - Nhân viên đối tác chờ duyệt
 * - Voucher chờ duyệt
 */

import { getPendingPartners } from '../services/admin/partner.service.js';
import { getPendingEmployees } from '../services/admin/employee-approval.service.js';
import { getPendingVouchers } from '../services/admin/voucher.service.js';
import pool from '../config/db.js';

async function testAdminPending() {
  console.log('🔍 === KIỂM TRA HÀNG ĐỢI XÉT DUYỆT ADMIN ===');

  // 1. Đối tác chờ duyệt
  const partnersResult = await getPendingPartners({ page: 1, limit: 10 });
  console.log(`\n🏢 [1] ĐỐI TÁC CHỜ DUYỆT (Tổng: ${partnersResult.pagination.total})`);
  console.table(
    partnersResult.partners.map((p) => ({
      ID: p.user_id,
      'Tên Doanh Nghiệp': p.business_name,
      MST: p.tax_code,
      'Đại Diện': p.representative_name,
      Email: p.email,
      'Chi Nhánh': p.branches_count,
      'Trạng Thái': p.approval_status
    }))
  );

  // 2. Nhân viên đối tác chờ duyệt
  const employeesResult = await getPendingEmployees({ page: 1, limit: 10 });
  console.log(`\n👨‍💼 [2] NHÂN VIÊN ĐỐI TÁC CHỜ DUYỆT (Tổng: ${employeesResult.pagination.total})`);
  console.table(
    employeesResult.employees.map((e) => ({
      ID: e.user_id,
      'Họ Tên': e.full_name,
      Email: e.email,
      SĐT: e.phone,
      CCCD: e.identity_no,
      'Đối Tác': e.business_name,
      'Chi Nhánh': e.branch_name,
      'Trạng Thái': e.approval_status
    }))
  );

  // 3. Voucher chờ duyệt
  const vouchersResult = await getPendingVouchers({ page: 1, limit: 10 });
  console.log(`\n🎟️ [3] VOUCHER CHỜ DUYỆT (Tổng: ${vouchersResult.pagination.total})`);
  console.table(
    vouchersResult.vouchers.map((v) => ({
      ID: v.program_id,
      'Tên Chương Trình': v.program_name.substring(0, 45) + '...',
      'Danh Mục': v.category_name,
      'Giá Gốc': v.original_price,
      'Giá Bán': v.sale_price,
      'SL Phát Hành': v.issue_quantity,
      'Đối Tác': v.partner_name,
      'Trạng Thái': v.approval_status
    }))
  );

  await pool.end();
}

testAdminPending().catch((err) => {
  console.error('Lỗi kiểm tra admin pending:', err);
  process.exit(1);
});
