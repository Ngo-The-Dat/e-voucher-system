/**
 * =========================================================================================
 * FILE: exchange-rate.service.ts
 * VỊ TRÍ: backend/src/services/customer/
 * VAI TRÒ:
 *   - Cung cấp tỷ giá quy đổi USD / VND phục vụ tính toán số tiền cho cổng thanh toán PayPal.
 *   - Tự động lấy tỷ giá thời gian thực từ Internet qua Open Exchange Rate API.
 *   - Tích hợp bộ nhớ đệm (In-memory Cache) với TTL (1 giờ) để tối ưu hiệu năng và tránh chạm rate limit.
 *   - Tự động Fallback về giá trị cấu hình trong file .env khi gặp sự cố mạng hoặc vượt quá timeout.
 * =========================================================================================
 */

export interface ExchangeRateResult {
  rate: number;
  source: 'API' | 'CACHE' | 'FALLBACK_ENV';
  timestamp: string;
}

let cachedRate: number | null = null;
let lastFetchedAt: number = 0;

/**
 * Xóa cache tỷ giá (phục vụ unit test / reset)
 */
export function clearExchangeRateCache(): void {
  cachedRate = null;
  lastFetchedAt = 0;
}

/**
 * Lấy tỷ giá VND / USD (1 USD = ? VND)
 */
export async function getVndToUsdRate(): Promise<ExchangeRateResult> {
  const fallbackRate = Number(process.env.PAYPAL_EXCHANGE_RATE_VND_TO_USD) || 25400;
  const apiUrl = process.env.EXCHANGE_RATE_API_URL || 'https://open.er-api.com/v6/latest/USD';
  const timeoutMs = Number(process.env.EXCHANGE_RATE_FETCH_TIMEOUT_MS) || 2000;
  const cacheTtlMs = Number(process.env.EXCHANGE_RATE_CACHE_TTL_MS) || 3600000; // 1 hour

  const now = Date.now();

  // 1. Kiểm tra cache hợp lệ
  if (cachedRate && now - lastFetchedAt < cacheTtlMs) {
    return {
      rate: cachedRate,
      source: 'CACHE',
      timestamp: new Date(lastFetchedAt).toISOString(),
    };
  }

  // 2. Thử fetch từ Internet với timeout
  try {
    const response = await fetch(apiUrl, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error status ${response.status}`);
    }

    const data: any = await response.json();
    const fetchedRate = Number(data?.rates?.VND || data?.rates?.vnd);

    if (!fetchedRate || isNaN(fetchedRate) || fetchedRate <= 0) {
      throw new Error('Invalid VND rate in API response');
    }

    cachedRate = fetchedRate;
    lastFetchedAt = now;

    return {
      rate: fetchedRate,
      source: 'API',
      timestamp: new Date(now).toISOString(),
    };
  } catch (error) {
    // 3. Fallback an toàn về biến môi trường khi timeout hoặc mất mạng
    console.warn(
      `[ExchangeRateService] Không thể lấy tỷ giá từ Internet (${(error as Error).message}). Fallback về tỷ giá ENV (${fallbackRate} VND/USD).`
    );

    return {
      rate: fallbackRate,
      source: 'FALLBACK_ENV',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Quy đổi số tiền từ VND sang USD (làm tròn 2 chữ số thập phân)
 */
export async function convertVndToUsd(amountVnd: number): Promise<{
  amountVnd: number;
  amountUsd: number;
  exchangeRate: number;
  rateSource: 'API' | 'CACHE' | 'FALLBACK_ENV';
}> {
  const { rate, source } = await getVndToUsdRate();
  const amountUsd = Number((amountVnd / rate).toFixed(2));

  return {
    amountVnd,
    amountUsd: Math.max(0.01, amountUsd),
    exchangeRate: rate,
    rateSource: source,
  };
}
