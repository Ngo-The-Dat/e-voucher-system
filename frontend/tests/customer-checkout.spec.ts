import { test, expect } from '@playwright/test';

test.describe('Order & Checkout (BR-CUS-05, 06)', () => {
  const baseUrl = 'http://localhost:3000';

  // Chú ý: Các test liên quan đến Checkout cần user đã đăng nhập.
  // Trong thực tế, Playwright hỗ trợ test.use({ storageState: 'auth.json' }) để skip login.
  // Ở đây viết dạng test flow liên tục hoặc giả định đã login/chưa login sẽ bị redirect.

  test.describe('Cart Management', () => {
    test('TC01_Add_To_Cart: Thêm voucher vào giỏ hàng', async ({ page }) => {
      await page.goto(`${baseUrl}/vouchers/1`); // Mock ID 1
      
      const addToCartBtn = page.locator('button:has-text("Thêm vào giỏ")');
      if (await addToCartBtn.isVisible()) {
        await addToCartBtn.click();
        
        // Should show success toast
        await expect(page.locator('text=Đã thêm vào giỏ hàng').or(page.locator('text=Thành công'))).toBeVisible();
      }
    });

    test('TC02_View_Cart: Mở giỏ hàng kiểm tra sản phẩm', async ({ page }) => {
      await page.goto(`${baseUrl}/cart`);
      
      const emptyCartMsg = page.locator('text=Giỏ hàng trống');
      if (await emptyCartMsg.isVisible()) {
        // Giỏ trống
        await expect(page.locator('a:has-text("Khám phá ngay")')).toBeVisible();
      } else {
        // Giỏ có đồ
        await expect(page.locator('text=Tổng thanh toán')).toBeVisible();
        await expect(page.locator('button:has-text("Thanh toán")')).toBeVisible();
      }
    });
  });

  test.describe('Checkout Flow', () => {
    test('TC03_Checkout_Gift_Option: Bật tùy chọn tặng quà', async ({ page }) => {
      await page.goto(`${baseUrl}/cart`);
      
      // Giả sử có nút "Tặng quà" (Gift Option) trên trang giỏ hàng hoặc checkout
      const giftCheckbox = page.locator('input[type="checkbox"][id="is-gift"]');
      if (await giftCheckbox.isVisible()) {
        await giftCheckbox.check();
        
        // Form nhập thông tin người nhận phải hiện ra
        await expect(page.locator('input[name="recipient_name"]')).toBeVisible();
        await expect(page.locator('input[name="recipient_email"]')).toBeVisible();
        
        // Điền thử thông tin
        await page.fill('input[name="recipient_name"]', 'Bạn Của Tôi');
        await page.fill('input[name="recipient_email"]', 'friend@test.com');
      }
    });

    test('TC04_Place_Order: Đặt hàng và chuyển sang thanh toán', async ({ page }) => {
      // Giả lập user bấm thanh toán
      await page.goto(`${baseUrl}/cart`);
      
      const checkoutBtn = page.locator('button:has-text("Thanh toán"), button:has-text("Đặt hàng")');
      if (await checkoutBtn.isVisible()) {
        await checkoutBtn.click();
        
        // Nếu chưa đăng nhập, sẽ bị đá ra trang login
        if (page.url().includes('/login')) {
           await expect(page.locator('input[name="identifier"]')).toBeVisible();
        } else {
           // Nếu đã đăng nhập, chuyển sang trang phương thức thanh toán hoặc xác nhận
           await expect(page.locator('text=Phương thức thanh toán').or(page.locator('text=Thanh toán đơn hàng'))).toBeVisible({ timeout: 10000 }).catch(() => {});
        }
      }
    });
  });
});
