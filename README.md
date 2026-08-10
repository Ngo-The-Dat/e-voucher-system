# Hệ thống bán voucher giảm giá trực tuyến

### Thành viên
| MSSV    | Họ và tên       | Vai trò   |
|:--------|:----------------|:----------|
|23127149 |Nguyễn Bình An   |           |
|23127327 |Lưu Ngô Quốc Bảo |           |
|23127340 |Ngô Thế Đạt      |Nhóm trưởng|
|23127498 |Nguyễn Trọng Tín |           |

### Chạy và kiểm thử cổng Partner

- Frontend: `http://localhost:3000/partner/login`
- Backend API: `http://localhost:8000/api/partner`
- Tài khoản demo: `partner_fb@voucher.vn`
- Mật khẩu demo: `Password123!`

Trong devcontainer, chạy backend và frontend ở hai terminal:

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

Các lệnh kiểm tra:

```bash
cd backend && npm run typecheck && npm test
cd frontend && npm run typecheck && npm test && npm run lint && npm run build
```

### Đóng góp
| MSSV    | Họ và tên       |Công việc |
|:--------|:----------------|:----------|
|23127149 |Nguyễn Bình An   |           |
|23127327 |Lưu Ngô Quốc Bảo |           |
|23127340 |Ngô Thế Đạt      |           |
|23127498 |Nguyễn Trọng Tín |           |
