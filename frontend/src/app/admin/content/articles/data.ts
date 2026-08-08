export interface ContentArticleData {
  contentId: string;
  programId: string;
  programTitle: string;
  title: string;
  body: string;
  contentType: "POLICY" | "ARTICLE";
  createdAt: string;
  updatedAt: string;
  status: "ACTIVE" | "INACTIVE";
}

export const INITIAL_ARTICLES: ContentArticleData[] = [
  {
    contentId: "CNT-901",
    programId: "PRG-HG-50K",
    programTitle: "Voucher Highlands Coffee 50.000đ",
    title: "Điều khoản & Quy định Đổi Voucher Highlands Coffee toàn quốc",
    body: "Voucher có giá trị sử dụng cho tất cả các thức uống thuộc chuỗi cửa hàng Highlands Coffee trên toàn quốc ngoại trừ các điểm bán tại sân bay. Mỗi mã QR chỉ có giá trị quy đổi một lần duy nhất. Hạn sử dụng của voucher là 30 ngày kể từ ngày phát hành.",
    contentType: "POLICY",
    createdAt: "01/08/2026",
    updatedAt: "03/08/2026",
    status: "ACTIVE",
  },
  {
    contentId: "CNT-902",
    programId: "PRG-CGV-2D",
    programTitle: "Vé xem phim CGV 2D Cuối Tuần",
    title: "Hướng dẫn nhận Vé Xem Phim CGV 2D và lịch chiếu phim tháng 8",
    body: "Bài viết tổng hợp danh sách các bộ phim bom tấn sắp ra mắt tại cụm rạp CGV Cinemas trong tháng 8/2026 kèm hướng dẫn áp dụng mã quà tặng xem phim cuối tuần áp dụng cho các suất chiếu 2D toàn quốc.",
    contentType: "ARTICLE",
    createdAt: "02/08/2026",
    updatedAt: "04/08/2026",
    status: "ACTIVE",
  },
  {
    contentId: "CNT-903",
    programId: "PRG-KC-200K",
    programTitle: "Buffet Lẩu Kichi Kichi Giảm 20%",
    title: "Chính sách Hoàn trả và Quy đổi Voucher Ẩm thực Golden Gate",
    body: "Mọi thắc mắc liên quan đến voucher dịch vụ ẩm thực tại các chi nhánh Kichi Kichi sẽ được bộ phận chăm sóc khách hàng hỗ trợ giải quyết trong vòng 24 giờ kể từ thời điểm phát sinh giao dịch.",
    contentType: "POLICY",
    createdAt: "25/07/2026",
    updatedAt: "28/07/2026",
    status: "INACTIVE",
  },
];
