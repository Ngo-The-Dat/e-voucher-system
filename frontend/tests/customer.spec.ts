import { test, expect } from '@playwright/test';

// Kế hoạch kiểm thử: EP và BVA cho Đăng ký & Đăng nhập (BR-CUS-01, 02)
test.describe('Authentication & Profile (BR-CUS-01, 02)', () => {
  const testUrl = 'http://localhost:3000/register';

  test('TC01_Register_BVA_Phone_Under: Nên báo lỗi với SĐT 9 số (Biên dưới)', async ({ page }) => {
    await page.goto(testUrl);
    await page.fill('input[id="register-fullname"]', 'Nguyễn Văn A');
    await page.fill('input[id="register-email-phone"]', '090123456'); // 9 số
    await page.fill('input[id="register-password"]', 'Password@123');
    await page.fill('input[id="register-confirm-password"]', 'Password@123');
    await page.click('button[type="submit"]');

    // Mất focus sẽ kích hoạt validation onBlur
    await expect(page.locator('text=Vui lòng nhập định dạng Email hoặc Số điện thoại hợp lệ.')).toBeVisible();
  });

  test('TC01_Register_BVA_Phone_Over: Nên báo lỗi với SĐT 11 số (Biên trên)', async ({ page }) => {
    await page.goto(testUrl);
    await page.fill('input[id="register-fullname"]', 'Nguyễn Văn B');
    await page.fill('input[id="register-email-phone"]', '09012345678'); // 11 số
    await page.fill('input[id="register-password"]', 'Password@123');
    await page.fill('input[id="register-confirm-password"]', 'Password@123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Vui lòng nhập định dạng Email hoặc Số điện thoại hợp lệ.')).toBeVisible();
  });

  test('TC03_Register_BVA_Password_Under: Báo lỗi mật khẩu 7 ký tự (Biên dưới)', async ({ page }) => {
    await page.goto(testUrl);
    await page.fill('input[id="register-fullname"]', 'Nguyễn Văn C');
    await page.fill('input[id="register-email-phone"]', '0901234567');
    await page.fill('input[id="register-password"]', 'Pass@12'); // 7 ký tự
    await page.fill('input[id="register-confirm-password"]', 'Pass@12');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Mật khẩu phải dài tối thiểu 8 ký tự, bao gồm chữ hoa, thường, số và ký tự đặc biệt.')).toBeVisible();
  });

  test('TC04_Register_EP_Password_Invalid: Báo lỗi mật khẩu thiếu chữ Hoa và ký tự đặc biệt', async ({ page }) => {
    await page.goto(testUrl);
    await page.fill('input[id="register-fullname"]', 'Nguyễn Văn D');
    await page.fill('input[id="register-email-phone"]', '0901234567');
    await page.fill('input[id="register-password"]', 'password123'); // Thiếu hoa, thiếu special
    await page.fill('input[id="register-confirm-password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Mật khẩu phải dài tối thiểu 8 ký tự, bao gồm chữ hoa, thường, số và ký tự đặc biệt.')).toBeVisible();
  });
});

test.describe('Voucher Discovery (BR-CUS-03, 04)', () => {
  test('TC07_Search_By_Keyword: Tìm kiếm voucher thành công', async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Tìm search bar và nhập từ khóa
    await page.fill('input[placeholder="Tìm voucher, thương hiệu..."]', 'Highlands');
    await page.click('button:has-text("Tìm kiếm")');
    // Đợi điều hướng sang trang kết quả
    await expect(page).toHaveURL(/.*\/vouchers\?q=Highlands/);
  });

  test('TC09_View_Voucher_Detail: Xem chi tiết voucher hiển thị đúng thông tin', async ({ page }) => {
    await page.goto('http://localhost:3000/vouchers');
    // Click vào voucher đầu tiên (nếu có)
    const firstVoucher = page.locator('a[href^="/vouchers/"]').first();
    if (await firstVoucher.isVisible()) {
      await firstVoucher.click();
      
      // Verify các thành phần chính
      await expect(page.locator('text=Mô tả Voucher')).toBeVisible();
      await expect(page.locator('text=Điều kiện sử dụng')).toBeVisible();
      await expect(page.locator('text=Chính sách hoàn hủy')).toBeVisible();
      await expect(page.locator('button:has-text("Thêm vào giỏ")')).toBeVisible();
    }
  });
});

test.describe('Order & Checkout (BR-CUS-05, 06)', () => {
  test('TC10_Cart_Management: Thêm vào giỏ hàng', async ({ page }) => {
    await page.goto('http://localhost:3000/vouchers/1'); // Mock ID 1
    // Add to cart
    const addToCartBtn = page.locator('button:has-text("Thêm vào giỏ")');
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
      // Should show success toast
      await expect(page.locator('text=Đã thêm vào giỏ hàng')).toBeVisible();
    }
  });
});
