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

  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("customer_access_token");
      localStorage.removeItem("token");
    }
    throw new Error(data.message || "Đã xảy ra lỗi khi kết nối tới máy chủ.");
  }
  return data as T;
}

export interface CustomerUser {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  status?: string;
}

export const customerAuthApi = {
  login: (payload: { email: string; password: string }) =>
    request<{ token: string; user: CustomerUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  register: (payload: { full_name: string; email: string; phone?: string; password: string }) =>
    request<{ message: string; token: string; user: CustomerUser }>("/customer/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getMe: () => request<CustomerUser>("/customer/auth/me"),
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
