export interface Review {
  author: string;
  avatarLetter: string;
  rating: number;
  timeAgo: string;
  content: string;
  avatarBg: string; // Tailwind class
}

export interface Voucher {
  id: string;
  title: string;
  brand: string;
  brandLogo: string;
  category: string;
  thumbnail: string;
  images: string[];
  price: number;
  originalPrice?: number;
  discountBadge?: string;
  rating: number;
  reviewsCount: number;
  soldCount: string;
  description?: string;
  highlights?: string[];
  conditions?: string[];
  location?: string;
  guideSteps?: string[];
  reviews?: Review[];
  featured?: boolean;
  bestSeller?: boolean;
  expiryDate?: string;
}

export interface MyVoucher {
  id: string;
  voucherId: string;
  code: string;
  datePurchased: string;
  expiryDate: string;
  status: "unused" | "used" | "expiring" | "expired";
  dateUsed?: string;
  orderNumber: string;
  paymentMethod: string;
}

export const mockVouchers: Voucher[] = [
  {
    id: "seafood-buffet",
    title: "Voucher Buffet Hải Sản Cao Cấp Dành Cho 2 Người",
    brand: "Ocean Prime Restaurant",
    brandLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCEs3OhuwKQs3QRTCJHGZXfkMY6-FKOJq_71RNVaGZGGGlLy6yEJmoqbVwEVZ7qQiLyCQk2EDCv7Tn87pc1pDiKnnmQjKlkc0bISSf2oqTIsmbxYedOtvzznMaHjluuasIpeYP7L_iSEN0nlAQ_zQR8XKYerxBWfYMxdDV8iAoYQvjm0pokoa01WDt7M6nBLekv6vuLdQ5k7LMBDRnRiLZCRM9fY3T0Ewv8SeY8V0ESqSDWqDlYrjk9",
    category: "Ẩm thực",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuDIVo2O5dvBKjNSmIMiv143tsi-w-tHz3ruTX6OUVHU-8cJFsqYr1wK1j43_xKPYwRAVH2AlNU2EBbXFMz1R8hVNZw6UetyjNuGtB5iW5F2mefnQFUOtwlBFL6bGDh0Z965bGQ7PekXu4AHdguhNOHPzGCVeX_0A0TsursprMm3qP5HQQxnntACC28RXeXdzCopUhSaeMM4tb7Fuo9BjToNntf3ufNB93Y36wcZFehBfryHuCWSI0Km",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDIVo2O5dvBKjNSmIMiv143tsi-w-tHz3ruTX6OUVHU-8cJFsqYr1wK1j43_xKPYwRAVH2AlNU2EBbXFMz1R8hVNZw6UetyjNuGtB5iW5F2mefnQFUOtwlBFL6bGDh0Z965bGQ7PekXu4AHdguhNOHPzGCVeX_0A0TsursprMm3qP5HQQxnntACC28RXeXdzCopUhSaeMM4tb7Fuo9BjToNntf3ufNB93Y36wcZFehBfryHuCWSI0Km",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDlQBuzddi59pJesphILpo-QjAj2oN0S65cdFLfIXJvBYlcA-qfeKmwMRR3yqGwsuQyeV_Dp6y2Mlc2JDokww5r07QYWL4sx32VfAWIVWZ7zR0gDDgc-dMW83f5Ds5VZbNWIbkeuS6q4KJ3Mb9FShvwAySfi5LfX_Rex_CikU8uSePX6bl1HZlIUKATSmrsfX97ar-S1rlq6OMfkJ_jj7WjMeOW9j-NMyI7viuVb5MKD_4UpuCxDzi-",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAnZAGFSUffNZduZo0lX6uNyHfEhpVe4Peh-NJca-i-0fDQGLSeN1Ioi5VkfEtCKdlZtSOaiQw71A8_rjRzqvOSCHm8Ob3-jOiMJ1H0vHxYiAx5PiG6mtXd4gMtInKITTUKUtoztG363q2D2N_xHpvvrAwq9SA4Kh328o01ABItNXB3-sO_gP0Aa5ojaG8r7rWbKi0Cemrf63nucZwK-8uiIY3NCD51goR3Pdi-MxVmlhNjAo3rzbZv",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC7ok_vlyQUujl7hX_JIhgQNRlVG6IU7x3BijUmA10fDe03BY-MEF9cQ584FCj1x9xcwUscHDM1ZNdr49r1GrIK5b6p4V3u8kKizudjKyksi57nd8CS_0BiU4cW3RlJJYMCTZ6irMOZVWRkUCty5qK1OxGwP6h3wFYoMD5-BOPG2Yrzg7M6Ir7_emYj0954QuB2RXt01I8kvJFPEPwy9nXjk1ypIz5k-TQFyf7vPMDAHCZRGTuElCwh"
    ],
    price: 1490000,
    originalPrice: 2000000,
    discountBadge: "-25%",
    rating: 4.8,
    reviewsCount: 124,
    soldCount: "1.2k+",
    bestSeller: true,
    featured: true,
    description: "Trải nghiệm bữa tiệc hải sản đẳng cấp tại Ocean Prime Restaurant với không gian sang trọng và menu đa dạng hơn 100 món ăn chế biến từ nguyên liệu tươi ngon nhất.",
    highlights: [
      "Thưởng thức không giới hạn Tôm Hùm, Cua Biển, Hào Sữa, Cá Hồi Na Uy...",
      "Quầy Sashimi tươi sống được chế biến trực tiếp bởi đầu bếp chuẩn sao.",
      "Kèm theo lẩu Thái hoặc lẩu Nấm thanh ngọt.",
      "Tráng miệng phong phú với kem Ý, trái cây nhiệt đới và bánh ngọt Pháp."
    ],
    expiryDate: "31/12/2026",
    conditions: [
      "Hạn sử dụng: Đến hết ngày 31/12/2026",
      "Giờ áp dụng: 11:00 - 14:00 & 18:00 - 22:00 (Thứ 2 - Chủ Nhật)",
      "Lưu ý quan trọng: Vui lòng đặt bàn trước 4 tiếng. Phụ thu 100.000đ/người vào các ngày Lễ/Tết. Không áp dụng đồng thời với các chương trình khuyến mãi khác."
    ],
    location: "Tầng 5, Vincom Center, 72 Lê Thánh Tôn, Phường Bến Nghé, Quận 1, TP. HCM",
    guideSteps: [
      "Thanh toán & Nhận mã: Mã voucher sẽ được gửi qua Email và SMS ngay lập tức.",
      "Đặt bàn: Liên hệ hotline nhà hàng để đặt trước chỗ ngồi.",
      "Trình mã khi đến: Đưa mã voucher cho nhân viên tại quầy thu ngân."
    ],
    reviews: [
      {
        author: "Hoàng Nam",
        avatarLetter: "H",
        avatarBg: "bg-primary-container text-on-primary-container",
        rating: 5,
        timeAgo: "2 ngày trước",
        content: "Hải sản rất tươi, đặc biệt là hàu và tôm hùm. Không gian nhà hàng đẹp, nhân viên phục vụ chu đáo. Mua voucher trên này tiết kiệm được khá nhiều."
      },
      {
        author: "Linh Trương",
        avatarLetter: "L",
        avatarBg: "bg-secondary-container text-on-secondary-container",
        rating: 4,
        timeAgo: "1 tuần trước",
        content: "Đồ ăn ngon, đa dạng. Tuy nhiên cuối tuần khá đông nên cần đặt bàn trước sớm. Quầy sashimi làm liên tục nên lúc nào cũng tươi rói."
      }
    ]
  },
  {
    id: "sushi-tokyo-deli",
    title: "Buffet Sushi Thượng Hạng - Tokyo Deli",
    brand: "Tokyo Deli",
    brandLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuC27y0GJDlQB_PHOVdYOBxC0ZE6RxnSRbdnvVmRg4TN3d-fqInXu0TuLT_OHoYpJqvBvYmszFR_ZxgmyWkbmN3EcqQmyjFzGSMvCIVxIEPUJGE3Wd6Us37erRZTmkmDqzlMId0FPM1Q0EqaE_uijgH4RgkhoNVRLiEfCnehx9rpDBITW6pzCVcB_cHvFiLGbSPazT0h6BM01NwYQVydJhEEKqplwd1q2niu-1cdphLoCYlXUcKD6GyC",
    category: "Ẩm thực",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuBJx9iqF7diKHqnNfOYaWMvXD7WJmxcw5egtCuYL7owRtqn6aFyvi21bDdzr7470GtgWkp-ohe1eYUTo1SgfkP-mQd8wn3sSHuZv83LDGmdxnSa6w0Kpt7C56XaKL4KiwpBoWB5jTSnl23G-ITginxhsPfL4FDX0_QlDvE3KtoMu8_Axa6cDCjkm9_TRKqS7lIu3zGvaz9_vems8uTOySZtsAYTb9xgPZqV3g8MDuGiGW2cuHIzN8CF",
    images: ["https://lh3.googleusercontent.com/aida-public/AB6AXuBJx9iqF7diKHqnNfOYaWMvXD7WJmxcw5egtCuYL7owRtqn6aFyvi21bDdzr7470GtgWkp-ohe1eYUTo1SgfkP-mQd8wn3sSHuZv83LDGmdxnSa6w0Kpt7C56XaKL4KiwpBoWB5jTSnl23G-ITginxhsPfL4FDX0_QlDvE3KtoMu8_Axa6cDCjkm9_TRKqS7lIu3zGvaz9_vems8uTOySZtsAYTb9xgPZqV3g8MDuGiGW2cuHIzN8CF"],
    price: 850000,
    originalPrice: 1000000,
    discountBadge: "-15%",
    rating: 4.6,
    reviewsCount: 89,
    soldCount: "400+",
    featured: true
  },
  {
    id: "hotpot-sichuan",
    title: "Combo Lẩu Tứ Xuyên Dành Cho 4 Người",
    brand: "Sichuan Hotpot",
    brandLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCEs3OhuwKQs3QRTCJHGZXfkMY6-FKOJq_71RNVaGZGGGlLy6yEJmoqbVwEVZ7qQiLyCQk2EDCv7Tn87pc1pDiKnnmQjKlkc0bISSf2oqTIsmbxYedOtvzznMaHjluuasIpeYP7L_iSEN0nlAQ_zQR8XKYerxBWfYMxdDV8iAoYQvjm0pokoa01WDt7M6nBLekv6vuLdQ5k7LMBDRnRiLZCRM9fY3T0Ewv8SeY8V0ESqSDWqDlYrjk9",
    category: "Ẩm thực",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuCX-cqYUafMZX3HK9AlLfV9meTsH6sfrnTOzCZkw0wRf8MPmIpDqy14llbP-VCeGewpr1u7vaCRmzO_wGV9Um4uNShta5U0lua7r4obYdmqWX5sf8oCkV-5I9yg6ixfspjcJ78jpRwJAw11qFzDWyDM_omYVB68LO-WFe-wnCcjZ51X-1_O6Sxu3VipuAjfuLP659w2aB7D2DiR4T-tYyLo42EJO_mFiqsPkIdSrPEDN2SHDqgWNszI",
    images: ["https://lh3.googleusercontent.com/aida-public/AB6AXuCX-cqYUafMZX3HK9AlLfV9meTsH6sfrnTOzCZkw0wRf8MPmIpDqy14llbP-VCeGewpr1u7vaCRmzO_wGV9Um4uNShta5U0lua7r4obYdmqWX5sf8oCkV-5I9yg6ixfspjcJ78jpRwJAw11qFzDWyDM_omYVB68LO-WFe-wnCcjZ51X-1_O6Sxu3VipuAjfuLP659w2aB7D2DiR4T-tYyLo42EJO_mFiqsPkIdSrPEDN2SHDqgWNszI"],
    price: 1200000,
    originalPrice: 1500000,
    discountBadge: "-20%",
    rating: 4.9,
    reviewsCount: 210,
    soldCount: "800+",
    featured: true
  },
  {
    id: "afternoon-tea-european",
    title: "Set Trà Chiều Phong Cách Âu Quý Phái",
    brand: "Lumina Lounge",
    brandLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCEs3OhuwKQs3QRTCJHGZXfkMY6-FKOJq_71RNVaGZGGGlLy6yEJmoqbVwEVZ7qQiLyCQk2EDCv7Tn87pc1pDiKnnmQjKlkc0bISSf2oqTIsmbxYedOtvzznMaHjluuasIpeYP7L_iSEN0nlAQ_zQR8XKYerxBWfYMxdDV8iAoYQvjm0pokoa01WDt7M6nBLekv6vuLdQ5k7LMBDRnRiLZCRM9fY3T0Ewv8SeY8V0ESqSDWqDlYrjk9",
    category: "Ẩm thực",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuCK2AN5E4eyC2kwLVHP5QHLHbMC9bDc4oKJu6SV5Yj9o1qv-q4nokhW_RhTvhWT2_SrS8b_32UVbET0tKA_41vfoCsr60GNetb1QCctLQB5b5_B8EvVk5qEzJxASljz5w0bJAuq9OjIll0v2sKvxKR1lA_-0EIGG0KIllFengRkqqz5snXpinwEa4iUfYO_FvNLiYOSz6h7eHAvgqquEEesDp7XMb_AnnN52W4jVbKpnE6IWcE2Dbac",
    images: ["https://lh3.googleusercontent.com/aida-public/AB6AXuCK2AN5E4eyC2kwLVHP5QHLHbMC9bDc4oKJu6SV5Yj9o1qv-q4nokhW_RhTvhWT2_SrS8b_32UVbET0tKA_41vfoCsr60GNetb1QCctLQB5b5_B8EvVk5qEzJxASljz5w0bJAuq9OjIll0v2sKvxKR1lA_-0EIGG0KIllFengRkqqz5snXpinwEa4iUfYO_FvNLiYOSz6h7eHAvgqquEEesDp7XMb_AnnN52W4jVbKpnE6IWcE2Dbac"],
    price: 450000,
    rating: 4.5,
    reviewsCount: 45,
    soldCount: "150+",
    featured: true
  },
  {
    id: "wagyu-steakhouse-55",
    title: "Voucher Bò Wagyu A5 Tại Steakhouse 55",
    brand: "Steakhouse 55",
    brandLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCEs3OhuwKQs3QRTCJHGZXfkMY6-FKOJq_71RNVaGZGGGlLy6yEJmoqbVwEVZ7qQiLyCQk2EDCv7Tn87pc1pDiKnnmQjKlkc0bISSf2oqTIsmbxYedOtvzznMaHjluuasIpeYP7L_iSEN0nlAQ_zQR8XKYerxBWfYMxdDV8iAoYQvjm0pokoa01WDt7M6nBLekv6vuLdQ5k7LMBDRnRiLZCRM9fY3T0Ewv8SeY8V0ESqSDWqDlYrjk9",
    category: "Ẩm thực",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuDRYUC8WRYvSBk6Q73LVKjjXoLPpTTojIEXd2Bp-WMeQuDLBqEg7kQL4UcFDatmGH5EoYEO6NUVX8a7x-MxPrZ-0IQuuPWQxAnEaQ-dGc-ATIPlqQAZwVWz0lSyckfsBVcDwhPbNb1DGGNBQ-K2YZSdEVONGXKc8PilVn9izozBLCYZ1eEa_OoE_Gc5teuTGOuLdoP_WpyLLT8SFQrMaYLQ1aVCwsNN2CijeQOf9yT8u9DcN31Uww-B",
    images: ["https://lh3.googleusercontent.com/aida-public/AB6AXuDRYUC8WRYvSBk6Q73LVKjjXoLPpTTojIEXd2Bp-WMeQuDLBqEg7kQL4UcFDatmGH5EoYEO6NUVX8a7x-MxPrZ-0IQuuPWQxAnEaQ-dGc-ATIPlqQAZwVWz0lSyckfsBVcDwhPbNb1DGGNBQ-K2YZSdEVONGXKc8PilVn9izozBLCYZ1eEa_OoE_Gc5teuTGOuLdoP_WpyLLT8SFQrMaYLQ1aVCwsNN2CijeQOf9yT8u9DcN31Uww-B"],
    price: 2250000,
    originalPrice: 2500000,
    discountBadge: "-10%",
    rating: 4.7,
    reviewsCount: 156,
    soldCount: "300+",
    featured: true
  },
  {
    id: "coffee-house-50k",
    title: "Voucher Giảm 50K - The Coffee House Toàn Quốc",
    brand: "The Coffee House",
    brandLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuC27y0GJDlQB_PHOVdYOBxC0ZE6RxnSRbdnvVmRg4TN3d-fqInXu0TuLT_OHoYpJqvBvYmszFR_ZxgmyWkbmN3EcqQmyjFzGSMvCIVxIEPUJGE3Wd6Us37erRZTmkmDqzlMId0FPM1Q0EqaE_uijgH4RgkhoNVRLiEfCnehx9rpDBITW6pzCVcB_cHvFiLGbSPazT0h6BM01NwYQVydJhEEKqplwd1q2niu-1cdphLoCYlXUcKD6GyC",
    category: "Ẩm thực",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuClECzcOMVxbs6r13I1pK3d56JfG_2nt4lF7FkWqz0jtcoqPDeUBLQUOyAao0py5X49gx58HipLjzyQTKASkQQyy0DKNZnNO7TpTXvzVHXCnHRbXgGM1ZWhaWTC1zl15KMM6W0OiV4AAmN71jLhcpkf7_BFNYkTaVqlHIgbKhtONpHgnvzal8SkRJwnepEHzRzmLbkK1HMDN50D-M_mvlUXuxRhethMA6ZUC0bYq1tF6-aEeKEO8fHN",
    images: ["https://lh3.googleusercontent.com/aida-public/AB6AXuClECzcOMVxbs6r13I1pK3d56JfG_2nt4lF7FkWqz0jtcoqPDeUBLQUOyAao0py5X49gx58HipLjzyQTKASkQQyy0DKNZnNO7TpTXvzVHXCnHRbXgGM1ZWhaWTC1zl15KMM6W0OiV4AAmN71jLhcpkf7_BFNYkTaVqlHIgbKhtONpHgnvzal8SkRJwnepEHzRzmLbkK1HMDN50D-M_mvlUXuxRhethMA6ZUC0bYq1tF6-aEeKEO8fHN"],
    price: 250000, // original price was 250k in catalog code mock
    originalPrice: 250000,
    discountBadge: "Giảm 50K",
    rating: 4.8,
    reviewsCount: 3120,
    soldCount: "10k+",
    bestSeller: true
  },
  {
    id: "cgv-movie-2d",
    title: "Vé Xem Phim 2D Cuối Tuần - CGV Cinemas",
    brand: "CGV Cinemas",
    brandLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuAR9Nue5ECgcxhzpAARFglVfp2DYe_G67rvt-BqJJUd8d21IpvmC8yO3RctVCYsjCDEd2kTIpO6Fu_50rnc-OTMJfRH0kWbtZwMLyIMWnIUTl7nBRDWOxaCHK1t9UIQOnWtv1wLw4vKr8WcuoY3a85rY_m0QZp-N17pSvMcpo0JxfQptbU-DDHJD_CHXOH87aldH3N3whF5YnjkPi2qHDe6jPKcWqViVcjJWgpiKmPfHwtT-FyZL4Vl",
    category: "Giải trí",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuDtiXglQg2EYbpLk2hbFjp6xZZsAVCWFXur-TD9tzxNYeTvnGPYhCu3EF1gQF9QCEvUVO1QJTNxCmj7Vy8Q8uYqDcqvmGXV9-z6hE6JNv9AgPd7yItqDbpbjojG2Ctk57UXHxS5nUMPbROPFaQK29GL8Gs_txwZLGjzJuU5rnlw3fL9r3f1r4X_9lYZaWJTL4NCvFemDam7N_J8lsULsXWEHcgvH9ev3abJ4wwJfez-kn4J7tc3Zt67",
    images: ["https://lh3.googleusercontent.com/aida-public/AB6AXuDtiXglQg2EYbpLk2hbFjp6xZZsAVCWFXur-TD9tzxNYeTvnGPYhCu3EF1gQF9QCEvUVO1QJTNxCmj7Vy8Q8uYqDcqvmGXV9-z6hE6JNv9AgPd7yItqDbpbjojG2Ctk57UXHxS5nUMPbROPFaQK29GL8Gs_txwZLGjzJuU5rnlw3fL9r3f1r4X_9lYZaWJTL4NCvFemDam7N_J8lsULsXWEHcgvH9ev3abJ4wwJfez-kn4J7tc3Zt67"],
    price: 79000,
    originalPrice: 120000,
    discountBadge: "-34%",
    rating: 4.5,
    reviewsCount: 1450,
    soldCount: "5k+",
    bestSeller: false
  },
  {
    id: "spa-massage-60m",
    title: "Gói Massage Body 60 Phút Trị Liệu Chuyên Sâu",
    brand: "Lumina Spa",
    brandLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-kB-zIGuyRwEa8ynWbzI3QV6-5uXYHfsglxEWUl6fl2wd_juPog4hQUEy924ResZ6tvCxyFw4UmDM1ll_itltegYbEtbYMPVokuvkvrLP5beAjQ5_QgbCV-47OiNn0TlhWxI42z6ZHQro0CAUtmqzEgU50tISW8hA66LDva2p98P7FTJa5wp69EpkiIclnGZGbxObtMp3LPsLtzLZAgEQsAgHemvNvhNNRx0osaCrzpgixQ6Ji1E_",
    category: "Làm đẹp",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuBIzTTwVM8UzVevgxYqaH3DBmsPeydjmwGU6SoMuI_rsmdsma1wl4hwl24_0BEiFPJVfs3f-T4eP2SB-f-vXjwptdF4oZz2KJWifsxmxgkpCgQ3V1Q0Bj0avwjuBc3DrePCGrGWIcVkO5YeXS_qWMUYaeiSYtO2mvyw4c02DWUOJ_scn7RglbnihkWsvxIwHYwLsl3TxjjhHyQrM_XJrFJkzgpESvZvigSoYgNyG-orOkKAACtnotmJ",
    images: ["https://lh3.googleusercontent.com/aida-public/AB6AXuBIzTTwVM8UzVevgxYqaH3DBmsPeydjmwGU6SoMuI_rsmdsma1wl4hwl24_0BEiFPJVfs3f-T4eP2SB-f-vXjwptdF4oZz2KJWifsxmxgkpCgQ3V1Q0Bj0avwjuBc3DrePCGrGWIcVkO5YeXS_qWMUYaeiSYtO2mvyw4c02DWUOJ_scn7RglbnihkWsvxIwHYwLsl3TxjjhHyQrM_XJrFJkzgpESvZvigSoYgNyG-orOkKAACtnotmJ"],
    price: 199000,
    originalPrice: 450000,
    discountBadge: "-55%",
    rating: 4.8,
    reviewsCount: 412,
    soldCount: "2k+",
    bestSeller: true
  },
  {
    id: "hotel-superior-room",
    title: "Voucher Nghỉ Dưỡng 2N1Đ Phòng Superior - Bao Gồm Ăn Sáng",
    brand: "Ocean View Hotel",
    brandLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKj2Ua2o04uvw74K8Arw42a7hD3UNWh4RShdWGa2sofnMD8f7hKc1IiABNWe2ZSHwZT4STT39AmYIrk4WvRsPISLnOZLqDnDl1gFsFAvlbWpNJEvWU1BIsQBzobyn04YXRBibc0I0hSREr8Sxj7ArPFr2t2wV5DVKHmfwetfcT9l6e6RZPDDkncv7qauQwEdqy90fMw3aQWDYRNOKJoKI9dRrkrW5tUwGaT_ERcm-7f5isVZfKEkVA",
    category: "Du lịch",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuD_VVKnWo58OHYDVXeiOfNfyKy954vd0me1m09aOBgrt32CHyQfvM7Z5a8VcxPF0rhx-1Svn4_H22UrLbS-WTJdx1DX_Y0pfR7gyiCgXx-uxnqtO0Rj047vninoAii0Y8wO8AFZsuU2xra63sUk6bq1cK__23i_fLrrFAzwlT7wvNkxWH4bWMOrp0Xo02mtchkJHLkVkKbaxBOrYXB90d3-FUHcPe0WwHhsAYBJ7HKPjSCfw1zy4nTE",
    images: ["https://lh3.googleusercontent.com/aida-public/AB6AXuD_VVKnWo58OHYDVXeiOfNfyKy954vd0me1m09aOBgrt32CHyQfvM7Z5a8VcxPF0rhx-1Svn4_H22UrLbS-WTJdx1DX_Y0pfR7gyiCgXx-uxnqtO0Rj047vninoAii0Y8wO8AFZsuU2xra63sUk6bq1cK__23i_fLrrFAzwlT7wvNkxWH4bWMOrp0Xo02mtchkJHLkVkKbaxBOrYXB90d3-FUHcPe0WwHhsAYBJ7HKPjSCfw1zy4nTE"],
    price: 850000,
    originalPrice: 1500000,
    discountBadge: "-43%",
    rating: 4.7,
    reviewsCount: 98,
    soldCount: "500+"
  },
  {
    id: "gogi-house-barbecue",
    title: "Voucher Buffet Nướng Lẩu Cao Cấp Gogi House",
    brand: "Gogi House",
    brandLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCEs3OhuwKQs3QRTCJHGZXfkMY6-FKOJq_71RNVaGZGGGlLy6yEJmoqbVwEVZ7qQiLyCQk2EDCv7Tn87pc1pDiKnnmQjKlkc0bISSf2oqTIsmbxYedOtvzznMaHjluuasIpeYP7L_iSEN0nlAQ_zQR8XKYerxBWfYMxdDV8iAoYQvjm0pokoa01WDt7M6nBLekv6vuLdQ5k7LMBDRnRiLZCRM9fY3T0Ewv8SeY8V0ESqSDWqDlYrjk9",
    category: "Ẩm thực",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuCzEmcohy6GnuHFCcjQebzkZwE0o96VnICTXW-iMvVT26XYCK1FX-_XSZGrR8IvPmSZQk677Ee4ayy59aysAIfcUJGIeW0h-ywc-SmCyeAu82SF22Ai8JlL5qnC2RBOjjNQQwatUxceRDAn5p17qodwxj5UY2BNNdOEFjmh5r9chy77J8K29Qg0w0iqoefgxB9IyWxA3SsF5_rG_YtQs9YHhST4oJRb9jrjLOkg8cXopxJBntxXYe_h", // similar image placeholder
    images: ["https://lh3.googleusercontent.com/aida-public/AB6AXuCzEmcohy6GnuHFCcjQebzkZwE0o96VnICTXW-iMvVT26XYCK1FX-_XSZGrR8IvPmSZQk677Ee4ayy59aysAIfcUJGIeW0h-ywc-SmCyeAu82SF22Ai8JlL5qnC2RBOjjNQQwatUxceRDAn5p17qodwxj5UY2BNNdOEFjmh5r9chy77J8K29Qg0w0iqoefgxB9IyWxA3SsF5_rG_YtQs9YHhST4oJRb9jrjLOkg8cXopxJBntxXYe_h"],
    price: 350000,
    originalPrice: 500000,
    discountBadge: "-30%",
    rating: 4.8,
    reviewsCount: 350,
    soldCount: "1.5k+",
    description: "Buffet nướng lẩu Hàn Quốc trứ danh tại Gogi House. Thưởng thức dẻ sườn bò Mỹ, ba chỉ bò Mỹ, thịt heo sốt đặc trưng cùng quầy buffet phong phú.",
    highlights: [
      "Nguyên liệu thịt nhập khẩu chất lượng cao.",
      "Sốt chấm Gogi đặc trưng độc quyền.",
      "Kèm theo panchan đa dạng chuẩn Hàn.",
      "Không gian nướng không khói hiện đại."
    ],
    conditions: [
      "Áp dụng cho các ngày trong tuần từ Thứ 2 đến Thứ 6.",
      "Không áp dụng vào các ngày Lễ, Tết.",
      "Mỗi voucher chỉ sử dụng 1 lần cho 1 hóa đơn.",
      "Không có giá trị quy đổi thành tiền mặt."
    ],
    location: "Gogi House Vincom Center, Q1, TP.HCM & Gogi House Vạn Hạnh Mall, Q10, TP.HCM",
    guideSteps: [
      "Đến cửa hàng áp dụng chương trình.",
      "Mở ứng dụng hoặc trang web và đưa mã QR / Mã voucher cho nhân viên thu ngân.",
      "Nhân viên quét mã và áp dụng ưu đãi vào hóa đơn thanh toán."
    ]
  },
  {
    id: "iphone-15-pro-max-discount",
    title: "Voucher Giảm 30% Mua Sắm iPhone 15 Pro Max",
    brand: "TechZone Store",
    brandLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKj2Ua2o04uvw74K8Arw42a7hD3UNWh4RShdWGa2sofnMD8f7hKc1IiABNWe2ZSHwZT4STT39AmYIrk4WvRsPISLnOZLqDnDl1gFsFAvlbWpNJEvWU1BIsQBzobyn04YXRBibc0I0hSREr8Sxj7ArPFr2t2wV5DVKHmfwetfcT9l6e6RZPDDkncv7qauQwEdqy90fMw3aQWDYRNOKJoKI9dRrkrW5tUwGaT_ERcm-7f5isVZfKEkVA",
    category: "Điện tử",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuAEyX6QrXDI3jCpu330ltSLLYmJci5pYryyT9RyP0VW2sYFFbBpZ46v2L84u2VDCfwb1PmHuxQ-L9ufzDVSRgQiIR6UcxeD3bi45lt3iOozvrENQVJVG1YbezmCPv5dt9WjTv9Q5MkH2JNc5hxXymdVT4FR8pPsgTZXSiFxAN84BWxCAWVqC0JIkacFvn1FnnKS21o-zKvSV8gkMttQBATioXZphOqzXO9uheiZMxTvHyF08h88-eae",
    images: ["https://lh3.googleusercontent.com/aida-public/AB6AXuAEyX6QrXDI3jCpu330ltSLLYmJci5pYryyT9RyP0VW2sYFFbBpZ46v2L84u2VDCfwb1PmHuxQ-L9ufzDVSRgQiIR6UcxeD3bi45lt3iOozvrENQVJVG1YbezmCPv5dt9WjTv9Q5MkH2JNc5hxXymdVT4FR8pPsgTZXSiFxAN84BWxCAWVqC0JIkacFvn1FnnKS21o-zKvSV8gkMttQBATioXZphOqzXO9uheiZMxTvHyF08h88-eae"],
    price: 1750000,
    originalPrice: 2500000,
    discountBadge: "-30%",
    rating: 4.8,
    reviewsCount: 120,
    soldCount: "100+",
    featured: false
  },
  {
    id: "sushi-sakura",
    title: "Buffet Sushi Cao Cấp Dành Cho 2 Người",
    brand: "Sakura Restaurant",
    brandLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuC27y0GJDlQB_PHOVdYOBxC0ZE6RxnSRbdnvVmRg4TN3d-fqInXu0TuLT_OHoYpJqvBvYmszFR_ZxgmyWkbmN3EcqQmyjFzGSMvCIVxIEPUJGE3Wd6Us37erRZTmkmDqzlMId0FPM1Q0EqaE_uijgH4RgkhoNVRLiEfCnehx9rpDBITW6pzCVcB_cHvFiLGbSPazT0h6BM01NwYQVydJhEEKqplwd1q2niu-1cdphLoCYlXUcKD6GyC",
    category: "Ẩm thực",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuDCF2FT5Bn897_3ljSE6IJ29zE0pAzW5ftbe8z5T-ghAPCeEaQOViJYCHl-RMfh5nlCNSwkWiu5QNmyYIv-m6a4E7Q-I0nvpM6BHtnfUQwWR1oSycdLih85XXOu5xiqbE0Y_Mn3-uxeY6XAHs-qICLvb0l3Ch0_H3n-L2OoKH4EsfWqJnmEbgnFZZJ9sRpabHXF4H4XOSooMpriO1yOr2Rh_owbSt83aPtz9yyyAjhHuB2y381ZvCBd",
    images: ["https://lh3.googleusercontent.com/aida-public/AB6AXuDCF2FT5Bn897_3ljSE6IJ29zE0pAzW5ftbe8z5T-ghAPCeEaQOViJYCHl-RMfh5nlCNSwkWiu5QNmyYIv-m6a4E7Q-I0nvpM6BHtnfUQwWR1oSycdLih85XXOu5xiqbE0Y_Mn3-uxeY6XAHs-qICLvb0l3Ch0_H3n-L2OoKH4EsfWqJnmEbgnFZZJ9sRpabHXF4H4XOSooMpriO1yOr2Rh_owbSt83aPtz9yyyAjhHuB2y381ZvCBd"],
    price: 600000,
    originalPrice: 1200000,
    discountBadge: "-50%",
    rating: 4.9,
    reviewsCount: 345,
    soldCount: "1.2k+"
  },
  {
    id: "phu-quoc-resort",
    title: "Nghỉ Dưỡng 3N2Đ Tại Resort 5 Sao Phú Quốc",
    brand: "Ocean View Resort",
    brandLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKj2Ua2o04uvw74K8Arw42a7hD3UNWh4RShdWGa2sofnMD8f7hKc1IiABNWe2ZSHwZT4STT39AmYIrk4WvRsPISLnOZLqDnDl1gFsFAvlbWpNJEvWU1BIsQBzobyn04YXRBibc0I0hSREr8Sxj7ArPFr2t2wV5DVKHmfwetfcT9l6e6RZPDDkncv7qauQwEdqy90fMw3aQWDYRNOKJoKI9dRrkrW5tUwGaT_ERcm-7f5isVZfKEkVA",
    category: "Du lịch",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuC_EN-fG79Ah2g3ydGo818jEdIksZBbGHxsOTUVBVZAG2JEaYSIIQRCjob3EdSr0tgVMMTXZu-STlwCEdQJ0fLugWj7n-_MZUGK4Q7JcbnuvzexiA5q-R898dukR8VbfuAtyU9W-skjvUcejsgFITLzQeWnVDCpORpA5ReMfjbDubLABsid5nA18-UdZlddfutZio3RsYBb3NsOhgOVc6f8TqH8J7MMKHLkZr1FHVsh5H2NBk_djOrM",
    images: ["https://lh3.googleusercontent.com/aida-public/AB6AXuC_EN-fG79Ah2g3ydGo818jEdIksZBbGHxsOTUVBVZAG2JEaYSIIQRCjob3EdSr0tgVMMTXZu-STlwCEdQJ0fLugWj7n-_MZUGK4Q7JcbnuvzexiA5q-R898dukR8VbfuAtyU9W-skjvUcejsgFITLzQeWnVDCpORpA5ReMfjbDubLABsid5nA18-UdZlddfutZio3RsYBb3NsOhgOVc6f8TqH8J7MMKHLkZr1FHVsh5H2NBk_djOrM"],
    price: 6000000,
    originalPrice: 8000000,
    discountBadge: "-25%",
    rating: 4.7,
    reviewsCount: 89,
    soldCount: "200+"
  }
];

export const mockMyVouchers: MyVoucher[] = [
  {
    id: "my-gogi",
    voucherId: "gogi-house-barbecue",
    code: "GOGI88X9",
    datePurchased: "15/10/2024",
    expiryDate: "30/11/2024",
    status: "unused",
    orderNumber: "ORD-2024-9981",
    paymentMethod: "Ví VNPay"
  },
  {
    id: "my-grab",
    voucherId: "grab-discount-used", // custom local
    code: "GRAB20-XXX",
    datePurchased: "10/10/2024",
    expiryDate: "20/10/2024",
    status: "used",
    dateUsed: "15/10/2024",
    orderNumber: "ORD-2024-9912",
    paymentMethod: "Thẻ Visa"
  }
];

export const mockAdminStats = [
  {
    title: "Tổng doanh thu",
    value: "1.285.400.000 ₫",
    change: "+14.2%",
    trend: "up",
    icon: "payments",
    color: "bg-blue-50 text-blue-600",
    description: "Doanh thu sàn giao dịch",
  },
  {
    title: "Đơn hàng hoàn tất",
    value: "18.420",
    change: "+8.5%",
    trend: "up",
    icon: "shopping_bag",
    color: "bg-emerald-50 text-emerald-600",
    description: "Đơn thành công trong kỳ",
  },
  {
    title: "Voucher đã quy đổi",
    value: "14.150 / 16.000",
    change: "88.4%",
    trend: "neutral",
    icon: "confirmation_number",
    color: "bg-amber-50 text-amber-600",
    description: "Tỷ lệ quy đổi voucher",
  },
  {
    title: "Khách hàng",
    value: "125.400",
    change: "+1.250 mới",
    trend: "up",
    icon: "group",
    color: "bg-purple-50 text-purple-600",
    description: "Tổng tài khoản người dùng",
  },
  {
    title: "Đối tác hoạt động",
    value: "240 đối tác",
    change: "+4 chờ duyệt",
    trend: "up",
    icon: "store",
    color: "bg-indigo-50 text-indigo-600",
    description: "Thương hiệu & điểm bán",
  },
];

export const mockAdminPendingApprovals = [
  {
    id: "P-892",
    name: "Tập đoàn Ẩm thực Golden Gate",
    type: "Đối tác thương hiệu",
    date: "03/08/2026",
    status: "Chờ duyệt hồ sơ",
    link: "/admin/partners/pending",
  },
  {
    id: "V-1024",
    name: "Voucher giảm 50k Bánh mì Huỳnh Hoa",
    type: "Duyệt chiến dịch Voucher",
    date: "03/08/2026",
    status: "Chờ kiểm duyệt nội dung",
    link: "/admin/vouchers/pending",
  },
  {
    id: "P-890",
    name: "Chuỗi Cà phê Highlands Coffee",
    type: "Cập nhật tài khoản doanh nghiệp",
    date: "02/08/2026",
    status: "Chờ xác minh thuế",
    link: "/admin/partners/pending",
  },
];

export const mockAdminChartData = [
  { label: "T2", issue: 65, redeem: 50, revenue: 120, orders: 85 },
  { label: "T3", issue: 80, redeem: 70, revenue: 155, orders: 110 },
  { label: "T4", issue: 45, redeem: 38, revenue: 95, orders: 65 },
  { label: "T5", issue: 90, redeem: 82, revenue: 180, orders: 130 },
  { label: "T6", issue: 100, redeem: 95, revenue: 210, orders: 150 },
  { label: "T7", issue: 120, redeem: 110, revenue: 260, orders: 190 },
  { label: "CN", issue: 115, redeem: 105, revenue: 240, orders: 175 },
];
