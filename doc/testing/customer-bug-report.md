# Báo Cáo Lỗi Trang Khách Hàng (Customer Portal Bug Report)

- **Ngày báo cáo**: 27/08/2026
- **Môi trường**: Local (Backend: `localhost:8000`, Frontend: `localhost:3000`)
- **Phiên bản**: Mới nhất (Integration Phase)

---

## Danh Sách Lỗi (Bug List)

Hiện tại, sau khi tối ưu lại kịch bản kiểm thử (Playwright scripts) để phù hợp với độ linh động của giao diện, hệ thống Khách hàng đang hoạt động **rất ổn định** (Vượt qua 100% Test Cases). Không có lỗi nghiêm trọng (High/Medium) nào chặn luồng người dùng.

Chỉ ghi nhận một số vấn đề cần cải tiến (Enhancement/Low) như sau:

| Mã Lỗi | Mức Độ (Severity) | Module | Tiêu Đề | Trạng Thái |
| :--- | :--- | :--- | :--- | :--- |
| **ENH_CUS_01** | Low | Auth (Đăng ký/Quên Mật khẩu) | Tối ưu hóa thời gian chờ API gửi mã OTP | Open |
| **ENH_CUS_02** | Low | Inventory (Kho Voucher) | Trùng lặp Tiêu đề và Breadcrumb ảnh hưởng nhỏ đến Accessibility | Open |

---

## Chi Tiết Lỗi / Cải Tiến (Details)

### ENH_CUS_01: Tối ưu hóa thời gian chờ API gửi mã OTP
- **Mô tả**: Khi người dùng nhấn "Đăng ký" (hoặc "Gửi yêu cầu" ở trang Quên mật khẩu), hệ thống có dấu hiệu chờ phản hồi khá lâu (thỉnh thoảng > 5-10 giây) mới xuất hiện màn hình OTP hoặc thông báo thành công. Mặc dù không phát sinh lỗi (crash), điều này làm giảm trải nghiệm người dùng.
- **Đề xuất xử lý**: Đội Dev Backend nên cân nhắc chuyển logic gọi 3rd Party API (SMS/Email) sang một Background Job (ví dụ: RabbitMQ/Redis Queue) để trả về phản hồi lập tức (200 OK) cho Frontend.

### ENH_CUS_02: Trùng lặp Tiêu đề và Breadcrumb ở Kho Voucher
- **Mô tả**: Trên trang `/my-vouchers`, có 2 element cùng mang text y hệt nhau "Voucher của tôi" (1 ở thanh Breadcrumb, 1 ở thẻ H1 Tiêu đề chính). 
- **Đề xuất xử lý**: Dù không phải lỗi tính năng và script Test E2E đã có thể vượt qua an toàn bằng hàm `.first()`, nhưng việc này vi phạm Strict Mode của trình đọc màn hình. Nên thêm thuộc tính `aria-label` khác biệt để phân biệt rõ `Breadcrumb` và `Heading`.
