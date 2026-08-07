export interface BannerData {
  bannerId: string;
  programId: string;
  programTitle: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  displayPosition: string;
  displayFrom: string;
  displayTo: string;
  status: "ACTIVE" | "INACTIVE";
}

export const INITIAL_BANNERS: BannerData[] = [
  {
    bannerId: "BNR-101",
    programId: "PRG-HG-50K",
    programTitle: "Voucher Highlands Coffee 50.000đ",
    title: "Chiến dịch Mùa Hè Rực Rỡ - Giảm 50% Highlands Coffee",
    imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80",
    targetUrl: "https://lumina.vn/vouchers/PRG-HG-50K",
    displayPosition: "Trượt trang chủ đầu trang",
    displayFrom: "01/08/2026",
    displayTo: "31/08/2026",
    status: "ACTIVE",
  },
  {
    bannerId: "BNR-102",
    programId: "PRG-CGV-2D",
    programTitle: "Vé xem phim CGV 2D Cuối Tuần",
    title: "Ưu Đãi Độc Quyền CGV Cinemas - Xem Phim Bom Tấn Cuối Tuần",
    imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80",
    targetUrl: "https://lumina.vn/vouchers/PRG-CGV-2D",
    displayPosition: "Trượt trang chủ đầu trang",
    displayFrom: "05/08/2026",
    displayTo: "20/08/2026",
    status: "ACTIVE",
  },
  {
    bannerId: "BNR-103",
    programId: "PRG-KC-200K",
    programTitle: "Buffet Lẩu Kichi Kichi Giảm 20%",
    title: "Đại Hội Lẩu Nướng Kichi Kichi Giảm 20% Toàn Quốc",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80",
    targetUrl: "https://lumina.vn/vouchers/PRG-KC-200K",
    displayPosition: "Banner thanh bên trái",
    displayFrom: "01/07/2026",
    displayTo: "31/07/2026",
    status: "INACTIVE",
  },
];
