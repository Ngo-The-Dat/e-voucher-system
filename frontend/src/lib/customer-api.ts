const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const API_BASE = rawApiUrl.startsWith("http://") || rawApiUrl.startsWith("https://")
  ? rawApiUrl
  : `http://${rawApiUrl}`;

const getStoredCustomerToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("customer_access_token") || localStorage.getItem("token");
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
    throw new Error(data.message || "Đã xảy ra lỗi khi kết nối tới máy chủ.");
  }
  return data as T;
}

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
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  order: {
    order_id: number;
    created_at: string;
    total_amount: number;
    payment_method: string;
    payment_status: string;
    order_status: string;
    is_gift: boolean;
    recipient_user_id: number;
    vouchers: Array<{
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
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
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

export const customerOrderApi = {
  createOrder: (payload: CreateOrderPayload) =>
    request<CreateOrderResponse>("/customer/orders", {
      method: "POST",
      body: JSON.stringify(payload)
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
  getMyVouchers: (status?: string) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return request<{ vouchers: CustomerVoucherItem[] }>(`/customer/orders/vouchers${query}`);
  },
  getMyVoucherById: (issuedVoucherId: number) =>
    request<CustomerVoucherItem>(`/customer/orders/vouchers/${issuedVoucherId}`)
};

export interface BackendCatalogVoucher {
  program_id: number;
  program_name: string;
  original_price: number;
  sale_price: number;
  discount_amount: number;
  issue_quantity: number;
  sold_count: number;
  available_stock: number;
  sale_start_at?: string;
  sale_end_at?: string;
  use_start_at?: string;
  use_end_at?: string;
  description?: string;
  terms_conditions?: string;
  category_name: string;
  business_name: string;
  avg_rating: number;
  reviews_count: number;
  branches?: string[];
  addresses?: string[];
  reviews?: Array<{
    review_id: number;
    rating: number;
    comment?: string;
    created_at: string;
    author_name: string;
  }>;
}

export const customerCatalogApi = {
  getVouchers: (params?: {
    search?: string;
    category_id?: number;
    min_price?: number;
    max_price?: number;
    sort?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.category_id) searchParams.set("category_id", String(params.category_id));
    if (params?.min_price !== undefined) searchParams.set("min_price", String(params.min_price));
    if (params?.max_price !== undefined) searchParams.set("max_price", String(params.max_price));
    if (params?.sort) searchParams.set("sort", params.sort);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return request<{ vouchers: BackendCatalogVoucher[]; pagination: any }>(`/customer/vouchers${query}`);
  },
  getVoucherById: (programId: number) =>
    request<BackendCatalogVoucher>(`/customer/vouchers/${programId}`)
};


