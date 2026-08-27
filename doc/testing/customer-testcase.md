# Đặc Tả Ca Kiểm Thử Trang Khách Hàng (Customer Portal Test Cases)

- **Dự án**: Hệ thống E-Voucher (E-Voucher Web Application)
- **Phân hệ**: Khách hàng (Customer Portal)
- **Kỹ thuật áp dụng chính**: Equivalence Partitioning (EP) & Boundary Value Analysis (BVA)
- **Phương thức thực hiện**: Automated Testing (Playwright) kết hợp Manual Verification

---

## 1. Phân Hệ Xác Thực & Đăng Ký (BR-CUS-01, 02)

| Test Case ID | Tên Ca Kiểm Thử | Phân Loại / Kỹ Thuật | Tiền Điều Kiện | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Kỳ Vọng | Mức Độ Ưu Tiên |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_REG_01** | Báo lỗi SĐT 9 số | BVA (Biên dưới) | Đang ở form đăng ký | 1. Nhập SĐT 9 chữ số.<br>2. Nhập các thông tin khác hợp lệ.<br>3. Bấm Đăng ký. | `phone = "090123456"` | Báo lỗi: "Vui lòng nhập định dạng Email hoặc Số điện thoại hợp lệ." | High |
| **TC_REG_02** | Báo lỗi SĐT 11 số | BVA (Biên trên) | Đang ở form đăng ký | 1. Nhập SĐT 11 chữ số (bắt đầu bằng số 0).<br>2. Bấm Đăng ký. | `phone = "09012345678"` | Báo lỗi: "Vui lòng nhập định dạng Email hoặc Số điện thoại hợp lệ." | High |
| **TC_REG_03** | Báo lỗi mật khẩu 7 ký tự | BVA (Biên dưới) | Đang ở form đăng ký | 1. Nhập mật khẩu 7 ký tự (đủ đk hoa, thường, đặc biệt).<br>2. Bấm Đăng ký. | `password = "Pass@12"` | Báo lỗi: "Mật khẩu phải dài tối thiểu 8 ký tự..." | High |
| **TC_REG_04** | Lỗi mật khẩu thiếu chữ hoa và ký tự đặc biệt | EP (Miền không hợp lệ) | Đang ở form đăng ký | 1. Nhập mật khẩu dài > 8 ký tự nhưng thiếu chữ hoa và ký tự đặc biệt.<br>2. Bấm Đăng ký. | `password = "password123"` | Báo lỗi: "Mật khẩu phải dài tối thiểu 8 ký tự..." | High |
| **TC_REG_05** | Đăng ký thành công | EP (Miền hợp lệ) | Đang ở form đăng ký | 1. Nhập SĐT hợp lệ và mật khẩu hợp lệ.<br>2. Bấm Đăng ký. | `phone = "0901234567"`, `password = "Valid@1234"` | Chuyển hướng sang màn hình Xác thực OTP thành công | High |
| **TC_LOGIN_01** | Đăng nhập sai thông tin | EP (Miền không hợp lệ) | Đang ở form đăng nhập | 1. Nhập email/SĐT sai.<br>2. Nhập mật khẩu sai.<br>3. Bấm Đăng nhập. | `email = "wrong@email.com"` | Báo lỗi: "Tài khoản hoặc mật khẩu không chính xác" | High |
| **TC_FORGOT_01** | Yêu cầu reset mật khẩu | EP (Miền hợp lệ) | Đang ở form Quên mật khẩu | 1. Nhập email tồn tại.<br>2. Bấm Gửi yêu cầu. | `email = "test@test.com"` | Hiển thị thông báo "Mã OTP đã được gửi đến email của bạn." | Medium |

---

## 2. Phân Hệ Tìm Kiếm & Khám Phá (BR-CUS-03, 04)

| Test Case ID | Tên Ca Kiểm Thử | Phân Loại / Kỹ Thuật | Tiền Điều Kiện | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Kỳ Vọng | Mức Độ Ưu Tiên |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_DISC_01** | Hiển thị Homepage | N/A | Truy cập trang chủ | 1. Mở trang chủ.<br>2. Kiểm tra layout. | N/A | Hiển thị đầy đủ Banner, Danh mục và Danh sách Voucher nổi bật | High |
| **TC_DISC_02** | Tìm kiếm từ khóa không tồn tại | EP (Miền rỗng) | Đang ở trang Danh sách | 1. Nhập từ khóa không có thật.<br>2. Nhấn Enter. | `keyword = "KhongTonTai123XYZ"` | Hiển thị thông báo "Không tìm thấy kết quả" hoặc danh sách trống | Medium |
| **TC_DISC_03** | Lọc theo danh mục | EP (Miền hợp lệ) | Đang ở trang Danh sách | 1. Click chọn một danh mục (vd: Ẩm thực). | `category = "Ẩm thực"` | Danh sách voucher hiển thị kết quả tương ứng | High |
| **TC_DISC_04** | Xem chi tiết Voucher | N/A | Đang ở trang Danh sách | 1. Click vào một thẻ voucher bất kỳ. | N/A | Chuyển hướng sang trang chi tiết, hiển thị điều kiện áp dụng, hạn sử dụng, mô tả | High |

---

## 3. Phân Hệ Đặt Hàng & Giỏ Hàng (BR-CUS-05, 06)

| Test Case ID | Tên Ca Kiểm Thử | Phân Loại / Kỹ Thuật | Tiền Điều Kiện | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Kỳ Vọng | Mức Độ Ưu Tiên |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_CART_01** | Thêm voucher vào giỏ | N/A | Trang chi tiết Voucher | 1. Nhấn nút "Thêm vào giỏ". | N/A | Thông báo "Đã thêm vào giỏ hàng" hoặc "Thành công" | High |
| **TC_CART_02** | Kiểm tra thông tin giỏ hàng | N/A | Đã có SP trong giỏ | 1. Mở trang Giỏ hàng `/cart`. | N/A | Hiển thị tổng thanh toán và nút "Tiến hành đặt hàng" | High |
| **TC_CHK_01** | Bật tùy chọn tặng quà | Khảo sát luồng | Đang ở trang Giỏ hàng | 1. Tick vào checkbox Tặng quà người thân. | `isGift = true` | Hiển thị form nhập thông tin người nhận (Họ tên, Email/SĐT) | Medium |
| **TC_CHK_02** | Thanh toán khi chưa đăng nhập | Phân quyền | Có SP trong giỏ, chưa Login | 1. Bấm Tiến hành đặt hàng. | N/A | Chuyển hướng sang form Yêu cầu đăng nhập | High |

---

## 4. Phân Hệ Kho Voucher & Đánh Giá (BR-CUS-07, 08)

| Test Case ID | Tên Ca Kiểm Thử | Phân Loại / Kỹ Thuật | Tiền Điều Kiện | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Kỳ Vọng | Mức Độ Ưu Tiên |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_INV_01** | Truy cập kho Voucher | N/A | Đã đăng nhập | 1. Mở `/my-vouchers`. | N/A | Hiển thị giao diện "Voucher của tôi" hoặc yêu cầu đăng nhập nếu phiên hết hạn | High |
| **TC_INV_02** | Xem mã QR chi tiết | N/A | Đã mua thành công | 1. Click vào voucher đã mua. | N/A | Hiển thị QR Code, Mã phát hành, Trạng thái, Hạn sử dụng | High |
| **TC_REV_01** | Gửi đánh giá phản hồi | N/A | Voucher đã được sử dụng | 1. Nhấn nút "Đánh giá".<br>2. Nhập nội dung. | `content = "Tuyệt vời"` | Đóng form và hiển thị thông báo gửi đánh giá thành công | Medium |
