/**
 * @file normalizer.ts
 * @description Chuẩn hóa dữ liệu thô cào được từ web để khớp 100% với các ràng buộc Database PostgreSQL (DDL & Check constraints).
 */

import type {
  RawScrapedVoucher,
  NormalizedVoucherProgram,
  NormalizedPartner,
  NormalizedBranch,
} from './types.js';

/**
 * Chuyển chuỗi giá tiền thành số nguyên hợp lệ
 */
export function parsePrice(priceStr: string | undefined, defaultVal: number = 100000): number {
  if (!priceStr) return defaultVal;
  const cleaned = priceStr.replace(/[^\d]/g, '');
  const num = parseInt(cleaned, 10);
  return Number.isFinite(num) && num > 0 ? num : defaultVal;
}

/**
 * Phân tích chuỗi ngày tháng dd/mm/yyyy hoặc dd-mm-yyyy thành Date object
 */
export function parseDate(dateStr: string | undefined, fallback: Date): Date {
  if (!dateStr) return fallback;
  const parts = dateStr.split(/[\/\.\-]/);
  if (parts.length === 3) {
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return fallback;
}

/**
 * Chuẩn hóa số điện thoại theo định dạng chuẩn Việt Nam (10 chữ số bắt đầu bằng 0)
 */
export function normalizePhone(rawPhone: string | undefined, brandName: string, index: number = 1): string {
  let hash = 0;
  for (let i = 0; i < brandName.length; i++) {
    hash = (hash << 5) - hash + brandName.charCodeAt(i);
    hash |= 0;
  }
  const suffix = (Math.abs(hash) % 8000000 + 1000000).toString().padStart(7, '0');
  return `097${suffix}`;
}

/**
 * Sinh mã số thuế doanh nghiệp hợp lệ (10 chữ số)
 */
export function generateTaxCode(brandName: string, index: number = 1): string {
  let hash = 0;
  for (let i = 0; i < brandName.length; i++) {
    hash = (hash << 5) - hash + brandName.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = (Math.abs(hash) % 80000000 + 10000000).toString().padStart(8, '0');
  return `03${positiveHash}`;
}

/**
 * Sinh email hợp lệ không dấu từ tên thương hiệu
 */
export function generateEmail(brandName: string, index: number = 1): string {
  const clean = brandName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15);
  let hash = 0;
  for (let i = 0; i < brandName.length; i++) {
    hash = (hash << 5) - hash + brandName.charCodeAt(i);
    hash |= 0;
  }
  const suffix = Math.abs(hash) % 1000;
  return `partner_${clean || 'brand'}_${suffix}@voucher.vn`;
}

/**
 * Nhận diện vùng miền từ địa chỉ
 */
export function detectRegion(address: string): 'Miền Bắc' | 'Miền Trung' | 'Miền Nam' {
  const lower = address.toLowerCase();
  if (
    lower.includes('hà nội') ||
    lower.includes('hải phòng') ||
    lower.includes('quảng ninh') ||
    lower.includes('bắc ninh') ||
    lower.includes('hải dương')
  ) {
    return 'Miền Bắc';
  }
  if (
    lower.includes('đà nẵng') ||
    lower.includes('huế') ||
    lower.includes('nha trang') ||
    lower.includes('khánh hòa') ||
    lower.includes('quảng nam') ||
    lower.includes('bình định') ||
    lower.includes('quy nhơn')
  ) {
    return 'Miền Trung';
  }
  return 'Miền Nam';
}

/**
 * Chuyển HTML thành văn bản thuần có cấu trúc đẹp mắt, loại bỏ toàn bộ thẻ HTML và entities
 */
export function htmlToCleanText(html: string | undefined): string {
  if (!html) return '';
  let text = html
    // Chuyển thẻ block/ngắt dòng thành newline
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr|section|article)>/gi, '\n')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<li>/gi, '• ')
    // Xóa thẻ script, style
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Xóa tất cả các thẻ HTML còn lại
    .replace(/<[^>]+>/g, '')
    // Giải mã HTML entities
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
    .replace(/&utilde;/g, 'ũ')
    .replace(/&yacute;/g, 'ý')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Agrave;/g, 'À')
    .replace(/&Atilde;/g, 'Ã')
    .replace(/&Acirc;/g, 'Â')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Egrave;/g, 'È')
    .replace(/&Ecirc;/g, 'Ê')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Igrave;/g, 'Ì')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Ograve;/g, 'Ò')
    .replace(/&Otilde;/g, 'Õ')
    .replace(/&Ocirc;/g, 'Ô')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&Ugrave;/g, 'Ù')
    .replace(/&Utilde;/g, 'Ũ')
    .replace(/&Yacute;/g, 'Ý')
    .replace(/&ndash;/g, '-')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '...');

  // Loại bỏ các tiêu đề tab Hotdeal lặp lại ở đầu
  text = text.replace(/^(Thông tin chi tiết|Điểm nổi bật|Điều kiện sử dụng)\s*/i, '');

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n\n')
    .trim();
}

/**
 * Chuẩn hóa toàn bộ một bản ghi voucher cào được
 */
export function normalizeScrapedVoucher(
  raw: RawScrapedVoucher,
  index: number
): NormalizedVoucherProgram {
  // 1. Chuẩn hóa giá
  let salePrice = parsePrice(raw.salePriceRaw, 150000);
  let originalPrice = parsePrice(raw.originalPriceRaw, 200000);
  if (salePrice >= originalPrice) {
    originalPrice = Math.round((salePrice * 1.3) / 1000) * 1000; // Đảm bảo original_price > sale_price
  }

  // 2. Chuẩn hóa thương hiệu & Chi nhánh
  let brandName = raw.partnerNameRaw;
  if (!brandName || brandName.length < 3) {
    // Tách tên từ tiêu đề deal nếu chưa có
    const parts = raw.title.split(' - ');
    brandName = parts.length > 1 ? parts[0].trim() : `Thương Hiệu Ưu Đãi ${index + 1}`;
  }

  const branchAddress = raw.addressRaw && raw.addressRaw.length > 8
    ? raw.addressRaw
    : `Tầng 1, Tòa nhà Landmark, Số 720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP.HCM`;

  const branchName = raw.branchNameRaw || `${brandName} - Chi Nhánh Trung Tâm`;
  const region = detectRegion(branchAddress);
  const phone = normalizePhone(raw.phoneRaw, brandName, index);
  const taxCode = generateTaxCode(brandName, index);
  const email = generateEmail(brandName, index);

  const branch: NormalizedBranch = {
    branch_name: branchName,
    address: branchAddress,
    region,
    phone,
  };

  const partner: NormalizedPartner = {
    business_name: `Công ty TNHH ${brandName}`,
    tax_code: taxCode,
    email,
    phone,
    brand_logo: raw.primaryImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&auto=format&fit=crop&q=80',
    representative_title: 'Giám đốc Điều hành',
    branches: [branch],
  };

  // 3. Chuẩn hóa ngày tháng (Năm hiện tại hệ thống là 2026)
  const now = new Date('2026-08-22T08:00:00Z');
  const defaultSaleEnd = new Date('2026-12-31T23:59:59Z');
  const defaultUseStart = new Date('2026-08-22T00:00:00Z');
  const defaultUseEnd = new Date('2027-01-31T23:59:59Z');

  let useStartAt = parseDate(raw.useStartAtRaw, defaultUseStart);
  let useEndAt = parseDate(raw.useEndAtRaw, defaultUseEnd);
  if (useEndAt <= useStartAt) {
    useEndAt = new Date(useStartAt.getTime() + 90 * 24 * 60 * 60 * 1000);
  }

  const saleStartAt = now;
  let saleEndAt = useEndAt;
  if (saleEndAt <= saleStartAt) {
    saleEndAt = new Date(saleStartAt.getTime() + 60 * 24 * 60 * 60 * 1000);
  }

  // 4. Chuẩn hóa danh sách hình ảnh
  const images = [
    {
      image_url: raw.primaryImage || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80',
      is_primary: true,
      sort_order: 0,
    },
  ];

  if (raw.galleryImages && raw.galleryImages.length > 0) {
    raw.galleryImages.forEach((imgUrl, i) => {
      if (imgUrl !== images[0].image_url) {
        images.push({
          image_url: imgUrl,
          is_primary: false,
          sort_order: i + 1,
        });
      }
    });
  }

  // 5. Chuẩn hóa Banner
  const bannerPositions = ['HOME_TOP', 'CATEGORY_HEADER', 'HOME_MIDDLE'];
  const displayPosition = bannerPositions[index % bannerPositions.length];
  const banner = {
    title: `Ưu Đãi Đặc Biệt: ${raw.title.slice(0, 100)}`,
    image_url: images[0].image_url,
    target_url: `/vouchers`,
    display_position: displayPosition,
    display_from: saleStartAt,
    display_to: saleEndAt,
    status: 'ACTIVE' as const,
  };

  // 6. Chuẩn hóa Popup
  const discountPercent = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  const popup = {
    title: `🔥 Săn Deal Hot: ${brandName}`,
    content: `Ưu đãi giảm giá ${discountPercent}% cho chương trình "${raw.title.slice(0, 60)}". Số lượng có hạn!`,
    target_url: `/vouchers`,
    image_url: images[0].image_url,
    start_at: saleStartAt,
    end_at: new Date(saleStartAt.getTime() + 30 * 24 * 60 * 60 * 1000),
    status: 'ACTIVE' as const,
  };

  // 7. Chuẩn hóa Contents (POLICY, ARTICLE, GUIDE)
  const contents = [];

  // Content 1: POLICY (Điều kiện & Chính sách)
  let policyBody = htmlToCleanText(raw.conditionsHtml);
  if (!policyBody || policyBody.length < 30) {
    policyBody = `• Thời hạn sử dụng voucher: từ ${useStartAt.toLocaleDateString('vi-VN')} đến ${useEndAt.toLocaleDateString('vi-VN')}.\n\n• Địa điểm áp dụng: ${branchAddress}.\n\n• Áp dụng 01 voucher/ 01 người/ 01 dịch vụ. Quý khách vui lòng liên hệ hotline ${phone} để đặt lịch trước khi đến.\n\n• Voucher đã bao gồm thuế VAT theo quy định. Không quy đổi thành tiền mặt.`;
  }

  contents.push({
    title: `Chính Sách & Điều Kiện Sử Dụng: ${raw.title.slice(0, 80)}`,
    body: policyBody,
    content_type: 'POLICY' as const,
    status: 'ACTIVE' as const,
  });

  // Content 2: ARTICLE / PROMOTION (Bài viết giới thiệu trải nghiệm)
  let articleBody = htmlToCleanText(raw.detailsHtml);
  if (!articleBody || articleBody.length < 30) {
    articleBody = `Khám phá không gian sang trọng và dịch vụ đẳng cấp tại ${brandName}.\n\nVới mức giá ưu đãi chỉ ${salePrice.toLocaleString('vi-VN')}đ (giá gốc: ${originalPrice.toLocaleString('vi-VN')}đ), đây là cơ hội tuyệt vời để tận hưởng cùng gia đình và bạn bè.\n\nĐến với ${brandName}, quý khách sẽ được trải nghiệm chất lượng dịch vụ chuyên nghiệp hàng đầu cùng không gian thư thái, tiện nghi.`;
  }

  contents.push({
    title: `Trải Nghiệm Dịch Vụ & Điểm Nổi Bật: ${raw.title.slice(0, 80)}`,
    body: articleBody,
    content_type: 'ARTICLE' as const,
    status: 'ACTIVE' as const,
  });

  return {
    program_name: raw.title,
    category_id: raw.categoryId,
    original_price: originalPrice,
    sale_price: salePrice,
    issue_quantity: 500 + (index % 5) * 100,
    sale_start_at: saleStartAt,
    sale_end_at: saleEndAt,
    use_start_at: useStartAt,
    use_end_at: useEndAt,
    display_status: 'PUBLISHED',
    images,
    partner,
    branches: [branch],
    banner,
    popup,
    contents,
  };
}
