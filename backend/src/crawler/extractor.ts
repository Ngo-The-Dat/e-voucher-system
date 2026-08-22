/**
 * @file extractor.ts
 * @description Trích xuất dữ liệu voucher, thương hiệu, chi nhánh, hình ảnh, điều khoản từ HTML của website Hotdeal.
 */

import type { RawScrapedVoucher } from './types.js';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/**
 * Gửi HTTP GET request lấy toàn bộ nội dung HTML của trang web với cơ chế retry và timeout
 */
export async function fetchHtml(url: string, maxRetries: number = 2): Promise<string> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Lỗi tải trang ${url}: HTTP ${response.status} ${response.statusText}`);
      }

      return await response.text();
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }
  throw lastError;
}

/**
 * Giải mã các HTML entities phổ biến
 */
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&aacute;/g, 'á')
    .replace(/&agrave;/g, 'à')
    .replace(/&atilde;/g, 'ã')
    .replace(/&acirc;/g, 'â')
    .replace(/&eacute;/g, 'é')
    .replace(/&egrave;/g, 'è')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&iacute;/g, 'í')
    .replace(/&igrave;/g, 'ì')
    .replace(/&oacute;/g, 'ó')
    .replace(/&ograve;/g, 'ò')
    .replace(/&otilde;/g, 'õ')
    .replace(/&ocirc;/g, 'ô')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ugrave;/g, 'ù')
    .replace(/&yacute;/g, 'ý')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Agrave;/g, 'À')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Egrave;/g, 'È')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Ograve;/g, 'Ò')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&Ugrave;/g, 'Ù')
    .replace(/&Yacute;/g, 'Ý')
    .replace(/&ndash;/g, '-')
    .replace(/&hellip;/g, '...')
    .trim();
}

/**
 * Cào danh sách voucher trên một trang danh mục
 */
export async function scrapeListingCategory(
  categorySlug: string,
  categoryId: number,
  categoryName: string,
  maxItems: number = 5
): Promise<RawScrapedVoucher[]> {
  const url = `https://www.hotdeal.vn/ho-chi-minh/${categorySlug}/`;
  console.log(`[Crawler] Đang tải danh mục: ${categoryName} (${url})...`);
  const html = await fetchHtml(url);

  const vouchers: RawScrapedVoucher[] = [];

  // Tìm tất cả các khối product
  const productBlockRegex = /<div class="[^"]*product product-kind-1[^"]*"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;
  let match: RegExpExecArray | null;

  while ((match = productBlockRegex.exec(html)) !== null && vouchers.length < maxItems) {
    const block = match[0];

    // Trích xuất tiêu đề
    const titleMatch = /<a[^>]*itemprop="name"[^>]*>([\s\S]*?)<\/a>/i.exec(block) ||
                       /<h3 class="product__title">[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i.exec(block);
    if (!titleMatch) continue;
    const title = decodeHtmlEntities(titleMatch[1].replace(/<[^>]+>/g, '').trim());

    // Trích xuất link chi tiết
    const urlMatch = /<a[^>]*href="([^"]+)"[^>]*itemprop="name"/i.exec(block) ||
                     /<h3 class="product__title">[\s\S]*?<a[^>]*href="([^"]+)"/i.exec(block) ||
                     /data-url="([^"]+)"/i.exec(block);
    if (!urlMatch) continue;
    let detailUrl = urlMatch[1].trim();
    if (!detailUrl.startsWith('http')) {
      detailUrl = detailUrl.startsWith('/') ? `https://www.hotdeal.vn${detailUrl}` : `https://www.hotdeal.vn/${detailUrl}`;
    }

    // Trích xuất ảnh chính
    const imgMatch = /data-original="([^"]+)"/i.exec(block) ||
                     /data-src-mobile="([^"]+)"/i.exec(block) ||
                     /<img[^>]*itemprop="image"[^>]*src="([^"]+)"/i.exec(block);
    let primaryImage = imgMatch ? imgMatch[1].trim() : '';
    if (primaryImage.includes('280x280') || primaryImage.includes('210x210')) {
      primaryImage = primaryImage.replace(/\/(280x280|210x210)\//, '/800x800/');
    }

    // Trích xuất giá khuyến mãi (sale price)
    const salePriceMatch = /class="price__value"[^>]*itemprop="price"[^>]*>([\d,\.]+)/i.exec(block) ||
                           /itemprop="price"[^>]*>([\d,\.]+)/i.exec(block);
    const salePriceRaw = salePriceMatch ? salePriceMatch[1].trim() : '0';

    // Trích xuất giá gốc (original price)
    const originalPriceMatch = /class="price price--list-price"[\s\S]*?class="price__value">([\d,\.]+)/i.exec(block) ||
                              /class="product__price--list-price[^"]*"[\s\S]*?class="price__value">([\d,\.]+)/i.exec(block);
    const originalPriceRaw = originalPriceMatch ? originalPriceMatch[1].trim() : salePriceRaw;

    vouchers.push({
      sourceUrl: url,
      categorySlug,
      categoryName,
      categoryId,
      title,
      originalPriceRaw,
      salePriceRaw,
      primaryImage,
      detailUrl,
    });
  }

  console.log(`[Crawler] Đã tìm thấy ${vouchers.length} voucher trong danh mục: ${categoryName}`);
  return vouchers;
}

/**
 * Cào chi tiết một voucher: Điều kiện sử dụng, Bài viết chi tiết, Chi nhánh & Hotline
 */
export async function scrapeVoucherDetail(voucher: RawScrapedVoucher): Promise<RawScrapedVoucher> {
  console.log(`[Crawler] Đang tải chi tiết voucher: "${voucher.title.substring(0, 40)}..." (${voucher.detailUrl})`);
  try {
    const html = await fetchHtml(voucher.detailUrl);

    // 1. Trích xuất Tab Điều kiện sử dụng (#dieu-kien)
    const conditionsMatch = /<div class="tab-pane[^"]*" id="dieu-kien">([\s\S]*?)<\/div>\s*<\/div>/i.exec(html) ||
                            /<h3 class="block__title">Điều kiện sử dụng<\/h3>[\s\S]*?<div class="wysiwyg">([\s\S]*?)<\/div>/i.exec(html);
    const conditionsHtml = conditionsMatch ? conditionsMatch[0] : '';
    voucher.conditionsHtml = conditionsHtml;

    // Trích xuất thời hạn sử dụng
    const dateRangeMatch = /Thời hạn sử dụng voucher:[^<]*?từ\s*([\d\/\.\-]+)\s*đến\s*([\d\/\.\-]+)/i.exec(conditionsHtml);
    if (dateRangeMatch) {
      voucher.useStartAtRaw = dateRangeMatch[1].trim();
      voucher.useEndAtRaw = dateRangeMatch[2].trim();
    }

    // Trích xuất địa điểm sử dụng & Hotline
    const locationMatch = /Địa điểm sử dụng voucher:[\s\S]*?<strong>([\s\S]*?)<\/strong>\s*–\s*([^<]+)/i.exec(conditionsHtml) ||
                          /Địa điểm sử dụng[^:]*:[\s\S]*?<strong>([^<]+)<\/strong>(?:[^<]*?–\s*([^<]+))?/i.exec(conditionsHtml) ||
                          /Địa điểm sử dụng voucher:[^<]*?([^<\n]+)/i.exec(conditionsHtml);

    if (locationMatch) {
      voucher.partnerNameRaw = decodeHtmlEntities(locationMatch[1].replace(/<[^>]+>/g, '').trim());
      voucher.addressRaw = decodeHtmlEntities((locationMatch[2] || locationMatch[1]).replace(/<[^>]+>/g, '').trim());
    }

    const hotlineMatch = /(?:Hotline|ĐT|Điện thoại|Hotline hỗ trợ):?\s*([\d\s\-\.\/]+)/i.exec(conditionsHtml);
    if (hotlineMatch) {
      voucher.phoneRaw = hotlineMatch[1].trim();
    }

    // 2. Trích xuất Tab Thông tin chi tiết & Điểm nổi bật (#chi-tiet, #diem-noi-bat)
    const detailsMatch = /<div class="tab-pane[^"]*" id="chi-tiet">([\s\S]*?)<\/div>\s*<\/div>/i.exec(html) ||
                         /<h3 class="block__title">Thông tin chi tiết<\/h3>[\s\S]*?<div class="wysiwyg">([\s\S]*?)<\/div>/i.exec(html);
    voucher.detailsHtml = detailsMatch ? detailsMatch[0] : '';

    // 3. Trích xuất danh sách ảnh gallery từ body bài viết
    const galleryImages: string[] = [];
    const imgRegex = /data-original="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi;
    let imgMatch: RegExpExecArray | null;
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      const src = imgMatch[1].trim();
      if (src && !src.includes('membership') && !src.includes('icon') && !galleryImages.includes(src)) {
        galleryImages.push(src);
      }
    }
    voucher.galleryImages = galleryImages.slice(0, 5); // Lấy tối đa 5 ảnh gallery đẹp nhất
  } catch (err: unknown) {
    console.warn(`[Crawler Warning] Không thể cào chi tiết voucher ${voucher.detailUrl}:`, err);
  }

  return voucher;
}
