export interface IssuedVoucherItem {
  voucherCode: string;
  qrCode: string;
  voucherTitle: string;
  merchantName: string;
  price: number;
  expiryDate: string;
  status: "UNUSED" | "USED" | "INVALIDATED";
}

export interface OrderItemLine {
  programId: string;
  programTitle: string;
  merchantName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderData {
  orderId: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  recipientId?: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  isGift: boolean;
  orderDate: string;
  orderTime: string;
  totalAmount: number;
  paymentMethod: "Ví MoMo" | "VNPay QR" | "Thẻ ATM/Quốc tế";
  orderStatus: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  paymentStatus: "UNPAID" | "PAID" | "FAILED" | "REFUNDED";
  orderItems: OrderItemLine[];
  vouchers: IssuedVoucherItem[];
  cancelReason?: string;
  cancelledAt?: string;
}

export const MOCK_ORDERS: OrderData[] = [
  {
    orderId: "ORD-8801",
    buyerId: "CUS-101",
    buyerName: "Nguyễn Văn An",
    buyerEmail: "an.nguyen@gmail.com",
    buyerPhone: "0908 123 456",
    isGift: false,
    orderDate: "04/08/2026",
    orderTime: "14:22",
    totalAmount: 70000,
    paymentMethod: "Ví MoMo",
    orderStatus: "CONFIRMED",
    paymentStatus: "PAID",
    orderItems: [
      {
        programId: "PRG-HG-50K",
        programTitle: "Voucher Highlands Coffee 50.000đ",
        merchantName: "Highlands Coffee",
        unitPrice: 35000,
        quantity: 2,
        lineTotal: 70000,
      },
    ],
    vouchers: [
      {
        voucherCode: "VCH-PH-9001",
        qrCode: "QR-HIGHLANDS-50K-01",
        voucherTitle: "Voucher Highlands Coffee 50.000đ",
        merchantName: "Highlands Coffee",
        price: 35000,
        expiryDate: "30/09/2026",
        status: "UNUSED",
      },
      {
        voucherCode: "VCH-PH-9002",
        qrCode: "QR-HIGHLANDS-50K-02",
        voucherTitle: "Voucher Highlands Coffee 50.000đ",
        merchantName: "Highlands Coffee",
        price: 35000,
        expiryDate: "30/09/2026",
        status: "UNUSED",
      },
    ],
  },
  {
    orderId: "ORD-8802",
    buyerId: "CUS-102",
    buyerName: "Trần Thị Mai",
    buyerEmail: "mai.tran@yahoo.com",
    buyerPhone: "0912 987 654",
    recipientId: "CUS-205",
    recipientName: "Lê Hoàng Yến",
    recipientEmail: "yen.le@gmail.com",
    recipientPhone: "0988 333 444",
    isGift: true, // Đơn hàng mua tặng quà
    orderDate: "03/08/2026",
    orderTime: "13:05",
    totalAmount: 280000,
    paymentMethod: "VNPay QR",
    orderStatus: "COMPLETED",
    paymentStatus: "PAID",
    orderItems: [
      {
        programId: "PRG-KC-200K",
        programTitle: "Buffet Lẩu Kichi Kichi Giảm 20%",
        merchantName: "Golden Gate Group",
        unitPrice: 280000,
        quantity: 1,
        lineTotal: 280000,
      },
    ],
    vouchers: [
      {
        voucherCode: "VCH-PH-9015",
        qrCode: "QR-KICHI-200K-01",
        voucherTitle: "Buffet Lẩu Kichi Kichi Giảm 20%",
        merchantName: "Golden Gate Group",
        price: 280000,
        expiryDate: "15/09/2026",
        status: "USED", // RB-14 trigger: Đã sử dụng không thể hủy
      },
    ],
  },
  {
    orderId: "ORD-8803",
    buyerId: "CUS-103",
    buyerName: "Phạm Quốc Bảo",
    buyerEmail: "bao.pham@outlook.com",
    buyerPhone: "0934 111 999",
    isGift: false,
    orderDate: "02/08/2026",
    orderTime: "18:45",
    totalAmount: 158000,
    paymentMethod: "Thẻ ATM/Quốc tế",
    orderStatus: "CANCELLED",
    paymentStatus: "REFUNDED",
    cancelReason: "Khách hàng yêu cầu đổi sang suất chiếu phim khác.",
    cancelledAt: "02/08/2026 19:10",
    orderItems: [
      {
        programId: "PRG-CGV-2D",
        programTitle: "Vé xem phim CGV 2D Cuối Tuần",
        merchantName: "CGV Cinemas",
        unitPrice: 79000,
        quantity: 2,
        lineTotal: 158000,
      },
    ],
    vouchers: [
      {
        voucherCode: "VCH-PH-8811",
        qrCode: "QR-CGV-2D-01",
        voucherTitle: "Vé xem phim CGV 2D Cuối Tuần",
        merchantName: "CGV Cinemas",
        price: 79000,
        expiryDate: "31/08/2026",
        status: "INVALIDATED",
      },
      {
        voucherCode: "VCH-PH-8812",
        qrCode: "QR-CGV-2D-02",
        voucherTitle: "Vé xem phim CGV 2D Cuối Tuần",
        merchantName: "CGV Cinemas",
        price: 79000,
        expiryDate: "31/08/2026",
        status: "INVALIDATED",
      },
    ],
  },
  {
    orderId: "ORD-8804",
    buyerId: "CUS-104",
    buyerName: "Đỗ Minh Tuấn",
    buyerEmail: "tuan.do@gmail.com",
    buyerPhone: "0977 555 666",
    recipientId: "CUS-301",
    recipientName: "Nguyễn Thị Sen",
    recipientEmail: "sen.nguyen@spa.vn",
    recipientPhone: "0909 888 777",
    isGift: true, // Đơn mua tặng quà
    orderDate: "04/08/2026",
    orderTime: "16:10",
    totalAmount: 350000,
    paymentMethod: "Ví MoMo",
    orderStatus: "PENDING",
    paymentStatus: "UNPAID",
    orderItems: [
      {
        programId: "PRG-SEN-SPA",
        programTitle: "Voucher Spa Trẻ Hóa Da Mặt Cao Cấp",
        merchantName: "Sen Spa",
        unitPrice: 350000,
        quantity: 1,
        lineTotal: 350000,
      },
    ],
    vouchers: [
      {
        voucherCode: "VCH-PH-9100",
        qrCode: "QR-SPA-SEN-350K",
        voucherTitle: "Voucher Spa Trẻ Hóa Da Mặt Cao Cấp",
        merchantName: "Sen Spa",
        price: 350000,
        expiryDate: "31/08/2026",
        status: "UNUSED",
      },
    ],
  },
];
