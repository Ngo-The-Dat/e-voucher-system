let envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
if (envUrl && !envUrl.startsWith("http://") && !envUrl.startsWith("https://")) {
  envUrl = `http://${envUrl}`;
}
const API_BASE = envUrl;

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
    request<{ token: string; user: CustomerUser }>("/customer/auth/login", {
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
  payment_status?: string;
  order_status?: string;
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
  getMyVoucherById: (issuedVoucherId: number) => customerVoucherApi.getMyVoucherById(issuedVoucherId)
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
    request<{ categories: Array<{ category_id: number; category_name: string; description?: string }> }>("/customer/vouchers/categories")
};


