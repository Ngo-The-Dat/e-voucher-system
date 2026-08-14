const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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
