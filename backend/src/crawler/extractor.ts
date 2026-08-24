/**
 * @file extractor.ts
 * @description Trích xuất dữ liệu voucher, thương hiệu, chi nhánh, hình ảnh, điều khoản từ HTML của website Hotdeal.
 */

import type { RawScrapedVoucher, ScrapedCategory, RawScrapedReview } from './types.js';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/**
 * Gửi HTTP GET request lấy toàn bộ nội dung HTML của trang web với cơ chế retry và timeout
 */
export async function fetchHtml(url: string, maxRetries: number = 3): Promise<string> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

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
        await new Promise((r) => setTimeout(r, 1200 * attempt));
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
    .replace(/&Acirc;/g, 'Â')
    .replace(/&Atilde;/g, 'Ã')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Egrave;/g, 'È')
    .replace(/&Ecirc;/g, 'Ê')
    .replace(/&Igrave;/g, 'Ì')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Ograve;/g, 'Ò')
    .replace(/&Ocirc;/g, 'Ô')
    .replace(/&Otilde;/g, 'Õ')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&Ugrave;/g, 'Ù')
    .replace(/&Yacute;/g, 'Ý')
    .replace(/&ndash;/g, '-')
    .replace(/&hellip;/g, '...')
    .trim();
}

/**
 * Chuẩn hóa tên danh mục về dạng Title Case và loại bỏ ký tự rác
 */
export function cleanCategoryName(rawName: string): string {
  let name = decodeHtmlEntities(rawName)
    .replace(/<[^>]+>/g, '')
    .replace(/[•\-\.\|\/]+$/, '')
    .trim();

  // Chuyển toàn bộ chữ HOA thành Title Case (ví dụ: CHĂM SÓC TÓC -> Chăm Sóc Tóc)
  if (name === name.toUpperCase() && name.length > 3) {
    name = name
      .toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return name;
}

const INVALID_CATEGORY_SLUG_PREFIXES = [
  'deal-', 'giai-nhiet', 'tet-', 'mua-he', 'sieu-sale', 'flash-sale', 'top-deal', 'khuyen-mai'
];

const EXCLUDED_SLUGS = new Set([
  'ho-chi-minh', 'ha-noi', 'tai-khoan', 'gio-hang', 'don-hang', 'chinh-sach',
  'lien-he', 'tin-tuc', 'huong-dan', 'quy-dinh', 'dieu-khoan', 'tuyen-dung',
  'gioi-thieu', 'tin-tuc-su-kien', 've-chung-toi', 'trang-chu'
]);

/**
 * Danh mục chuẩn chính thức của Hotdeal (Khớp 100% dropdown chuẩn, không cào rác)
 */
export const HOTDEAL_STANDARD_CATEGORIES: Array<{ slug: string; name: string }> = [
  { slug: 'buffet-am-thuc', name: 'Buffet' },
  { slug: 'spa-lam-dep', name: 'Spa & Làm đẹp' },
  { slug: 'massage-body-massage-foot', name: 'Massage body/ massage foot' },
  { slug: 'nha-khoa', name: 'Nha khoa' },
  { slug: 'hair-salon-va-cham-soc-toc', name: 'Chăm Sóc Tóc' },
  { slug: 'hotel-resort', name: 'Hotel & Resort' },
  { slug: 'du-lich', name: 'Du Lịch' },
  { slug: 'khu-vui-choi', name: 'Giải trí & Thể thao' },
  { slug: 'dao-tao-vn', name: 'Đào tạo' },
];

/**
 * Lấy danh sách danh mục chuẩn của Hotdeal
 */
export async function scrapeHotdealCategories(): Promise<ScrapedCategory[]> {
  console.log('[Crawler Hotdeal] Khởi tạo danh sách danh mục chuẩn chính thức từ Hotdeal...');
  const categories: ScrapedCategory[] = HOTDEAL_STANDARD_CATEGORIES.map((cat) => ({
    slug: cat.slug,
    name: cat.name,
    description: `Voucher ưu đãi ngành hàng ${cat.name}`,
    sourcePlatform: 'HOTDEAL',
    url: `https://www.hotdeal.vn/ho-chi-minh/${cat.slug}/`,
  }));

  console.log(`[Crawler Hotdeal] Đã sẵn sàng ${categories.length} danh mục chuẩn chính thức.`);
  return categories;
}

/**
 * Danh mục chuẩn chính thức của Dealtoday
 */
export const DEALTODAY_STANDARD_CATEGORIES: Array<{ slug: string; name: string }> = [
  { slug: 'am-thuc', name: 'Ẩm thực' },
  { slug: 'spa-lam-dep', name: 'Spa & Làm đẹp' },
  { slug: 'du-lich-khach-san', name: 'Hotel & Resort' },
  { slug: 'giai-tri-ve-vui-choi', name: 'Giải trí & Thể thao' },
  { slug: 'suc-khoe-the-thao', name: 'Sức Khỏe & Thể Thao' },
  { slug: 'khoa-hoc-dao-tao', name: 'Đào tạo' },
];

/**
 * Lấy danh sách danh mục chuẩn của Dealtoday
 */
export async function scrapeDealtodayCategories(): Promise<ScrapedCategory[]> {
  console.log('[Crawler Dealtoday] Khởi tạo danh sách danh mục chuẩn chính thức từ Dealtoday...');
  const categories: ScrapedCategory[] = DEALTODAY_STANDARD_CATEGORIES.map((cat) => ({
    slug: cat.slug,
    name: cat.name,
    description: `Voucher ưu đãi ngành hàng ${cat.name}`,
    sourcePlatform: 'DEALTODAY',
    url: `https://www.dealtoday.vn/${cat.slug}`,
  }));

  console.log(`[Crawler Dealtoday] Đã sẵn sàng ${categories.length} danh mục chuẩn chính thức.`);
  return categories;
}

/**
 * Cào danh sách voucher trên một trang danh mục Hotdeal (Hỗ trợ phân trang nhiều trang & Chế độ không giới hạn)
 */
export async function scrapeHotdealCategory(
  categorySlug: string,
  categoryId: number = 0,
  categoryName: string = '',
  maxItems: number = 5
): Promise<RawScrapedVoucher[]> {
  const vouchers: RawScrapedVoucher[] = [];
  const seenUrls = new Set<string>();
  let page = 1;
  const isUnlimited = maxItems <= 0 || maxItems === Infinity;
  const maxPages = isUnlimited ? 9999 : Math.ceil(maxItems / 10) + 1;

  while ((isUnlimited || vouchers.length < maxItems) && page <= maxPages) {
    const pageUrl = page === 1
      ? `https://www.hotdeal.vn/ho-chi-minh/${categorySlug}/`
      : `https://www.hotdeal.vn/ho-chi-minh/${categorySlug}/?page=${page}`;

    console.log(`[Crawler Hotdeal] Đang tải: ${categoryName || categorySlug} (Trang ${page})...`);
    let html = '';
    try {
      html = await fetchHtml(pageUrl);
    } catch (err) {
      break;
    }

    const productBlockRegex = /<div class="[^"]*product\b[^"]*"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;
    let match: RegExpExecArray | null;
    let foundInPage = 0;

    while ((match = productBlockRegex.exec(html)) !== null && (isUnlimited || vouchers.length < maxItems)) {
      const block = match[0];

      // Trích xuất tiêu đề
      const titleMatch = /<a[^>]*itemprop="name"[^>]*>([\s\S]*?)<\/a>/i.exec(block) ||
                         /<h3[^>]*class="[^"]*product__title[^"]*"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i.exec(block) ||
                         /<h3[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i.exec(block) ||
                         /<a[^>]*title="([^"]+)"/i.exec(block);
      if (!titleMatch) continue;
      const title = decodeHtmlEntities((titleMatch[1] || titleMatch[2] || '').replace(/<[^>]+>/g, '').trim());
      if (!title || title.length < 3) continue;

      // Trích xuất link chi tiết
      const urlMatch = /<a[^>]*href="([^"]+)"[^>]*itemprop="name"/i.exec(block) ||
                       /<h3[^>]*class="[^"]*product__title[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"/i.exec(block) ||
                       /<a[^>]*class="[^"]*(?:product__image|product__title|image)[^"]*"[^>]*href="([^"]+)"/i.exec(block) ||
                       /data-url="([^"]+)"/i.exec(block) ||
                       /<a[^>]*href="([^"]+\.html)"/i.exec(block);
      if (!urlMatch) continue;
      let detailUrl = urlMatch[1].trim();
      if (!detailUrl.startsWith('http')) {
        detailUrl = detailUrl.startsWith('/') ? `https://www.hotdeal.vn${detailUrl}` : `https://www.hotdeal.vn/${detailUrl}`;
      }

      if (seenUrls.has(detailUrl)) continue;
      seenUrls.add(detailUrl);

      // Trích xuất ảnh chính
      const imgMatch = /data-original="([^"]+)"/i.exec(block) ||
                       /data-src-mobile="([^"]+)"/i.exec(block) ||
                       /<img[^>]*itemprop="image"[^>]*src="([^"]+)"/i.exec(block);
      let primaryImage = imgMatch ? imgMatch[1].trim() : '';
      if (primaryImage.includes('280x280') || primaryImage.includes('210x210')) {
        primaryImage = primaryImage.replace(/\/(280x280|210x210)\//, '/500x500/');
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
        sourcePlatform: 'HOTDEAL',
        sourceUrl: pageUrl,
        categorySlug,
        categoryName,
        categoryId,
        title,
        originalPriceRaw,
        salePriceRaw,
        primaryImage,
        detailUrl,
      });
      foundInPage++;
    }

    if (foundInPage === 0) {
      break;
    }
    page++;
  }

  console.log(`[Crawler Hotdeal] Đã tìm thấy ${vouchers.length} voucher trong danh mục: ${categoryName}`);
  return vouchers;
}

/**
 * Cào danh sách voucher trên một trang danh mục Dealtoday (Hỗ trợ phân trang nhiều trang & Chế độ không giới hạn)
 */
export async function scrapeDealtodayCategory(
  categorySlug: string,
  categoryId: number = 0,
  categoryName: string = '',
  maxItems: number = 5
): Promise<RawScrapedVoucher[]> {
  const vouchers: RawScrapedVoucher[] = [];
  const seenUrls = new Set<string>();
  let page = 1;
  const isUnlimited = maxItems <= 0 || maxItems === Infinity;
  const maxPages = isUnlimited ? 9999 : Math.ceil(maxItems / 10) + 1;

  while ((isUnlimited || vouchers.length < maxItems) && page <= maxPages) {
    const pageUrl = page === 1
      ? `https://www.dealtoday.vn/${categorySlug}`
      : `https://www.dealtoday.vn/${categorySlug}?page=${page}`;

    console.log(`[Crawler Dealtoday] Đang tải: ${categoryName || categorySlug} (Trang ${page})...`);
    let html = '';
    try {
      html = await fetchHtml(pageUrl);
    } catch (err) {
      break;
    }

    const dealCardRegex = /<div class="[^"]*(?:deal-item|item-deal|product-item|card-deal)[^"]*"[\s\S]*?<\/div>\s*<\/div>/g;
    let match: RegExpExecArray | null;
    let foundInPage = 0;

    while ((match = dealCardRegex.exec(html)) !== null && (isUnlimited || vouchers.length < maxItems)) {
      const block = match[0];

      const titleMatch = /<a[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/a>/i.exec(block) ||
                         /<h3[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i.exec(block) ||
                         /<a[^>]*title="([^"]+)"/i.exec(block);
      if (!titleMatch) continue;
      const title = decodeHtmlEntities(titleMatch[1].replace(/<[^>]+>/g, '').trim());

      const urlMatch = /<a[^>]*href="([^"]+)"/i.exec(block);
      if (!urlMatch) continue;
      let detailUrl = urlMatch[1].trim();
      if (!detailUrl.startsWith('http')) {
        detailUrl = detailUrl.startsWith('/') ? `https://www.dealtoday.vn${detailUrl}` : `https://www.dealtoday.vn/${detailUrl}`;
      }

      if (seenUrls.has(detailUrl)) continue;
      seenUrls.add(detailUrl);

      const imgMatch = /data-src="([^"]+)"/i.exec(block) ||
                       /src="([^"]+)"/i.exec(block);
      const primaryImage = imgMatch ? imgMatch[1].trim() : '';

      const salePriceMatch = /class="[^"]*(?:price-sale|price-current|price)[^"]*"[^>]*>([\d,\.]+)/i.exec(block);
      const salePriceRaw = salePriceMatch ? salePriceMatch[1].trim() : '0';

      const originalPriceMatch = /class="[^"]*(?:price-old|price-original|list-price)[^"]*"[^>]*>([\d,\.]+)/i.exec(block);
      const originalPriceRaw = originalPriceMatch ? originalPriceMatch[1].trim() : salePriceRaw;

      vouchers.push({
        sourcePlatform: 'DEALTODAY',
        sourceUrl: pageUrl,
        categorySlug,
        categoryName,
        categoryId,
        title,
        originalPriceRaw,
        salePriceRaw,
        primaryImage,
        detailUrl,
      });
      foundInPage++;
    }

    if (foundInPage === 0) {
      break;
    }
    page++;
  }

  console.log(`[Crawler Dealtoday] Đã tìm thấy ${vouchers.length} voucher trong danh mục: ${categoryName}`);
  return vouchers;
}

/**
 * Cào danh sách voucher trên một trang danh mục tổng hợp (Hỗ trợ đa nguồn)
 */
export async function scrapeListingCategory(
  categorySlug: string,
  categoryId: number,
  categoryName: string,
  maxItems: number = 5,
  source: 'HOTDEAL' | 'DEALTODAY' = 'HOTDEAL'
): Promise<RawScrapedVoucher[]> {
  if (source === 'DEALTODAY') {
    return scrapeDealtodayCategory(categorySlug, categoryId, categoryName, maxItems);
  }
  return scrapeHotdealCategory(categorySlug, categoryId, categoryName, maxItems);
}

/**
 * Cào chi tiết một voucher: Điều kiện sử dụng, Bài viết chi tiết, Chi nhánh & Hotline
 */
export async function scrapeVoucherDetail(voucher: RawScrapedVoucher): Promise<RawScrapedVoucher> {
  console.log(`[Crawler ${voucher.sourcePlatform || 'Hotdeal'}] Đang tải chi tiết: "${voucher.title.substring(0, 40)}..." (${voucher.detailUrl})`);
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

    // Trích xuất Hotline chung
    const hotlineMatch = /(?:Hotline|ĐT|Điện thoại|Hotline hỗ trợ):?\s*([\d\s\-\.\/]+)/i.exec(conditionsHtml);
    if (hotlineMatch) {
      voucher.phoneRaw = hotlineMatch[1].trim();
    }

    // 2. Trích xuất Tab Thông tin chi tiết & Điểm nổi bật (#chi-tiet, #diem-noi-bat)
    const detailsMatch = /<div class="tab-pane[^"]*" id="chi-tiet">([\s\S]*?)<\/div>\s*<\/div>/i.exec(html) ||
                         /<h3 class="block__title">Thông tin chi tiết<\/h3>[\s\S]*?<div class="wysiwyg">([\s\S]*?)<\/div>/i.exec(html);
    const detailsHtml = detailsMatch ? detailsMatch[0] : '';
    voucher.detailsHtml = detailsHtml;

    // 3. Trích xuất danh sách tất cả các chi nhánh thực tế từ nội dung cào được
    const { partnerName, branches } = extractBranchesFromHtml(conditionsHtml, detailsHtml, voucher.phoneRaw);
    if (partnerName) {
      voucher.partnerNameRaw = partnerName;
    }
    if (branches.length > 0) {
      voucher.branchesRaw = branches;
      voucher.addressRaw = branches[0].address;
      voucher.branchNameRaw = branches[0].branchName;
      if (branches[0].phone) {
        voucher.phoneRaw = branches[0].phone;
      }
    }

    // 4. Trích xuất danh sách ảnh gallery từ body bài viết
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

    // 5. Trích xuất bình luận và đánh giá từ khách hàng nếu có trên trang
    const reviews: RawScrapedReview[] = [];
    const commentBlockRegex = /<div class="[^"]*(?:comment-item|review-item|item-comment|cmt-item|item-review)[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi;
    let cmtMatch: RegExpExecArray | null;
    while ((cmtMatch = commentBlockRegex.exec(html)) !== null && reviews.length < 5) {
      const cBlock = cmtMatch[0];
      const authorMatch = /<span class="[^"]*(?:author|username|name|cmt-name)[^"]*"[^>]*>([\s\S]*?)<\/span>/i.exec(cBlock) ||
                          /<strong[^>]*>([\s\S]*?)<\/strong>/i.exec(cBlock);
      const authorName = authorMatch ? decodeHtmlEntities(authorMatch[1].replace(/<[^>]+>/g, '').trim()) : undefined;

      const bodyMatch = /<div class="[^"]*(?:comment-content|review-content|content|cmt-body)[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(cBlock) ||
                        /<p[^>]*class="[^"]*(?:text|content)[^"]*"[^>]*>([\s\S]*?)<\/p>/i.exec(cBlock);
      const content = bodyMatch ? decodeHtmlEntities(bodyMatch[1].replace(/<[^>]+>/g, '').trim()) : '';

      if (content && content.length > 5) {
        reviews.push({
          authorName,
          content,
          rating: 5,
        });
      }
    }
    voucher.reviewsRaw = reviews;
  } catch (err: unknown) {
    console.warn(`[Crawler Warning] Không thể cào chi tiết voucher ${voucher.detailUrl}:`, err);
  }

  return voucher;
}

/**
 * Trích xuất danh sách toàn bộ các chi nhánh thực tế từ nội dung điều kiện sử dụng hoặc thông tin chi tiết
 */
export function extractBranchesFromHtml(
  conditionsHtml: string,
  detailsHtml: string,
  defaultPhone?: string
): {
  partnerName?: string;
  branches: Array<{ branchName: string; address: string; phone?: string }>;
} {
  const branches: Array<{ branchName: string; address: string; phone?: string }> = [];
  let partnerName: string | undefined;

  const cleanText = (str: string) => decodeHtmlEntities(str.replace(/<[^>]+>/g, '').trim());

  // 1. Kiểm tra danh sách chi nhánh đa điểm (multi-branches)
  const rawLines = conditionsHtml
    .replace(/<\/(p|div|li|tr|h\d)>/gi, '\n')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .split('\n')
    .map((l) => cleanText(l))
    .filter((l) => l.length > 0);

  for (const line of rawLines) {
    const branchLineMatch = /^(?:&middot;|\+|\d+[\.\)]|\•|\-)?\s*(Chi nhánh\s*\d*[^:\-–—]*|CN\s*[^:\-–—]*|Cơ sở\s*\d*[^:\-–—]*|Địa chỉ\s*\d*[^:\-–—]*):\s*(.+)$/i.exec(line);
    if (branchLineMatch) {
      let bName = branchLineMatch[1].trim();
      let rest = branchLineMatch[2].trim();
      let bPhone = defaultPhone;

      // Tìm hotline / sđt riêng của chi nhánh nếu có
      const phoneMatch = /(?:Hotline|ĐT|Điện thoại|Tel|SĐT|Liên hệ):?\s*([\d\s\.\-\/]+)/i.exec(rest);
      if (phoneMatch) {
        bPhone = phoneMatch[1].trim();
        rest = rest.replace(phoneMatch[0], '').replace(/[-—–\.\,\s]+$/, '').trim();
      }

      // Tách tên chi nhánh chi tiết nếu có dạng "Tên CN - Địa chỉ"
      if (rest.includes(' - ') || rest.includes(' – ') || rest.includes(' — ')) {
        const parts = rest.split(/\s*[-—–]\s*/);
        if (parts.length >= 2 && parts[0].length < 60 && parts[1].length > 5) {
          bName = `${bName} (${parts[0].trim()})`;
          rest = parts.slice(1).join(', ').trim();
        }
      }

      if (rest.length >= 5 && !rest.toLowerCase().includes('áp dụng cho') && !rest.toLowerCase().includes('thời hạn')) {
        branches.push({
          branchName: bName,
          address: rest,
          phone: bPhone,
        });
      }
    }
  }

  // 2. Nếu không tìm thấy danh sách đa chi nhánh, trích xuất địa điểm từ dòng "Địa điểm sử dụng voucher:"
  if (branches.length === 0) {
    const locMatch = /Địa điểm sử dụng voucher:[\s\S]*?<strong>([\s\S]*?)<\/strong>\s*[-–—]\s*([^<\n]+)/i.exec(conditionsHtml) ||
                     /Địa điểm sử dụng[^:]*:[\s\S]*?<strong>([^<]+)<\/strong>(?:[\s\S]*?[-–—]\s*([^<\n]+))?/i.exec(conditionsHtml) ||
                     /Địa điểm sử dụng voucher:\s*([^<\n]+)/i.exec(conditionsHtml) ||
                     /Địa điểm áp dụng:\s*([^<\n]+)/i.exec(conditionsHtml);

    if (locMatch) {
      const part1 = cleanText(locMatch[1] || '');
      const part2 = locMatch[2] ? cleanText(locMatch[2]) : '';

      if (part2 && part2.length >= 8 && !part2.toLowerCase().includes('áp dụng cho')) {
        if (!part1.toLowerCase().includes('áp dụng cho') && part1.length < 80) {
          partnerName = part1;
        }
        branches.push({
          branchName: `${part1 || 'Chi Nhánh'} - Chi Nhánh Trung Tâm`,
          address: part2,
          phone: defaultPhone,
        });
      } else if (part1 && part1.length >= 8 && !part1.toLowerCase().includes('áp dụng cho')) {
        // Kiểm tra xem part1 có chứa "Tên - Địa chỉ" không
        if (part1.includes(' - ') || part1.includes(' – ') || part1.includes(' — ')) {
          const parts = part1.split(/\s*[-—–]\s*/);
          const pName = parts[0].trim();
          const addr = parts.slice(1).join(', ').trim();
          if (pName.length < 80) {
            partnerName = pName;
          }
          branches.push({
            branchName: `${pName} - Chi Nhánh Trung Tâm`,
            address: addr.length >= 8 ? addr : part1,
            phone: defaultPhone,
          });
        } else {
          branches.push({
            branchName: `Chi Nhánh Trung Tâm`,
            address: part1,
            phone: defaultPhone,
          });
        }
      }
    }
  }

  // 3. Fallback: Nếu vẫn chưa có địa chỉ, tìm từ chi-tiet (detailsHtml)
  if (branches.length === 0) {
    const addrInDetails = /(?:Địa chỉ|Địa điểm|Location):?\s*<strong>([^<]+)<\/strong>/i.exec(detailsHtml) ||
                          /(?:Địa chỉ|Địa điểm|Location):?\s*([^\n<]+)/i.exec(detailsHtml);
    if (addrInDetails) {
      const addr = cleanText(addrInDetails[1]);
      if (addr.length >= 8 && !addr.toLowerCase().includes('áp dụng cho')) {
        branches.push({
          branchName: `Chi Nhánh Trung Tâm`,
          address: addr,
          phone: defaultPhone,
        });
      }
    }
  }

  return { partnerName, branches };
}
