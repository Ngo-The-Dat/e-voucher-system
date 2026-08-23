# Báo Cáo Lỗi & Điểm Cần Cải Tiến Trang Đối Tác (Partner Portal Bug Report)

- **Dự án**: Sàn E-Voucher - Phân hệ Đối tác (Partner Portal)
- **Kỹ thuật kiểm thử**: Dynamic Source Code Analysis kết hợp Automated Boundary Value Analysis (BVA) & Equivalence Partitioning (EP)
- **Thời gian lập**: Ngày 23/08/2026
- **Tình trạng tổng quan**: Phân hệ xử lý dữ liệu và validation chặt chẽ. Dưới đây là danh sách đầy đủ các lỗi phát hiện (Defects), rủi ro biên (Edge Cases) và điểm cần cải tiến UI/UX được ghi nhận từ kết quả kiểm thử thực tế.

---

## 1. Danh Sách Lỗi & Cảnh Báo Chi Tiết (Defects & Issues Log)

### 🐛 BUG-PARTNER-01: Cho phép nhập ký tự số thực/khoa học dạng chuỗi vào trường Số lượng phát hành trên UI

- **Mã lỗi**: `BUG-PARTNER-01`
- **Màn hình**: Tạo Voucher (`/partner/vouchers/create`)
- **Mức độ nghiêm trọng (Severity)**: `Medium`
- **Mức độ ưu tiên (Priority)**: `High`
- **Trạng thái**: `Open`
- **Phân loại**: BVA & Input Validation
- **Mô tả chi tiết**:
  - Tại trường nhập "Số lượng phát hành" (`issuedQuantityStr`), logic xác thực kiểm tra `Number.isSafeInteger(Number(issuedQuantityStr)) && issuedQuantity > 0`.
  - Tuy nhiên, thẻ input HTML chỉ khai báo `<Input type="number" min="1" />` mà không cấu hình `step="1"` và không chặn các ký tự đặc biệt của input number (`.`, `,`, `e`, `E`, `-`, `+`).
  - Khi người dùng nhập `10.5` hoặc `1e3`, form sẽ không chặn ngay tại thời điểm nhập mà đợi đến khi bấm "Lưu chương trình" mới báo lỗi, gây trải nghiệm chưa mượt mà.
- **Các bước tái hiện**:
  1. Truy cập `/partner/vouchers/create`.
  2. Tại ô "Số lượng phát hành", nhập giá trị `100.5`.
  3. Bấm "Lưu chương trình".
- **Kết quả thực tế**: Form báo lỗi `"Số lượng phát hành phải là số nguyên dương."`
- **Kết quả kỳ vọng / Gợi ý khắc phục**: Thêm sự kiện `onKeyDown` ngăn chặn phím `.`, `e`, `-` hoặc thêm thuộc tính `step="1"` trên thẻ `Input`.

---

### 🐛 BUG-PARTNER-02: Chưa tự động loại bỏ ký tự khoảng trắng ở đầu/cuối của Mã số thuế trước khi regex

- **Mã lỗi**: `BUG-PARTNER-02`
- **Màn hình**: Đăng ký đối tác (`/partner/register` Step 1) & Hồ sơ (`/partner/profile`)
- **Mức độ nghiêm trọng (Severity)**: `Low`
- **Mức độ ưu tiên (Priority)**: `Medium`
- **Trạng thái**: `Open`
- **Phân loại**: EP (Equivalence Partitioning) & String Sanitization
- **Mô tả chi tiết**:
  - Khi người dùng sao chép (copy-paste) mã số thuế từ tài liệu PDF hoặc email có kèm theo khoảng trắng thừa ở cuối (ví dụ `"0123456789 "`), biểu thức chính quy `/^[0-9]{10,13}$/` sẽ đánh giá là không hợp lệ mặc dù chuỗi số hoàn toàn đúng chuẩn 10 số.
- **Các bước tái hiện**:
  1. Truy cập `/partner/register`.
  2. Dán mã số thuế có khoảng trắng `"0123456789 "`.
  3. Bấm "Xác nhận đăng ký".
- **Kết quả thực tế**: Báo lỗi `"Mã số thuế phải gồm 10 đến 13 chữ số"`.
- **Gợi ý khắc phục**: Thực hiện `.trim()` chuỗi trước khi kiểm tra regex:
  ```typescript
  if (!/^[0-9]{10,13}$/.test(formData.taxCode.trim())) {
    errors.taxCode = "Mã số thuế phải gồm 10 đến 13 chữ số";
  }
  ```

---

### 🐛 BUG-PARTNER-03: Trùng mốc thời gian bắt đầu bán và kết thúc bán (Biên sellEndDate = sellStartDate)

- **Mã lỗi**: `BUG-PARTNER-03`
- **Màn hình**: Tạo Voucher (`/partner/vouchers/create`)
- **Mức độ nghiêm trọng (Severity)**: `Medium`
- **Mức độ ưu tiên (Priority)**: `High`
- **Trạng thái**: `Open`
- **Phân loại**: BVA (Boundary Value Analysis)
- **Mô tả chi tiết**:
  - Khi người dùng chọn cùng một mốc giờ phút (ví dụ: `2026-10-01T10:00` cho cả bắt đầu và kết thúc bán), điều kiện `new Date(sellEndDate) <= new Date(sellStartDate)` bắt chính xác và báo lỗi.
  - Tuy nhiên, trên UI component `datetime-local`, trường `sellEndDate` chưa tự động gán thuộc tính `min={sellStartDate}` để tự động vô hiệu hóa các mốc thời gian không hợp lệ trên date-picker của trình duyệt.
- **Gợi ý khắc phục**: Bổ sung thuộc tính `min={sellStartDate}` vào thẻ input ngày kết thúc.

---

### 🐛 BUG-PARTNER-04: Thiếu ràng buộc dung lượng file tối đa tại thuộc tính HTML input file

- **Mã lỗi**: `BUG-PARTNER-04`
- **Màn hình**: Upload ảnh Voucher (`/partner/vouchers/create`) & Logo đối tác (`/partner/profile`)
- **Mức độ nghiêm trọng (Severity)**: `Low`
- **Mức độ ưu tiên (Priority)**: `Medium`
- **Trạng thái**: `Open`
- **Phân loại**: BVA & Performance
- **Mô tả chi tiết**:
  - Mã nguồn TypeScript đã kiểm soát chặt chẽ `file.size > 5 * 1024 * 1024` (5MB). Khi upload file `5,242,881 Bytes` (5MB + 1 Byte), hệ thống trả về thông báo `"vượt quá 5 MB"`.
  - Tuy nhiên, việc nhận file lớn rồi mới parse trên trình duyệt có thể gây giật lag nếu người dùng vô tình kéo thả video hoặc file dung lượng hàng trăm MB.
- **Gợi ý khắc phục**: Bổ sung validate kích thước file ngay từ `drag-and-drop` event handler trước khi load blob preview.

---

## 2. Bảng Thống Kê Tổng Hợp Lỗi

| Mã Lỗi | Tên Lỗi / Vấn Đề | Phân Hệ | Kỹ Thuật | Mức Độ | Trạng Thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-PARTNER-01** | Nhập số thực `10.5` tại ô Số lượng phát hành | `/partner/vouchers/create` | BVA & EP | Medium | `Open` |
| **BUG-PARTNER-02** | Không trim khoảng trắng khi paste Mã số thuế | `/partner/register` | EP | Low | `Open` |
| **BUG-PARTNER-03** | Datepicker chưa gán `min` date theo ngày bắt đầu | `/partner/vouchers/create` | BVA | Medium | `Open` |
| **BUG-PARTNER-04** | Tối ưu kiểm tra dung lượng file trước blob preview | `/partner/vouchers/create` | BVA | Low | `Open` |

---

## 3. Kết Luận & Đánh Giá Chất Lượng

- Toàn bộ các logic nghiệp vụ lõi (Core Business Rules) về **Giá gốc, Giá bán, Mức giảm tối thiểu, Ràng buộc ngày mở bán/ngày sử dụng, Format ảnh, Regex MST và CCCD** đều được triển khai đầy đủ và chặn lỗi đúng theo chuẩn thiết kế EP/BVA.
- Các lỗi được phát hiện chủ yếu nằm ở khía cạnh **UX/Frontend input hygiene** (ngăn chặn sớm từ bàn phím và datepicker) để nâng cao trải nghiệm của đối tác doanh nghiệp.
