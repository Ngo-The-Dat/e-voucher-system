import { getDashboardOverview } from '../services/admin/dashboard.service.js';
import { getOverview } from '../services/partner/dashboard.service.js';
import pool from '../config/db.js';

async function test() {
  console.log('📊 === TEST ADMIN DASHBOARD METRICS (Hôm nay, Tuần này, Tháng này) ===');
  const todayOverview = await getDashboardOverview({ timeframe: 'today' });
  console.log('\n--- KPI HÔM NAY (TODAY) ---');
  console.table(todayOverview.stats.map(s => ({ title: s.title, value: s.value, change: s.change, trend: s.trend })));
  console.log('\n--- HIỆU QUẢ VẬN HÀNH ---');
  console.table(todayOverview.efficiencyMetrics.map(e => ({ title: e.title, value: e.value, rate: e.rate })));
  console.log('\n--- PHÂN TÍCH THEO DANH MỤC ---');
  console.table(todayOverview.categoryPerformance);

  const weekOverview = await getDashboardOverview({ timeframe: 'week' });
  console.log('\n--- KPI TUẦN NÀY (THIS WEEK) ---');
  console.table(weekOverview.stats.map(s => ({ title: s.title, value: s.value, change: s.change, trend: s.trend })));

  const firstPartnerRes = await pool.query(`SELECT user_id, business_name FROM partners ORDER BY user_id ASC LIMIT 1`);
  if (firstPartnerRes.rows.length > 0) {
    const partnerId = Number(firstPartnerRes.rows[0].user_id);
    const partnerName = firstPartnerRes.rows[0].business_name;
    console.log(`\n🏬 === TEST PARTNER DASHBOARD (Partner ID ${partnerId} - ${partnerName}) ===`);
    const partnerOverview = await getOverview(partnerId);
    console.table(partnerOverview);
  }

  await pool.end();
}

test().catch(console.error);
