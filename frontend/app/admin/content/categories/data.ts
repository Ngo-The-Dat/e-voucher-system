export interface CategoryVoucher {
  voucherId: string;
  voucherTitle: string;
  merchantName: string;
  status: "ACTIVE" | "INACTIVE";
  inStock: boolean;
}

export interface CategoryData {
  categoryId: string;
  categoryName: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  vouchers: CategoryVoucher[];
}

export const INITIAL_CATEGORIES: CategoryData[] = [
  {
    categoryId: "CAT-01",
    categoryName: "Ẩm thực & Nhà hàng",
    description: "Các gói voucher giảm giá buffet, nhà hàng lẩu nướng, món Âu - Á",
    status: "ACTIVE",
    vouchers: [
      {
        voucherId: "VCH-001",
        voucherTitle: "Buffet Lẩu Kichi Kichi Giảm 20% Toàn Quốc",
        merchantName: "Golden Gate Group",
        status: "ACTIVE",
        inStock: true,
      },
      {
        voucherId: "VCH-002",
        voucherTitle: "Voucher Sumo Yakiniku Nướng Nhật Bản 200.000đ",
        merchantName: "Golden Gate Group",
        status: "ACTIVE",
        inStock: true,
      },
      {
        voucherId: "VCH-003",
        voucherTitle: "Combo Pizza Hut Mua 1 Tặng 1 Cuối Tuần",
        merchantName: "Pizza Hut",
        status: "ACTIVE",
        inStock: true,
      },
      {
        voucherId: "VCH-004",
        voucherTitle: "Voucher Trả Trước Gogi House 500.000đ",
        merchantName: "Golden Gate Group",
        status: "ACTIVE",
        inStock: true,
      },
      {
        voucherId: "VCH-005",
        voucherTitle: "Ưu Đãi Thưởng Thức Haidilao Hotpot Giảm 15%",
        merchantName: "Haidilao Vietnam",
        status: "ACTIVE",
        inStock: true,
      },
      {
        voucherId: "VCH-006",
        voucherTitle: "Voucher King BBQ Buffet Nướng Hàn Quốc",
        merchantName: "Redsun ITI",
        status: "ACTIVE",
        inStock: true,
      },
      {
        voucherId: "VCH-007",
        voucherTitle: "Voucher Ẩm Thực Nhật Bản Isushi Giảm 100.000đ",
        merchantName: "Golden Gate Group",
        status: "ACTIVE",
        inStock: true,
      },
      {
        voucherId: "VCH-008",
        voucherTitle: "Voucher Gà Rán KFC Giảm 30.000đ Cho Đơn Từ 100k",
        merchantName: "KFC Vietnam",
        status: "ACTIVE",
        inStock: true,
      },
    ],
  },
  {
    categoryId: "CAT-02",
    categoryName: "Cà phê & Đồ uống",
    description: "Voucher ưu đãi mua 1 tặng 1, giảm 50% tại Highlands, Phúc Long, The Coffee House",
    status: "ACTIVE",
    vouchers: [
      {
        voucherId: "VCH-010",
        voucherTitle: "Voucher Highlands Coffee 50.000đ Áp Dụng Toàn Quốc",
        merchantName: "Highlands Coffee",
        status: "ACTIVE",
        inStock: true,
      },
      {
        voucherId: "VCH-011",
        voucherTitle: "Phúc Long Tea & Coffee - Giảm 20k Cho Trà Sữa",
        merchantName: "Phúc Long Heritage",
        status: "ACTIVE",
        inStock: true,
      },
      {
        voucherId: "VCH-012",
        voucherTitle: "The Coffee House - Mua 1 Tặng 1 Cà Phê Phin",
        merchantName: "The Coffee House",
        status: "ACTIVE",
        inStock: true,
      },
      {
        voucherId: "VCH-013",
        voucherTitle: "Voucher Gong Cha Trà Sữa Trân Châu Hoàng Gia",
        merchantName: "Gong Cha Vietnam",
        status: "ACTIVE",
        inStock: true,
      },
      {
        voucherId: "VCH-014",
        voucherTitle: "Starbucks Vietnam - Giảm 50.000đ Món Đá Say",
        merchantName: "Starbucks Vietnam",
        status: "ACTIVE",
        inStock: true,
      },
      {
        voucherId: "VCH-015",
        voucherTitle: "Voucher Katinat Saigon Kafe Thưởng Thức Trà Ô Long",
        merchantName: "Katinat Kafe",
        status: "ACTIVE",
        inStock: true,
      },
    ],
  },
  {
    categoryId: "CAT-03",
    categoryName: "Giải trí & Vé phim",
    description: "Vé xem phim 2D/3D CGV, Lotte Cinema và vé khu vui chơi giải trí toàn quốc",
    status: "ACTIVE",
    vouchers: [
      {
        voucherId: "VCH-020",
        voucherTitle: "Vé Xem Phim CGV 2D Áp Dụng Cuối Tuần",
        merchantName: "CGV Cinemas",
        status: "ACTIVE",
        inStock: true,
      },
      {
        voucherId: "VCH-021",
        voucherTitle: "Vé Lotte Cinema 2D Xem Phim Bom Tấn",
        merchantName: "Lotte Cinema",
        status: "ACTIVE",
        inStock: true,
      },
      {
        voucherId: "VCH-022",
        voucherTitle: "Voucher Khu Vui Chơi TiNiWorld Cho Bé",
        merchantName: "TiNiWorld",
        status: "ACTIVE",
        inStock: true,
      },
    ],
  },
  {
    categoryId: "CAT-04",
    categoryName: "Du lịch & Khách sạn",
    description: "Voucher đặt phòng resort 5 sao, homestay và combo du lịch trọn gói",
    status: "ACTIVE",
    vouchers: [
      {
        voucherId: "VCH-030",
        voucherTitle: "Voucher Đặt Phòng Vinpearl Resort 3N2Đ",
        merchantName: "Vinpearl",
        status: "ACTIVE",
        inStock: true,
      },
      {
        voucherId: "VCH-031",
        voucherTitle: "Combo Du Lịch Phú Quốc Khách Sạn 4 Sao",
        merchantName: "Traveloka",
        status: "ACTIVE",
        inStock: true,
      },
    ],
  },
  {
    categoryId: "CAT-05",
    categoryName: "Sức khỏe & Làm đẹp",
    description: "Các dịch vụ Spa chăm sóc da, làm nail và liệu trình massage thư giãn",
    status: "INACTIVE",
    vouchers: [], // 0 vouchers -> có thể xóa được
  },
];

export const AVAILABLE_VOUCHERS_POOL: CategoryVoucher[] = [
  {
    voucherId: "VCH-100",
    voucherTitle: "Voucher Spa Trẻ Hóa Da Mặt Sen Spa 350.000đ",
    merchantName: "Sen Spa",
    status: "ACTIVE",
    inStock: true,
  },
  {
    voucherId: "VCH-101",
    voucherTitle: "Vé Tham Quan Công Viên Nước Hồ Tây",
    merchantName: "Hồ Tây Waterpark",
    status: "ACTIVE",
    inStock: true,
  },
  {
    voucherId: "VCH-102",
    voucherTitle: "Voucher Mua Sắm Uniqlo Giảm 100.000đ Đơn 1 Triệu",
    merchantName: "Uniqlo Vietnam",
    status: "ACTIVE",
    inStock: true,
  },
  {
    voucherId: "VCH-103",
    voucherTitle: "Voucher Rửa Xe & Dịch Vụ Xe Máy Auto Spa",
    merchantName: "Auto Spa Vietnam",
    status: "ACTIVE",
    inStock: true,
  },
];
