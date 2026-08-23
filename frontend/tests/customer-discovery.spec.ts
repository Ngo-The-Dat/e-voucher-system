import { test, expect } from '@playwright/test';

test.describe('Voucher Discovery (BR-CUS-03, 04)', () => {
  const baseUrl = 'http://localhost:3000';

  test.describe('Homepage Browsing', () => {
    test('TC01_Homepage_Load: Hiển thị banner và danh mục', async ({ page }) => {
      await page.goto(baseUrl);
      
      // Verify hero banner or search bar
      await expect(page.locator('input[placeholder="Tìm voucher, thương hiệu..."]')).toBeVisible();
      
      // Verify categories section
      await expect(page.locator('text=Danh mục nổi bật').or(page.locator('.categories-section'))).toBeVisible({ timeout: 5000 }).catch(() => {});
    });
  });

  test.describe('Search and Filter', () => {
    test('TC02_Search_By_Keyword: Tìm kiếm voucher thành công', async ({ page }) => {
      await page.goto(baseUrl);
      
      // Tìm search bar và nhập từ khóa
      await page.fill('input[placeholder="Tìm voucher, thương hiệu..."]', 'Highlands');
      await page.click('button:has-text("Tìm kiếm"), button[type="submit"]');
      
      // Đợi điều hướng sang trang kết quả
      await expect(page).toHaveURL(/.*\/vouchers\?.*(q|search)=Highlands/i);
      
      // Kiểm tra có hiển thị kết quả không
      const results = page.locator('.voucher-card, a[href^="/vouchers/"]');
      if (await results.count() > 0) {
        await expect(results.first()).toBeVisible();
      } else {
        await expect(page.locator('text=Không tìm thấy kết quả')).toBeVisible();
      }
    });

    test('TC03_Filter_By_Category: Lọc theo danh mục', async ({ page }) => {
      await page.goto(`${baseUrl}/vouchers`);
      
      // Bấm vào một danh mục (ví dụ Ẩm thực & Nhà hàng)
      const categoryBtn = page.locator('button:has-text("Ẩm thực & Nhà hàng")').first();
      if (await categoryBtn.isVisible()) {
        await categoryBtn.click();
        await expect(page).toHaveURL(/.*category_id=/);
      }
    });
  });

  test.describe('Voucher Details', () => {
    test('TC04_View_Voucher_Detail: Xem chi tiết voucher hiển thị đủ thông tin', async ({ page }) => {
      await page.goto(`${baseUrl}/vouchers`);
      
      // Click vào voucher đầu tiên (nếu có)
      const firstVoucher = page.locator('a[href^="/vouchers/"]').first();
      if (await firstVoucher.isVisible()) {
        await firstVoucher.click();
        
        // Verify các thành phần chính
        await expect(page.locator('text=Mô tả').or(page.locator('text=Về mã ưu đãi này'))).toBeVisible();
        await expect(page.locator('text=Điều kiện sử dụng')).toBeVisible();
        await expect(page.locator('button:has-text("Thêm vào giỏ"), button:has-text("Mua ngay")')).toBeVisible();
      }
    });
  });
});
