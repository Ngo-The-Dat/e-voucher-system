# Đặc Tả Ca Kiểm Thử Trang Đối Tác (Partner Portal Test Cases)

- **Dự án**: Hệ thống E-Voucher (E-Voucher Web Application)
- **Phân hệ**: Đối tác (Partner Portal)
- **Kỹ thuật áp dụng chính**: Equivalence Partitioning (EP) & Boundary Value Analysis (BVA)
- **Phương thức thực hiện**: Automated Testing (Playwright) kết hợp Manual Verification

---

## 1. Phân Hệ Đăng Ký Tài Khoản Đối Tác (`/partner/register`)

| Test Case ID | Tên Ca Kiểm Thử | Phân Loại / Kỹ Thuật | Tiền Điều Kiện | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Kỳ Vọng | Mức Độ Ưu Tiên |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_REG_01** | Kiểm tra MST dưới 10 số | BVA (Biên dưới - 1) | Đang ở Step 1 Đăng ký | 1. Nhập họ tên, email, CCCD hợp lệ.<br>2. Nhập MST 9 số.<br>3. Bấm "Tiếp tục". | `taxCode = "012345678"` (9 số) | Báo lỗi field: "Mã số thuế phải gồm 10 đến 13 chữ số" | High |
| **TC_REG_02** | Kiểm tra MST đúng 10 số | BVA (Biên dưới hợp lệ) | Đang ở Step 1 Đăng ký | 1. Điền toàn bộ thông tin hợp lệ.<br>2. Nhập MST đúng 10 số.<br>3. Bấm "Tiếp tục". | `taxCode = "0123456789"` (10 số) | Form hợp lệ, chuyển sang Step 2 (Xác thực OTP) | High |
| **TC_REG_03** | Kiểm tra MST 11-12 số | EP (Miền hợp lệ) | Đang ở Step 1 Đăng ký | 1. Điền thông tin hợp lệ.<br>2. Nhập MST 12 số.<br>3. Bấm "Tiếp tục". | `taxCode = "012345678901"` (12 số) | Form hợp lệ, chuyển sang Step 2 | Medium |
| **TC_REG_04** | Kiểm tra MST đúng 13 số | BVA (Biên trên hợp lệ) | Đang ở Step 1 Đăng ký | 1. Điền thông tin hợp lệ.<br>2. Nhập MST 13 số.<br>3. Bấm "Tiếp tục". | `taxCode = "0123456789012"` (13 số) | Form hợp lệ, chuyển sang Step 2 | High |
| **TC_REG_05** | Kiểm tra MST vượt 13 số | BVA (Biên trên + 1) | Đang ở Step 1 Đăng ký | 1. Điền thông tin hợp lệ.<br>2. Nhập MST 14 số.<br>3. Bấm "Tiếp tục". | `taxCode = "01234567890123"` (14 số) | Báo lỗi field: "Mã số thuế phải gồm 10 đến 13 chữ số" | High |
| **TC_REG_06** | Kiểm tra MST chứa ký tự chữ | EP (Miền không hợp lệ) | Đang ở Step 1 Đăng ký | 1. Nhập MST chứa chữ.<br>2. Bấm "Tiếp tục". | `taxCode = "01234ABCDE"` | Báo lỗi field: "Mã số thuế phải gồm 10 đến 13 chữ số" | High |
| **TC_REG_07** | Kiểm tra định dạng Email chuẩn | EP (Miền hợp lệ) | Đang ở Step 1 Đăng ký | 1. Nhập email đúng định dạng RFC.<br>2. Bấm "Tiếp tục". | `email = "partner.official@brand.vn"` | Trường email hợp lệ, không báo lỗi format | High |
| **TC_REG_08** | Kiểm tra Email thiếu ký tự @ | EP (Miền không hợp lệ) | Đang ở Step 1 Đăng ký | 1. Nhập email không chứa @.<br>2. Bấm "Tiếp tục". | `email = "plainaddress.com"` | Báo lỗi field: "Định dạng email không hợp lệ" | High |
| **TC_REG_09** | Kiểm tra độ dài mật khẩu 7 ký tự | BVA (Biên dưới - 1) | Đang ở Step 3 Đăng ký | 1. Nhập mật khẩu 7 ký tự.<br>2. Bấm "Hoàn tất". | `password = "Pass12!"` (7 chars) | Báo lỗi: "Mật khẩu phải có ít nhất 8 ký tự" | High |
| **TC_REG_10** | Kiểm tra độ dài mật khẩu 8 ký tự | BVA (Biên nhỏ nhất hợp lệ) | Đang ở Step 3 Đăng ký | 1. Nhập mật khẩu 8 ký tự.<br>2. Nhập xác nhận khớp.<br>3. Bấm "Hoàn tất". | `password = "Pass123!"` (8 chars) | Chấp nhận mật khẩu, chuyển sang Step 4 Hoàn tất | High |

---

## 2. Phân Hệ Tạo Chiến Dịch Voucher (`/partner/vouchers/create`)

| Test Case ID | Tên Ca Kiểm Thử | Phân Loại / Kỹ Thuật | Tiền Điều Kiện | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Kỳ Vọng | Mức Độ Ưu Tiên |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_VOUCHER_01** | Giá gốc bằng 0₫ | BVA (Biên 0) | Đang mở Form tạo Voucher | 1. Nhập Giá gốc = 0.<br>2. Nhấn Lưu chương trình. | `originalPrice = 0` | Báo lỗi: "Vui lòng nhập Giá gốc hợp lệ (lớn hơn 0₫)" | High |
| **TC_VOUCHER_02** | Giá gốc số âm (-1₫) | BVA (Dưới biên 0) | Đang mở Form tạo Voucher | 1. Nhập Giá gốc = -1.<br>2. Nhấn Lưu chương trình. | `originalPrice = -1` | Báo lỗi: "Vui lòng nhập Giá gốc hợp lệ (lớn hơn 0₫)" | High |
| **TC_VOUCHER_03** | Giá gốc nhỏ nhất hợp lệ (1₫) | BVA (Biên nhỏ nhất) | Đang mở Form tạo Voucher | 1. Nhập Giá gốc = 1, Giá bán = 0.<br>2. Nhấn Lưu chương trình. | `originalPrice = 1`, `sellingPrice = 0` | Không báo lỗi giá gốc | Medium |
| **TC_VOUCHER_04** | Giá bán âm (-1₫) | BVA (Dưới biên 0) | Đang mở Form tạo Voucher | 1. Giá gốc 100k, Giá bán = -1.<br>2. Nhấn Lưu. | `originalPrice = 100000`, `sellingPrice = -1` | Báo lỗi: "Vui lòng nhập Giá bán hợp lệ (không thể âm)" | High |
| **TC_VOUCHER_05** | Giá bán bằng 0₫ (Miễn phí 100%) | BVA (Biên 0 hợp lệ) | Đang mở Form tạo Voucher | 1. Giá gốc 100k, Giá bán = 0.<br>2. Nhấn Lưu. | `originalPrice = 100000`, `sellingPrice = 0` | Chấp nhận (Mức giảm hiển thị 100,000₫) | High |
| **TC_VOUCHER_06** | Giá bán bằng Giá gốc | BVA (Biên Giá bán = Giá gốc) | Đang mở Form tạo Voucher | 1. Giá gốc 100k, Giá bán = 100k.<br>2. Nhấn Lưu. | `originalPrice = 100000`, `sellingPrice = 100000` | Báo lỗi: "Giá bán phải nhỏ hơn Giá gốc" | High |
| **TC_VOUCHER_07** | Giá bán lớn hơn Giá gốc | BVA (Biên Giá bán > Giá gốc) | Đang mở Form tạo Voucher | 1. Giá gốc 100k, Giá bán = 100,001.<br>2. Nhấn Lưu. | `originalPrice = 100000`, `sellingPrice = 100001` | Báo lỗi: "Giá bán phải nhỏ hơn Giá gốc" | High |
| **TC_VOUCHER_08** | Giá bán cận trên hợp lệ | BVA (Biên Giá gốc - 1đ) | Đang mở Form tạo Voucher | 1. Giá gốc 100k, Giá bán = 99,999.<br>2. Nhấn Lưu. | `originalPrice = 100000`, `sellingPrice = 99999` | Chấp nhận (Mức giảm hiển thị 1₫) | Medium |
| **TC_VOUCHER_09** | Số lượng phát hành bằng 0 | BVA (Biên 0) | Đang mở Form tạo Voucher | 1. Nhập Số lượng = 0.<br>2. Nhấn Lưu. | `issuedQuantity = 0` | Báo lỗi: "Số lượng phát hành phải là số nguyên dương" | High |
| **TC_VOUCHER_10** | Số lượng phát hành số thực (10.5) | EP (Miền số thực) | Đang mở Form tạo Voucher | 1. Nhập Số lượng = 10.5.<br>2. Nhấn Lưu. | `issuedQuantity = 10.5` | Báo lỗi: "Số lượng phát hành phải là số nguyên dương" | High |
| **TC_VOUCHER_11** | Số lượng phát hành nhỏ nhất (1) | BVA (Biên nhỏ nhất) | Đang mở Form tạo Voucher | 1. Nhập Số lượng = 1.<br>2. Nhấn Lưu. | `issuedQuantity = 1` | Chấp nhận số lượng 1 voucher | High |
| **TC_VOUCHER_12** | Trùng ngày bắt đầu và kết thúc bán | BVA (Biên ngày bán = 0) | Đang mở Form tạo Voucher | 1. Chọn ngày kết thúc bán trùng ngày bắt đầu bán.<br>2. Nhấn Lưu. | `sellStartDate = sellEndDate` | Báo lỗi: "Thời gian kết thúc bán phải sau Thời gian bắt đầu bán" | High |
| **TC_VOUCHER_13** | Ngày bắt đầu sử dụng trước ngày bán | BVA (Biên ngày dùng < ngày bán) | Đang mở Form tạo Voucher | 1. Chọn Ngày dùng trước ngày bán.<br>2. Nhấn Lưu. | `useStartDate < sellStartDate` | Báo lỗi: "Thời gian bắt đầu sử dụng không thể trước Thời gian bắt đầu bán" | High |
| **TC_VOUCHER_14** | Hạn chót dùng trước hạn chót bán | BVA (Biên hạn dùng < hạn bán) | Đang mở Form tạo Voucher | 1. Chọn Ngày kết thúc dùng trước kết thúc bán.<br>2. Nhấn Lưu. | `useEndDate < sellEndDate` | Báo lỗi: "Hạn chót sử dụng voucher phải sau hoặc bằng Thời gian kết thúc bán" | High |
| **TC_VOUCHER_15** | Upload ảnh vượt quá 5.0 MB | BVA (Biên dung lượng 5MB + 1B) | Đang mở Form tạo Voucher | 1. Chọn file ảnh kích thước 5,242,881 bytes.<br>2. Thêm vào gallery. | `fileSize = 5,242,881 Bytes` | Báo lỗi: "vượt quá 5 MB" và từ chối tải lên | High |
| **TC_VOUCHER_16** | Upload file sai định dạng (.txt, .pdf) | EP (Miền định dạng không hỗ trợ) | Đang mở Form tạo Voucher | 1. Chọn file document .txt hoặc .pdf.<br>2. Thêm vào gallery. | `mimeType = text/plain` | Báo lỗi: "sai định dạng" (chỉ nhận jpeg/png/webp) | High |

---

## 3. Phân Hệ Hồ Sơ & Quản Lý Nhân Viên Chi Nhánh (`/partner/profile`, `/partner/employees`)

| Test Case ID | Tên Ca Kiểm Thử | Phân Loại / Kỹ Thuật | Tiền Điều Kiện | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Kỳ Vọng | Mức Độ Ưu Tiên |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_PROFILE_01** | Cập nhật MST rỗng trong Hồ sơ | BVA (Chuỗi rỗng) | Đang mở tab Pháp lý hồ sơ | 1. Xóa trắng MST.<br>2. Nhấn Lưu thay đổi. | `taxId = ""` | Báo lỗi: "Mã số thuế không được để trống" | High |
| **TC_EMP_01** | Tạo nhân viên mật khẩu dưới 8 ký tự | BVA (Biên độ dài mật khẩu 7) | Đang mở Modal thêm nhân viên | 1. Điền thông tin nhân viên.<br>2. Mật khẩu 7 ký tự.<br>3. Nhấn Tạo. | `password = "1234567"` | Báo lỗi modal: "Mật khẩu phải có ít nhất 8 ký tự" | High |
| **TC_EMP_02** | Tạo nhân viên để trống chi nhánh | EP (Không chọn chi nhánh) | Đang mở Modal thêm nhân viên | 1. Điền thông tin.<br>2. Không chọn chi nhánh.<br>3. Nhấn Tạo. | `branchId = ""` | Báo lỗi: "Vui lòng chọn chi nhánh" | High |
