import { toast } from "sonner";

/**
 * Danh mục ánh xạ các mã lỗi kỹ thuật hoặc mã lỗi API thường gặp
 * sang thông điệp tiếng Việt thân thiện, rõ ràng, lịch sự cho người dùng.
 */
const ERROR_MESSAGE_MAP: Record<string, string> = {
  // Lỗi xác thực & phân quyền
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.",
  AUTH_UNAUTHORIZED: "Vui lòng đăng nhập để thực hiện thao tác này.",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  INVALID_CREDENTIALS: "Tên đăng nhập hoặc mật khẩu không chính xác.",
  TOKEN_EXPIRED: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.",

  // Lỗi giỏ hàng & sản phẩm
  CART_EMPTY: "Giỏ hàng của bạn đang trống. Vui lòng chọn sản phẩm.",
  CART_ITEM_NOT_FOUND: "Không tìm thấy sản phẩm trong giỏ hàng.",
  PRODUCT_NOT_FOUND: "Không tìm thấy thông tin voucher yêu cầu.",
  OUT_OF_STOCK: "Sản phẩm này hiện đã hết hàng trong kho.",
  INSUFFICIENT_STOCK: "Số lượng voucher trong kho không đủ để đáp ứng yêu cầu của bạn.",
  INVALID_QUANTITY: "Số lượng sản phẩm không hợp lệ.",

  // Lỗi đơn hàng & thanh toán
  ORDER_NOT_FOUND: "Không tìm thấy đơn hàng yêu cầu.",
  ORDER_EXPIRED: "Đơn hàng đã hết thời gian thanh toán (quá 5 phút).",
  ORDER_ALREADY_PAID: "Đơn hàng này đã được thanh toán hoàn tất.",
  ORDER_CANCELLED: "Đơn hàng này đã bị hủy.",
  PAYMENT_FAILED: "Giao dịch thanh toán không thành công. Vui lòng thử lại.",
  PAYMENT_PROCESSING: "Giao dịch đang được xử lý, vui lòng chờ trong giây lát.",
  VNPAY_FAILED: "Thanh toán qua cổng VNPay không thành công hoặc đã bị hủy.",
  ZALOPAY_FAILED: "Thanh toán qua cổng ZaloPay không thành công hoặc đã bị hủy.",
  STRIPE_FAILED: "Thanh toán thẻ qua cổng Stripe không thành công.",
  PAYPAL_FAILED: "Thanh toán qua ví PayPal không thành công.",

  // Lỗi đánh giá & nhận voucher
  NOT_PURCHASED: "Bạn cần mua và thanh toán voucher thành công trước khi gửi đánh giá.",
  ALREADY_REVIEWED: "Mỗi mã voucher chỉ được gửi đánh giá 1 lần duy nhất.",
  REVIEW_ELIGIBILITY_FAILED: "Bạn chưa đủ điều kiện để thực hiện đánh giá voucher này.",
  VOUCHER_EXPIRED: "Voucher này đã hết hạn sử dụng.",
  VOUCHER_USED: "Voucher này đã được sử dụng trước đó.",
  VOUCHER_INVALID: "Mã voucher không hợp lệ hoặc không tồn tại.",
  VOUCHER_CANCELLED: "Voucher này đã bị hủy bỏ.",

  // Lỗi hệ thống & kết nối
  NETWORK_ERROR: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.",
  SERVER_ERROR: "Hệ thống đang bận hoặc gặp sự cố xử lý. Vui lòng thử lại sau giây lát.",
  INTERNAL_SERVER_ERROR: "Hệ thống đang xử lý tác vụ khác. Vui lòng thử lại sau.",
};

/**
 * Làm sạch và chuyển đổi bất kỳ lỗi nào (Error object, Error string, HTTP code, SQL...)
 * thành thông điệp tiếng Việt thân thiện, không để lộ mã kỹ thuật hoặc stack trace.
 */
export function sanitizeErrorMessage(
  error: unknown,
  fallbackMessage = "Đã xảy ra sự cố. Vui lòng thử lại sau."
): string {
  if (!error) return fallbackMessage;

  let raw = "";
  if (typeof error === "string") {
    raw = error.trim();
  } else if (error instanceof Error) {
    raw = error.message.trim();
  } else if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;
    raw = String(obj.message || obj.error || obj.detail || "").trim();
  }

  if (!raw) return fallbackMessage;

  // 1. Kiểm tra trực tiếp trong bảng ánh xạ mã lỗi
  const upperRaw = raw.toUpperCase();
  if (ERROR_MESSAGE_MAP[upperRaw]) {
    return ERROR_MESSAGE_MAP[upperRaw];
  }

  for (const [key, translated] of Object.entries(ERROR_MESSAGE_MAP)) {
    if (upperRaw === key || upperRaw.includes(key)) {
      return translated;
    }
  }

  // 2. Nhận diện các lỗi kết nối mạng / URL localhost / fetch failed
  if (
    raw.includes("Failed to fetch") ||
    raw.includes("fetch failed") ||
    raw.includes("NetworkError") ||
    raw.includes("localhost") ||
    raw.includes("127.0.0.1") ||
    raw.includes("ECONNREFUSED") ||
    raw.includes("ETIMEDOUT") ||
    raw.includes("timeout") ||
    raw.includes("HTTP 502") ||
    raw.includes("HTTP 503") ||
    raw.includes("HTTP 504")
  ) {
    return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại sau.";
  }

  // 3. Nhận diện lỗi HTTP 500 / Database / SQL / Cú pháp kỹ thuật
  if (
    raw.includes("HTTP 500") ||
    raw.includes("Internal Server Error") ||
    raw.includes("SQLSTATE") ||
    raw.includes("query error") ||
    raw.includes("SyntaxError") ||
    raw.includes("TypeError") ||
    raw.includes("ReferenceError") ||
    raw.includes("at ") || // stack trace line indicator
    raw.includes("node_modules") ||
    raw.includes(".ts:") ||
    raw.includes(".js:") ||
    raw.startsWith("{") || // raw JSON string
    raw.startsWith("[")
  ) {
    return "Hệ thống đang bận hoặc gặp lỗi xử lý. Vui lòng thử lại sau giây lát.";
  }

  // 4. Nhận diện lỗi 401 Unauthorized
  if (raw.includes("401") || raw.includes("Unauthorized") || raw.includes("unauthorized")) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.";
  }

  // 5. Nhận diện lỗi 403 Forbidden
  if (raw.includes("403") || raw.includes("Forbidden") || raw.includes("forbidden")) {
    return "Bạn không có quyền thực hiện thao tác này.";
  }

  // 6. Nếu thông điệp đã là tiếng Việt có nghĩa và không chứa ký tự kỹ thuật nhạy cảm, giữ nguyên
  const isVietnameseText = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(raw);
  const containsTechnicalGarbage = /[{}[\]()<>=;]|localhost|http:\/\//i.test(raw);

  if (isVietnameseText && !containsTechnicalGarbage && raw.length < 150) {
    return raw;
  }

  // Mặc định trả về fallback thân thiện
  return fallbackMessage;
}

/**
 * Trình phát thông báo popup toast ở góc dưới bên trái màn hình.
 */
export const notify = {
  /**
   * Thông báo thành công (Màu xanh lá)
   */
  success(message: string, description?: string) {
    toast.success(message, {
      description,
    });
  },

  /**
   * Thông báo cảnh báo (Màu vàng / cam)
   */
  warning(message: string, description?: string) {
    toast.warning(message, {
      description,
    });
  },

  /**
   * Thông báo thông tin (Màu xanh dương / trung tính)
   */
  info(message: string, description?: string) {
    toast.info(message, {
      description,
    });
  },

  /**
   * Thông báo lỗi (Màu đỏ), tự động làm sạch mã lỗi và ẩn stack trace kỹ thuật
   */
  error(error: unknown, fallbackMessage?: string) {
    const cleanMessage = sanitizeErrorMessage(error, fallbackMessage);
    toast.error(cleanMessage);
  },

  /**
   * Hàm tiện ích làm sạch chuỗi lỗi
   */
  sanitize: sanitizeErrorMessage,
};

export default notify;
