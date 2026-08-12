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

export interface CategoryPerformanceItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  soldCount: number;
  redeemedCount: number;
  rate: number; // percentage
  revenue: number;
}

export interface EfficiencyMetricItem {
  title: string;
  value: string;
  rate?: number; // 0 - 100 for progress bar
  description: string;
  badge?: string;
  badgeType?: "success" | "info" | "warning";
  icon: string;
  color: string;
}

export interface AdminDashboardTimeframeData {
  stats: {
    title: string;
    value: string;
    change: string;
    trend: "up" | "down" | "neutral";
    icon: string;
    color: string;
    description: string;
  }[];
  efficiencyMetrics: EfficiencyMetricItem[];
  categoryPerformance: CategoryPerformanceItem[];
}

export const mockAdminDashboardData: Record<"today" | "week" | "month", AdminDashboardTimeframeData> = {
  today: {
    stats: [
      {
        title: "Tổng doanh thu",
        value: "48.650.000 ₫",
        change: "+12.4%",
        trend: "up",
        icon: "payments",
        color: "bg-blue-50 text-blue-600",
        description: "So với hôm qua",
      },
      {
        title: "Đơn hàng hoàn tất",
        value: "640",
        change: "+6.8%",
        trend: "up",
        icon: "shopping_bag",
        color: "bg-emerald-50 text-emerald-600",
        description: "Đơn thành công hôm nay",
      },
      {
        title: "Voucher đã quy đổi",
        value: "520 / 580",
        change: "89.7%",
        trend: "neutral",
        icon: "confirmation_number",
        color: "bg-amber-50 text-amber-600",
        description: "Tỷ lệ quy đổi voucher",
      },
      {
        title: "Khách hàng",
        value: "125.400",
        change: "+85 mới",
        trend: "up",
        icon: "group",
        color: "bg-purple-50 text-purple-600",
        description: "Tổng tài khoản người dùng",
      },
      {
        title: "Đối tác hoạt động",
        value: "240 đối tác",
        change: "+1 chờ duyệt",
        trend: "up",
        icon: "store",
        color: "bg-indigo-50 text-indigo-600",
        description: "Thương hiệu & điểm bán",
      },
    ],
    efficiencyMetrics: [
      {
        title: "Tỷ lệ quy đổi Voucher",
        value: "89.7%",
        rate: 89.7,
        description: "520 voucher đã đổi trên tổng 580 voucher phát hành",
        badge: "Xuất sắc",
        badgeType: "success",
        icon: "verified",
        color: "text-emerald-600 bg-emerald-50",
      },
      {
        title: "Tỷ lệ hoàn tất đơn hàng",
        value: "96.5%",
        rate: 96.5,
        description: "640 đơn hoàn tất trên tổng 663 đơn khởi tạo",
        badge: "Rất cao",
        badgeType: "success",
        icon: "task_alt",
        color: "text-blue-600 bg-blue-50",
      },
      {
        title: "Giá trị đơn TB (AOV)",
        value: "76.015 ₫",
        description: "Doanh thu trung bình trên mỗi đơn hàng thành công",
        badge: "+4.5%",
        badgeType: "info",
        icon: "receipt_long",
        color: "text-purple-600 bg-purple-50",
      },
      {
        title: "Doanh thu TB / Đối tác",
        value: "202.700 ₫",
        description: "Doanh số trung bình mỗi đối tác đạt được hôm nay",
        badge: "Đang tăng",
        badgeType: "info",
        icon: "storefront",
        color: "text-indigo-600 bg-indigo-50",
      },
    ],
    categoryPerformance: [
      {
        id: "cat-fb",
        name: "Ẩm thực & Đồ uống",
        icon: "restaurant",
        color: "text-amber-600 bg-amber-50",
        soldCount: 380,
        redeemedCount: 345,
        rate: 90.8,
        revenue: 28400000,
      },
      {
        id: "cat-ent",
        name: "Giải trí & Rạp chiếu",
        icon: "movie",
        color: "text-purple-600 bg-purple-50",
        soldCount: 110,
        redeemedCount: 98,
        rate: 89.1,
        revenue: 8690000,
      },
      {
        id: "cat-spa",
        name: "Làm đẹp & Chăm sóc Spa",
        icon: "spa",
        color: "text-rose-600 bg-rose-50",
        soldCount: 52,
        redeemedCount: 46,
        rate: 88.5,
        revenue: 6240000,
      },
      {
        id: "cat-travel",
        name: "Du lịch & Khách sạn",
        icon: "flight",
        color: "text-sky-600 bg-sky-50",
        soldCount: 22,
        redeemedCount: 19,
        rate: 86.4,
        revenue: 3820000,
      },
      {
        id: "cat-shop",
        name: "Mua sắm & Tiêu dùng",
        icon: "shopping_cart",
        color: "text-emerald-600 bg-emerald-50",
        soldCount: 16,
        redeemedCount: 12,
        rate: 75.0,
        revenue: 1500000,
      },
    ],
  },
  week: {
    stats: [
      {
        title: "Tổng doanh thu",
        value: "1.285.400.000 ₫",
        change: "+14.2%",
        trend: "up",
        icon: "payments",
        color: "bg-blue-50 text-blue-600",
        description: "So với tuần trước",
      },
      {
        title: "Đơn hàng hoàn tất",
        value: "18.420",
        change: "+8.5%",
        trend: "up",
        icon: "shopping_bag",
        color: "bg-emerald-50 text-emerald-600",
        description: "Đơn thành công tuần này",
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
    ],
    efficiencyMetrics: [
      {
        title: "Tỷ lệ quy đổi Voucher",
        value: "88.4%",
        rate: 88.4,
        description: "14.150 voucher đã đổi trên tổng 16.000 voucher phát hành",
        badge: "Tốt",
        badgeType: "success",
        icon: "verified",
        color: "text-emerald-600 bg-emerald-50",
      },
      {
        title: "Tỷ lệ hoàn tất đơn hàng",
        value: "95.2%",
        rate: 95.2,
        description: "18.420 đơn hoàn tất trên tổng 19.340 đơn khởi tạo",
        badge: "Ổn định",
        badgeType: "success",
        icon: "task_alt",
        color: "text-blue-600 bg-blue-50",
      },
      {
        title: "Giá trị đơn TB (AOV)",
        value: "69.782 ₫",
        description: "Doanh thu trung bình trên mỗi đơn hàng thành công",
        badge: "+5.1%",
        badgeType: "info",
        icon: "receipt_long",
        color: "text-purple-600 bg-purple-50",
      },
      {
        title: "Doanh thu TB / Đối tác",
        value: "5.355.833 ₫",
        description: "Doanh số trung bình mỗi đối tác đóng góp tuần này",
        badge: "+11.3%",
        badgeType: "info",
        icon: "storefront",
        color: "text-indigo-600 bg-indigo-50",
      },
    ],
    categoryPerformance: [
      {
        id: "cat-fb",
        name: "Ẩm thực & Đồ uống",
        icon: "restaurant",
        color: "text-amber-600 bg-amber-50",
        soldCount: 9800,
        redeemedCount: 8850,
        rate: 90.3,
        revenue: 785000000,
      },
      {
        id: "cat-ent",
        name: "Giải trí & Rạp chiếu",
        icon: "movie",
        color: "text-purple-600 bg-purple-50",
        soldCount: 3600,
        redeemedCount: 3120,
        rate: 86.7,
        revenue: 215000000,
      },
      {
        id: "cat-spa",
        name: "Làm đẹp & Chăm sóc Spa",
        icon: "spa",
        color: "text-rose-600 bg-rose-50",
        soldCount: 1450,
        redeemedCount: 1250,
        rate: 86.2,
        revenue: 154000000,
      },
      {
        id: "cat-travel",
        name: "Du lịch & Khách sạn",
        icon: "flight",
        color: "text-sky-600 bg-sky-50",
        soldCount: 650,
        redeemedCount: 540,
        rate: 83.1,
        revenue: 95400000,
      },
      {
        id: "cat-shop",
        name: "Mua sắm & Tiêu dùng",
        icon: "shopping_cart",
        color: "text-emerald-600 bg-emerald-50",
        soldCount: 500,
        redeemedCount: 390,
        rate: 78.0,
        revenue: 36000000,
      },
    ],
  },
  month: {
    stats: [
      {
        title: "Tổng doanh thu",
        value: "5.420.000.000 ₫",
        change: "+18.6%",
        trend: "up",
        icon: "payments",
        color: "bg-blue-50 text-blue-600",
        description: "So với tháng trước",
      },
      {
        title: "Đơn hàng hoàn tất",
        value: "74.800",
        change: "+12.0%",
        trend: "up",
        icon: "shopping_bag",
        color: "bg-emerald-50 text-emerald-600",
        description: "Đơn thành công tháng này",
      },
      {
        title: "Voucher đã quy đổi",
        value: "58.200 / 65.000",
        change: "89.5%",
        trend: "neutral",
        icon: "confirmation_number",
        color: "bg-amber-50 text-amber-600",
        description: "Tỷ lệ quy đổi voucher",
      },
      {
        title: "Khách hàng",
        value: "125.400",
        change: "+5.800 mới",
        trend: "up",
        icon: "group",
        color: "bg-purple-50 text-purple-600",
        description: "Tổng tài khoản người dùng",
      },
      {
        title: "Đối tác hoạt động",
        value: "240 đối tác",
        change: "+18 chờ duyệt",
        trend: "up",
        icon: "store",
        color: "bg-indigo-50 text-indigo-600",
        description: "Thương hiệu & điểm bán",
      },
    ],
    efficiencyMetrics: [
      {
        title: "Tỷ lệ quy đổi Voucher",
        value: "89.5%",
        rate: 89.5,
        description: "58.200 voucher đã đổi trên tổng 65.000 voucher phát hành",
        badge: "Xuất sắc",
        badgeType: "success",
        icon: "verified",
        color: "text-emerald-600 bg-emerald-50",
      },
      {
        title: "Tỷ lệ hoàn tất đơn hàng",
        value: "96.1%",
        rate: 96.1,
        description: "74.800 đơn hoàn tất trên tổng 77.830 đơn khởi tạo",
        badge: "Rất cao",
        badgeType: "success",
        icon: "task_alt",
        color: "text-blue-600 bg-blue-50",
      },
      {
        title: "Giá trị đơn TB (AOV)",
        value: "72.460 ₫",
        description: "Doanh thu trung bình trên mỗi đơn hàng thành công",
        badge: "+7.8%",
        badgeType: "info",
        icon: "receipt_long",
        color: "text-purple-600 bg-purple-50",
      },
      {
        title: "Doanh thu TB / Đối tác",
        value: "22.583.333 ₫",
        description: "Doanh số trung bình mỗi đối tác đóng góp trong tháng",
        badge: "+15.2%",
        badgeType: "info",
        icon: "storefront",
        color: "text-indigo-600 bg-indigo-50",
      },
    ],
    categoryPerformance: [
      {
        id: "cat-fb",
        name: "Ẩm thực & Đồ uống",
        icon: "restaurant",
        color: "text-amber-600 bg-amber-50",
        soldCount: 41200,
        redeemedCount: 37400,
        rate: 90.8,
        revenue: 3310000000,
      },
      {
        id: "cat-ent",
        name: "Giải trí & Rạp chiếu",
        icon: "movie",
        color: "text-purple-600 bg-purple-50",
        soldCount: 15100,
        redeemedCount: 13200,
        rate: 87.4,
        revenue: 905000000,
      },
      {
        id: "cat-spa",
        name: "Làm đẹp & Chăm sóc Spa",
        icon: "spa",
        color: "text-rose-600 bg-rose-50",
        soldCount: 6200,
        redeemedCount: 5450,
        rate: 87.9,
        revenue: 658000000,
      },
      {
        id: "cat-travel",
        name: "Du lịch & Khách sạn",
        icon: "flight",
        color: "text-sky-600 bg-sky-50",
        soldCount: 2800,
        redeemedCount: 2420,
        rate: 86.4,
        revenue: 412000000,
      },
      {
        id: "cat-shop",
        name: "Mua sắm & Tiêu dùng",
        icon: "shopping_cart",
        color: "text-emerald-600 bg-emerald-50",
        soldCount: 2100,
        redeemedCount: 1730,
        rate: 82.4,
        revenue: 135000000,
      },
    ],
  },
};

export function getCustomAdminDashboardData(startDate: string, endDate: string): AdminDashboardTimeframeData {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const dailyRevenue = 180000000;
  const totalRevenue = dailyRevenue * diffDays;
  const totalOrders = 2600 * diffDays;
  const totalIssued = 2280 * diffDays;
  const totalRedeemed = Math.round(totalIssued * 0.885);
  const newUsers = 175 * diffDays;

  return {
    stats: [
      {
        title: "Tổng doanh thu",
        value: new Intl.NumberFormat("vi-VN").format(totalRevenue) + " ₫",
        change: `Trong ${diffDays} ngày`,
        trend: "up",
        icon: "payments",
        color: "bg-blue-50 text-blue-600",
        description: `Từ ${startDate} đến ${endDate}`,
      },
      {
        title: "Đơn hàng hoàn tất",
        value: new Intl.NumberFormat("vi-VN").format(totalOrders),
        change: `TB ${Math.round(totalOrders / diffDays)}/ngày`,
        trend: "up",
        icon: "shopping_bag",
        color: "bg-emerald-50 text-emerald-600",
        description: "Đơn thành công trong khoảng",
      },
      {
        title: "Voucher đã quy đổi",
        value: `${new Intl.NumberFormat("vi-VN").format(totalRedeemed)} / ${new Intl.NumberFormat("vi-VN").format(totalIssued)}`,
        change: "88.5%",
        trend: "neutral",
        icon: "confirmation_number",
        color: "bg-amber-50 text-amber-600",
        description: "Tỷ lệ quy đổi voucher",
      },
      {
        title: "Khách hàng",
        value: "125.400",
        change: `+${new Intl.NumberFormat("vi-VN").format(newUsers)} mới`,
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
    ],
    efficiencyMetrics: [
      {
        title: "Tỷ lệ quy đổi Voucher",
        value: "88.5%",
        rate: 88.5,
        description: `${new Intl.NumberFormat("vi-VN").format(totalRedeemed)} đã đổi trên ${new Intl.NumberFormat("vi-VN").format(totalIssued)} voucher`,
        badge: "Tốt",
        badgeType: "success",
        icon: "verified",
        color: "text-emerald-600 bg-emerald-50",
      },
      {
        title: "Tỷ lệ hoàn tất đơn hàng",
        value: "95.6%",
        rate: 95.6,
        description: `${new Intl.NumberFormat("vi-VN").format(totalOrders)} đơn hoàn tất trong ${diffDays} ngày`,
        badge: "Ổn định",
        badgeType: "success",
        icon: "task_alt",
        color: "text-blue-600 bg-blue-50",
      },
      {
        title: "Giá trị đơn TB (AOV)",
        value: new Intl.NumberFormat("vi-VN").format(Math.round(totalRevenue / totalOrders)) + " ₫",
        description: "Doanh thu trung bình trên mỗi đơn hàng",
        badge: "Chuẩn",
        badgeType: "info",
        icon: "receipt_long",
        color: "text-purple-600 bg-purple-50",
      },
      {
        title: "Doanh thu TB / Đối tác",
        value: new Intl.NumberFormat("vi-VN").format(Math.round(totalRevenue / 240)) + " ₫",
        description: `Doanh số trung bình / đối tác trong ${diffDays} ngày`,
        badge: "Đang tăng",
        badgeType: "info",
        icon: "storefront",
        color: "text-indigo-600 bg-indigo-50",
      },
    ],
    categoryPerformance: [
      {
        id: "cat-fb",
        name: "Ẩm thực & Đồ uống",
        icon: "restaurant",
        color: "text-amber-600 bg-amber-50",
        soldCount: Math.round(totalIssued * 0.6),
        redeemedCount: Math.round(totalRedeemed * 0.62),
        rate: 91.2,
        revenue: Math.round(totalRevenue * 0.61),
      },
      {
        id: "cat-ent",
        name: "Giải trí & Rạp chiếu",
        icon: "movie",
        color: "text-purple-600 bg-purple-50",
        soldCount: Math.round(totalIssued * 0.22),
        redeemedCount: Math.round(totalRedeemed * 0.21),
        rate: 86.8,
        revenue: Math.round(totalRevenue * 0.17),
      },
      {
        id: "cat-spa",
        name: "Làm đẹp & Chăm sóc Spa",
        icon: "spa",
        color: "text-rose-600 bg-rose-50",
        soldCount: Math.round(totalIssued * 0.1),
        redeemedCount: Math.round(totalRedeemed * 0.09),
        rate: 85.5,
        revenue: Math.round(totalRevenue * 0.12),
      },
      {
        id: "cat-travel",
        name: "Du lịch & Khách sạn",
        icon: "flight",
        color: "text-sky-600 bg-sky-50",
        soldCount: Math.round(totalIssued * 0.05),
        redeemedCount: Math.round(totalRedeemed * 0.05),
        rate: 84.0,
        revenue: Math.round(totalRevenue * 0.07),
      },
      {
        id: "cat-shop",
        name: "Mua sắm & Tiêu dùng",
        icon: "shopping_cart",
        color: "text-emerald-600 bg-emerald-50",
        soldCount: Math.round(totalIssued * 0.03),
        redeemedCount: Math.round(totalRedeemed * 0.03),
        rate: 80.0,
        revenue: Math.round(totalRevenue * 0.03),
      },
    ],
  };
}

export const mockAdminStats = mockAdminDashboardData.week.stats;

