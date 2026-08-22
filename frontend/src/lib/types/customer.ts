export interface Review {
  author: string;
  avatarLetter: string;
  avatarBg: string;
  rating: number;
  timeAgo: string;
  content: string;
  complaint?: string;
}

export interface Voucher {
  id: string;
  title: string;
  brand: string;
  brandLogo: string;
  category: string;
  merchant?: string;
  thumbnail: string;
  images?: string[];
  price: number;
  originalPrice: number;
  discount?: string;
  discountBadge?: string;
  bestSeller?: boolean;
  featured?: boolean;
  rating: number;
  reviewsCount?: number;
  reviews?: Review[];
  soldCount?: string;
  image?: string;
  expiryDate?: string;
  description?: string;
  highlights?: string[];
  conditions?: string[];
  location?: string;
  locations?: string[];
  guideSteps?: string[];
  terms?: string[];
  instructions?: string[];
  availableStock?: number;
}

export interface MyVoucher {
  id: string;
  voucherId: string;
  code: string;
  datePurchased: string;
  expiryDate: string;
  dateUsed?: string;
  status: "unused" | "used" | "expiring" | "expired" | "cancelled";
  orderNumber?: string;
  paymentMethod?: string;
}
