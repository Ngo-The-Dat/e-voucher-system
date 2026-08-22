const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export const getStoredCustomerToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("customer_access_token") || localStorage.getItem("token");
};

export const getStoredCustomerUser = (): CustomerUser | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("customer_user");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredCustomerToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get("content-type") || "";
  let data: any = null;

  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    const text = await response.text();
    data = { message: text && text.length < 200 ? text : `Lỗi máy chủ (HTTP ${response.status})` };
  }

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("customer_access_token");
      localStorage.removeItem("token");
    }
    throw new Error(data?.message || `Lỗi kết nối máy chủ (HTTP ${response.status})`);
  }
  return data as T;
}

export interface CustomerUser {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  gender?: string;
  identity_no?: string;
  nationality?: string;
  created_at?: string;
}

export const customerAuthApi = {
  login: (payload: { email: string; password: string }) =>
    request<{ token: string; user: CustomerUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  register: (payload: {
    full_name: string;
    email?: string;
    phone?: string;
    password: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
  }) =>
    request<{ message: string; token: string; user: CustomerUser }>("/customer/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  requestPasswordReset: (email: string) =>
    request<{ challenge_id: string; expires_in: number; resend_after: number }>("/customer/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email })
    }),
  verifyPasswordResetOtp: (payload: { email: string; challenge_id: string; code: string }) =>
    request<{ verified: boolean; challenge_id: string }>("/customer/auth/verify-reset-otp", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  resetPassword: (payload: { email: string; challenge_id: string; new_password: string }) =>
    request<{ message: string }>("/customer/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  changePassword: (payload: { current_password: string; new_password: string }) =>
    request<{ message: string }>("/customer/auth/change-password", {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  getMe: () => request<CustomerUser>("/customer/auth/me"),
  updateProfile: (data: { full_name: string; phone?: string; gender?: string; identity_no?: string; nationality?: string }) =>
    request<CustomerUser>("/customer/auth/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("customer_access_token");
      localStorage.removeItem("customer_user");
      localStorage.removeItem("token");
    }
  }
};

export interface BackendCartItem {
  cart_item_id: number;
  program_id: number;
  quantity: number;
  program_name: string;
  original_price: number;
  sale_price: number;
  discount_amount: number;
  sale_start_at: string;
  sale_end_at: string;
  use_start_at: string;
  use_end_at: string;
  display_status: string;
  category_name?: string;
  business_name?: string;
  brand_logo?: string | null;
  images?: string[];
  thumbnail?: string;
  available_stock: number;
  line_total: number;
}

export interface CartResponse {
  items: BackendCartItem[];
  subtotal: number;
  total_items: number;
}

export interface CartMutationResponse {
  message: string;
  adjusted: boolean;
  cart_item: BackendCartItem;
}

export const customerCartApi = {
  getCart: () => request<CartResponse>("/customer/cart"),
  addToCart: (programId: number, quantity = 1) =>
    request<CartMutationResponse>("/customer/cart", {
      method: "POST",
      body: JSON.stringify({ programId, quantity })
    }),
  updateCartItem: (cartItemId: number, quantity: number) =>
    request<CartMutationResponse>(`/customer/cart/${cartItemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity })
    }),
  removeFromCart: (cartItemId: number) =>
    request<{ message: string }>(`/customer/cart/${cartItemId}`, {
      method: "DELETE"
    }),
  clearCart: () =>
    request<{ message: string }>("/customer/cart", {
      method: "DELETE"
    })
};

export interface CreateOrderItemInput {
  cart_item_id?: number;
  program_id: number;
  quantity: number;
}

export interface RecipientInfoInput {
  full_name: string;
  email?: string;
  phone?: string;
}

export interface CreateOrderPayload {
  items: CreateOrderItemInput[];
  is_gift?: boolean;
  recipient_info?: RecipientInfoInput;
  payment_method?: string;
  auto_pay?: boolean;
}

export interface CustomerVoucherItem {
  issued_voucher_id: number;
  voucher_code: string;
  usage_status: 'UNUSED' | 'USED' | 'EXPIRED' | 'CANCELLED';
  issued_at: string;
  expires_at: string;
  used_at?: string | null;
  discount_amount: number;
  program_id: number;
  program_name: string;
  description?: string;
  terms_conditions?: string;
  original_price: number;
  sale_price: number;
  use_start_at: string;
  use_end_at: string;
  category_name?: string;
  business_name?: string;
  partner_logo?: string;
  applicable_branches?: string[];
  applicable_addresses?: string[];
  order_id?: number | null;
  purchase_date?: string;
  payment_method?: string;
  payment_status?: string;
  order_status?: "PENDING" | "COMPLETED" | "CANCELLED" | string;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  order: {
    order_id: number;
    created_at: string;
    elapsed_seconds?: number;
    total_amount: number;
    payment_method: string;
    payment_status: "UNPAID" | "PAID" | "FAILED" | "REFUNDED" | string;
    order_status: "PENDING" | "COMPLETED" | "CANCELLED" | string;
    is_gift?: boolean;
    recipient_user_id?: number;
    vouchers?: Array<{
      issued_voucher_id: number;
      voucher_code: string;
      qr_code: string;
      usage_status: string;
      issued_at: string;
      expires_at: string;
      program_name: string;
    }>;
  };
}

export interface CustomerOrder {
  order_id: number;
  created_at: string;
  elapsed_seconds?: number;
  total_amount: number;
  payment_method: string;
  payment_status: "UNPAID" | "PAID" | "FAILED" | "REFUNDED" | string;
  order_status: "PENDING" | "COMPLETED" | "CANCELLED" | string;
  buyer_user_id: number;
  recipient_user_id: number;
  buyer_name?: string;
  recipient_name?: string;
  items: Array<{
    order_item_id: number;
    program_id: number;
    program_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
}

export const customerVoucherApi = {
  getMyVouchers: (status?: string) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return request<{ vouchers: CustomerVoucherItem[] }>(`/customer/my-vouchers${query}`);
  },
  getMyVoucherById: (issuedVoucherId: number) =>
    request<CustomerVoucherItem>(`/customer/my-vouchers/${issuedVoucherId}`)
};

export const customerOrderApi = {
  createOrder: (payload: CreateOrderPayload) =>
    request<CreateOrderResponse>("/customer/orders", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  payOrder: (orderId: number, paymentMethod?: string) =>
    request<CreateOrderResponse>(`/customer/orders/${orderId}/pay`, {
      method: "POST",
      body: JSON.stringify({ payment_method: paymentMethod })
    }),
  getOrders: (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return request<{ orders: CustomerOrder[]; pagination: any }>(`/customer/orders${query}`);
  },
  getOrderById: (orderId: number) =>
    request<CustomerOrder>(`/customer/orders/${orderId}`),
  getMyVouchers: (status?: string) => customerVoucherApi.getMyVouchers(status),
  getMyVoucherById: (issuedVoucherId: number) => customerVoucherApi.getMyVoucherById(issuedVoucherId),
};

export interface PaymentMethodItem {
  code: string;
  name: string;
  description: string;
  currency: string;
  is_active: boolean;
}

export interface PayPalCreateOrderResponse {
  success: boolean;
  message: string;
  payment: {
    order_id: number;
    paypal_order_id: string;
    amount_vnd: number;
    amount_usd: number;
    exchange_rate: number;
    rate_source?: string;
    currency: string;
    status: string;
    approve_url: string;
    created_at?: string;
  };
}

/**
 * Kiểu dữ liệu phản hồi khi tạo phiên Stripe Checkout Session thành công
 */
export interface StripeCreateSessionResponse {
  success: boolean;
  message: string;
  payment: {
    order_id: number;
    session_id: string;      // ID phiên thanh toán do Stripe cấp
    checkout_url: string;    // URL chuyển hướng người dùng sang trang thanh toán của Stripe
    amount_vnd: number;      // Số tiền thanh toán bằng VND
    currency: string;        // Đơn vị tiền tệ (mặc định 'VND')
    status: string;          // Trạng thái phiên ('OPEN')
    created_at?: string;
  };
}

/**
 * Kiểu dữ liệu phản hồi khi tạo phiên thanh toán thẻ ZaloPay Sandbox thành công
 */
export interface ZaloPayCreatePaymentResponse {
  success: boolean;
  message: string;
  payment: {
    order_id: number;
    app_trans_id: string;
    zp_trans_token?: string;
    order_url: string;       // URL chuyển hướng người dùng sang trang thanh toán của ZaloPay
    amount_vnd: number;
    status: string;
    created_at?: string;
  };
}

export const customerPaymentApi = {
  getPaymentMethods: () =>
    request<{ success: boolean; payment_methods: PaymentMethodItem[] }>("/customer/payments/methods"),
  createPayPalOrder: (orderId: number) =>
    request<PayPalCreateOrderResponse>("/customer/payments/paypal/create-order", {
      method: "POST",
      body: JSON.stringify({ order_id: orderId }),
    }),
  capturePayPalOrder: (orderId: number, paypalOrderId?: string, payerInfo?: { email?: string; name?: string }) =>
    request<CreateOrderResponse>("/customer/payments/paypal/capture-order", {
      method: "POST",
      body: JSON.stringify({
        order_id: orderId,
        paypal_order_id: paypalOrderId,
        payer_info: payerInfo,
      }),
    }),
  simulatePayPal: (orderId: number, scenario: string, paypalOrderId?: string, payerInfo?: { email?: string; name?: string }) =>
    request<any>("/customer/payments/paypal/simulate", {
      method: "POST",
      body: JSON.stringify({
        order_id: orderId,
        scenario,
        paypal_order_id: paypalOrderId,
        payer_info: payerInfo,
      }),
    }),
  getPayPalStatus: (orderId: number) =>
    request<any>(`/customer/payments/paypal/order/${orderId}/status`),

  // ==========================================
  // CÁC HÀM XỬ LÝ CỔNG THANH TOÁN STRIPE SANDBOX
  // ==========================================

  /**
   * 1. Khởi tạo phiên thanh toán Stripe Checkout và nhận URL chuyển hướng
   */
  createStripeSession: (orderId: number) =>
    request<StripeCreateSessionResponse>("/customer/payments/stripe/create-checkout-session", {
      method: "POST",
      body: JSON.stringify({ order_id: orderId }),
    }),

  /**
   * 2. Xác thực giao dịch thanh toán từ Stripe và phát hành mã E-Voucher
   */
  captureStripeOrder: (orderId: number, sessionId?: string) =>
    request<CreateOrderResponse>("/customer/payments/stripe/capture-order", {
      method: "POST",
      body: JSON.stringify({
        order_id: orderId,
        session_id: sessionId,
      }),
    }),

  /**
   * 3. Tra cứu trạng thái đơn hàng Stripe
   */
  getStripeStatus: (orderId: number) =>
    request<any>(`/customer/payments/stripe/order/${orderId}/status`),

  // ==========================================
  // CÁC HÀM XỬ LÝ CỔNG THANH TOÁN ZALOPAY SANDBOX
  // ==========================================

  /**
   * 1. Khởi tạo phiên thanh toán ZaloPay Sandbox và nhận QR Code / URL chuyển hướng
   */
  createZaloPayPayment: (orderId: number, bankCode?: string) =>
    request<ZaloPayCreatePaymentResponse>("/customer/payments/zalopay/create", {
      method: "POST",
      body: JSON.stringify({ order_id: orderId, bank_code: bankCode }),
    }),

  /**
   * 2. Xác thực giao dịch thanh toán từ ZaloPay và phát hành mã E-Voucher
   */
  captureZaloPayOrder: (orderId: number, params?: any) =>
    request<CreateOrderResponse>("/customer/payments/zalopay/capture-order", {
      method: "POST",
      body: JSON.stringify({
        order_id: orderId,
        ...params,
      }),
    }),

  /**
   * 3. Tra cứu trạng thái đơn hàng ZaloPay
   */
  getZaloPayStatus: (orderId: number) =>
    request<any>(`/customer/payments/zalopay/order/${orderId}/status`),

  // ==========================================
  // CÁC HÀM XỬ LÝ CỔNG THANH TOÁN VNPAY SANDBOX
  // ==========================================
  createVNPayPayment: (orderId: number) =>
    request<any>("/customer/payments/vnpay/create", {
      method: "POST",
      body: JSON.stringify({ orderId }),
    }),
  verifyVNPayPayment: (params: string) =>
    request<any>(`/customer/payments/vnpay/verify${params}`),
};

export interface PublicVouchersFilter {
  search?: string;
  category_id?: number | string;
  category_name?: string;
  min_price?: number;
  max_price?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface CustomerCategory {
  category_id: number;
  category_name: string;
  description?: string;
  voucher_count?: number;
}

export interface CustomerBanner {
  banner_id: number;
  program_id: number | null;
  title: string;
  image_url: string;
  target_url: string;
  display_position: string;
  program_name?: string | null;
  original_price?: number | null;
  sale_price?: number | null;
  brand_name?: string | null;
  brand_logo?: string | null;
}

export interface CustomerPopup {
  popup_id: number;
  program_id: number | null;
  title: string;
  content: string;
  target_url: string;
  image_url: string;
  program_name?: string | null;
  original_price?: number | null;
  sale_price?: number | null;
  brand_name?: string | null;
  brand_logo?: string | null;
}

export interface CustomerContent {
  content_id: number;
  program_id: number | null;
  title: string;
  body: string;
  content_type: 'POLICY' | 'ARTICLE' | 'PROMOTION' | 'GUIDE';
  created_at: string;
  updated_at?: string | null;
  program_name?: string | null;
  brand_name?: string | null;
  brand_logo?: string | null;
}

export const customerCatalogApi = {
  getVouchers: (filter: PublicVouchersFilter = {}) => {
    const searchParams = new URLSearchParams();
    if (filter.search) searchParams.set("search", filter.search);
    if (filter.category_id) searchParams.set("category_id", String(filter.category_id));
    if (filter.category_name) searchParams.set("category_name", filter.category_name);
    if (filter.min_price) searchParams.set("min_price", String(filter.min_price));
    if (filter.max_price) searchParams.set("max_price", String(filter.max_price));
    if (filter.sort) searchParams.set("sort", filter.sort);
    if (filter.page) searchParams.set("page", String(filter.page));
    if (filter.limit) searchParams.set("limit", String(filter.limit));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return request<{ vouchers: any[]; pagination: any }>(`/customer/vouchers${query}`);
  },
  getVoucherById: (programId: number | string) =>
    request<any>(`/customer/vouchers/${programId}`),
  getCategories: () =>
    request<{ categories: CustomerCategory[] }>("/customer/vouchers/categories")
};

export const customerContentApi = {
  getBanners: (position?: string) => {
    const query = position ? `?position=${encodeURIComponent(position)}` : "";
    return request<{ banners: CustomerBanner[] }>(`/customer/banners${query}`);
  },
  getActivePopups: () =>
    request<{ popups: CustomerPopup[] }>("/customer/popups/active"),
  getContents: (type?: string, programId?: number) => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (programId) params.set("program_id", String(programId));
    const query = params.toString() ? `?${params.toString()}` : "";
    return request<{ contents: CustomerContent[] }>(`/customer/contents${query}`);
  },
  getContentById: (id: number) =>
    request<CustomerContent>(`/customer/contents/${id}`)
};

export interface CheckReviewEligibilityResponse {
  canReview: boolean;
  hasPurchased: boolean;
  hasReviewed: boolean;
  issuedVoucherId?: number;
  voucherCode?: string;
  existingReview?: {
    review_id: number;
    rating: number;
    review_content?: string | null;
    complaint_content?: string | null;
    submitted_at: string;
  } | null;
  message?: string;
}

export interface CreateReviewPayload {
  programId?: number | string;
  issuedVoucherId?: number | string;
  rating: number;
  reviewContent?: string;
  complaintContent?: string;
}

export const customerReviewApi = {
  checkEligibility: (programId: number | string) =>
    request<CheckReviewEligibilityResponse>(`/customer/reviews/eligibility/${programId}`),
  createReview: (payload: CreateReviewPayload) =>
    request<{ message: string; review: any }>("/customer/reviews", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getProgramReviews: (programId: number | string) =>
    request<{ reviews: any[]; summary: any }>(`/customer/reviews/program/${programId}`),
  getMyReviews: () =>
    request<any[]>("/customer/reviews/my"),
};
