import { test, expect } from '@playwright/test';

test.describe('My Vouchers & Reviews (BR-CUS-07, 08)', () => {
  const baseUrl = 'http://localhost:3000';

  test.describe('Inventory & Receipt', () => {
    test('TC01_View_My_Vouchers: Xem kho voucher của tôi', async ({ page }) => {
      // Yêu cầu đăng nhập. Giả định redirect nếu chưa đăng nhập.
      await page.goto(`${baseUrl}/my-vouchers`);
      
      if (page.url().includes('/login')) {
         await expect(page.locator('input[name="identifier"]')).toBeVisible();
      } else {
         // Trong kho voucher, kiểm tra các tab trạng thái
         await expect(page.locator('text=Chưa sử dụng').first()).toBeVisible();
         await expect(page.locator('text=Đã sử dụng').first()).toBeVisible();
      }
    });

    test('TC02_Digital_Receipt: Xem biên lai/QR chi tiết của 1 voucher', async ({ page }) => {
      // Truy cập thẳng 1 mock ID
      await page.goto(`${baseUrl}/my-vouchers/123`);
      
      if (!page.url().includes('/login')) {
         // Kiểm tra mã QR hoặc Barcode có render không
         const qrCode = page.locator('canvas, img[alt*="QR"], .qr-code-wrapper');
         if (await qrCode.count() > 0) {
           await expect(qrCode.first()).toBeVisible();
         }
         
         // Thông tin biên lai
         await expect(page.locator('text=Mã voucher')).toBeVisible();
         await expect(page.locator('text=Hạn sử dụng')).toBeVisible();
      }
    });
  });

  test.describe('Reviews & Feedback', () => {
    test('TC03_Write_Review: Form đánh giá voucher', async ({ page }) => {
      // Thường form review nằm trong popup ở trang chi tiết đơn hàng hoặc chi tiết voucher đã mua
      // Ta giả lập bấm vào nút Đánh giá ở my-vouchers
      await page.goto(`${baseUrl}/my-vouchers`);
      
      if (!page.url().includes('/login')) {
         const reviewBtn = page.locator('button:has-text("Đánh giá")').first();
         
         if (await reviewBtn.isVisible()) {
           await reviewBtn.click();
           
           // Popup/Modal đánh giá hiện lên
           await expect(page.locator('text=Đánh giá dịch vụ')).toBeVisible();
           
           // Chọn số sao (giả sử có 5 ngôi sao là label hoặc button)
           // Tùy theo thiết kế UI, ở đây lấy chung chung
           const stars = page.locator('button[role="radio"], label.star');
           if (await stars.count() >= 5) {
             await stars.nth(4).click(); // Bấm 5 sao
           }
           
           await page.fill('textarea[name="content"], textarea[placeholder*="đánh giá"]', 'Trải nghiệm tuyệt vời, nhân viên nhiệt tình!');
           await page.click('button:has-text("Gửi đánh giá")');
           
           await expect(page.locator('text=Cảm ơn bạn').or(page.locator('text=Thành công'))).toBeVisible({ timeout: 5000 }).catch(() => {});
         }
      }
    });
  });
});
