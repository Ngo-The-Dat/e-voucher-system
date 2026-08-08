export interface PopupData {
  popupId: string;
  programId: string;
  programTitle: string;
  title: string;
  content: string;
  targetUrl: string;
  imageUrl: string;
  startAt: string;
  endAt: string;
  status: "ACTIVE" | "INACTIVE";
}

export const INITIAL_POPUPS: PopupData[] = [
  {
    popupId: "POP-501",
    programId: "PRG-HG-50K",
    programTitle: "Voucher Highlands Coffee 50.000đ",
    title: "Nhận Ngay Voucher Highlands Coffee 50.000đ Tặng Bạn Mới!",
    content: "Đăng ký tài khoản thành công để nhận combo voucher cà phê mua 1 tặng 1 siêu hời áp dụng toàn quốc.",
    targetUrl: "https://lumina.vn/vouchers/PRG-HG-50K",
    imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=80",
    startAt: "01/08/2026 00:00",
    endAt: "15/08/2026 23:59",
    status: "ACTIVE",
  },
  {
    popupId: "POP-502",
    programId: "PRG-CGV-2D",
    programTitle: "Vé xem phim CGV 2D Cuối Tuần",
    title: "Săn Vé Xem Phim CGV 2D Giá 79.000đ Cuối Tuần Này!",
    content: "Nhập mã MHM-CGV để nhận ưu đãi vé xem phim cuối tuần áp dụng tại tất cả cụm rạp CGV.",
    targetUrl: "https://lumina.vn/vouchers/PRG-CGV-2D",
    imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80",
    startAt: "08/08/2026 08:00",
    endAt: "10/08/2026 23:59",
    status: "INACTIVE",
  },
];
