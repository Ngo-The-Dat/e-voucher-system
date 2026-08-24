/**
 * @file normalizer.ts
 * @description Chuẩn hóa dữ liệu thô cào được từ web để khớp 100% với các ràng buộc Database PostgreSQL (DDL & Check constraints).
 */

import type {
  RawScrapedVoucher,
  NormalizedVoucherProgram,
  NormalizedPartner,
  NormalizedBranch,
  NormalizedReview,
} from './types.js';

/**
 * Chuyển chuỗi tiếng Việt thành slug không dấu an toàn
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

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
 * Trích xuất và chuẩn hóa tên thương hiệu từ dữ liệu thô cào được hoặc tiêu đề deal
 */
export function extractBrandName(rawPartnerName: string | undefined, title: string, index: number): string {
  let brand = rawPartnerName ? rawPartnerName.trim() : '';

  // Xóa ký tự đầu dòng như gạch đầu dòng, dấu hai chấm, bullet
  brand = brand.replace(/^[\s•\-\:\—\–\.\,]+/, '').trim();

  // Danh sách các từ khóa cho thấy chuỗi này là một câu điều kiện/nội dung chứ không phải tên thương hiệu
  const invalidKeywords = [
    'áp dụng cho',
    'voucher áp dụng',
    'thời hạn sử dụng',
    'thời hạn',
    'điều kiện',
    'quy định',
    'chính sách',
    'hotline',
    'đặt chỗ',
    'thanh toán',
    'không áp dụng',
    'khách hàng',
    'đối với',
    'tham khảo menu',
    'xuất hóa đơn',
    'liên hệ',
  ];

  const isInvalid = !brand ||
    brand.length < 2 ||
    brand.length > 70 ||
    invalidKeywords.some((kw) => brand.toLowerCase().includes(kw));

  if (isInvalid) {
    // Tự động trích xuất tên thương hiệu từ tiêu đề Deal
    const titleClean = title.replace(/^[\s•\-\:\—\–]+/, '').trim();
    if (titleClean.includes(' - ')) {
      brand = titleClean.split(' - ')[0].trim();
    } else if (titleClean.includes(' – ')) {
      brand = titleClean.split(' – ')[0].trim();
    } else if (titleClean.includes(':')) {
      brand = titleClean.split(':')[0].trim();
    } else if (titleClean.includes('|')) {
      brand = titleClean.split('|')[0].trim();
    } else {
      const words = titleClean.split(/\s+/);
      brand = words.slice(0, Math.min(words.length, 4)).join(' ');
    }
  }

  // Dọn dẹp khoảng trắng và ký tự thừa
  brand = brand.replace(/^[\s•\-\:\—\–\.\,]+/, '').replace(/[\s•\-\:\—\–\.\,]+$/, '').trim();

  // Giới hạn tối đa 60 ký tự
  if (brand.length > 60) {
    brand = brand.slice(0, 60).trim();
  }

  return brand || `Thương Hiệu Ưu Đãi ${index + 1}`;
}

/**
 * Chuẩn hóa tên danh mục về các ngành hàng chuẩn chính thức
 */
export function normalizeCategoryName(rawName?: string): string {
  if (!rawName) return 'Ẩm thực';
  const lower = rawName.toLowerCase().trim();

  if (lower.includes('buffet')) return 'Buffet';
  if (lower.includes('nha khoa') || lower.includes('tẩy trắng') || lower.includes('cạo vôi') || lower.includes('trám răng') || lower.includes('răng')) return 'Nha khoa';
  if (lower.includes('massage')) return 'Massage body/ massage foot';
  if (lower.includes('tóc') || lower.includes('salon') || lower.includes('gội đầu')) return 'Chăm Sóc Tóc';
  if (lower.includes('spa') || lower.includes('làm đẹp') || lower.includes('nail') || lower.includes('móng') || lower.includes('chăm sóc da') || lower.includes('chăm sóc cơ thể') || lower.includes('điều trị')) return 'Spa & Làm đẹp';
  if (lower.includes('khách sạn') || lower.includes('resort') || lower.includes('hotel')) return 'Hotel & Resort';
  if (lower.includes('du lịch') || lower.includes('tour')) return 'Du Lịch';
  if (lower.includes('vui chơi') || lower.includes('giải trí') || lower.includes('thể thao') || lower.includes('gym') || lower.includes('yoga')) return 'Giải trí & Thể thao';
  if (lower.includes('đào tạo') || lower.includes('khóa học') || lower.includes('học')) return 'Đào tạo';
  if (lower.includes('sức khỏe') || lower.includes('y tế') || lower.includes('phòng khám') || lower.includes('bệnh viện')) return 'Sức Khỏe & Thể Thao';
  if (lower.includes('ẩm thực') || lower.includes('nhà hàng') || lower.includes('ăn uống') || lower.includes('bánh') || lower.includes('quà tặng')) return 'Ẩm thực';

  return 'Ẩm thực';
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

  // 2. Chuẩn hóa thương hiệu & Chi nhánh từ dữ liệu cào thực tế
  const brandName = extractBrandName(raw.partnerNameRaw, raw.title, index);
  const defaultPhone = normalizePhone(raw.phoneRaw, brandName, index);

  const branches: NormalizedBranch[] = [];

  if (raw.branchesRaw && raw.branchesRaw.length > 0) {
    for (const b of raw.branchesRaw) {
      let bAddress = b.address ? b.address.replace(/^[\s•\-\:\—\–]+/, '').trim() : '';
      if (bAddress.length > 400) {
        bAddress = bAddress.slice(0, 400).trim();
      }

      let bName = b.branchName ? b.branchName.trim() : `${brandName} - Chi Nhánh Trung Tâm`;
      if (!bName.toLowerCase().includes(brandName.toLowerCase()) && bName !== 'Chi Nhánh Trung Tâm') {
        bName = `${brandName} - ${bName}`;
      }
      if (bName.length > 150) {
        bName = bName.slice(0, 150).trim();
      }

      const bPhone = b.phone ? normalizePhone(b.phone, bName, index) : defaultPhone;
      const bRegion = detectRegion(bAddress);

      branches.push({
        branch_name: bName,
        address: bAddress,
        region: bRegion,
        phone: bPhone,
      });
    }
  }

  // Nếu không có branchesRaw thì dùng addressRaw cào được từ trang
  if (branches.length === 0) {
    let rawAddress = raw.addressRaw ? raw.addressRaw.replace(/^[\s•\-\:\—\–]+/, '').trim() : '';
    if (!rawAddress || rawAddress.length < 5) {
      rawAddress = `${brandName}, TP. Hồ Chí Minh`;
    }
    if (rawAddress.length > 400) {
      rawAddress = rawAddress.slice(0, 400).trim();
    }

    let branchName = raw.branchNameRaw ? raw.branchNameRaw.trim() : `${brandName} - Chi Nhánh Trung Tâm`;
    if (branchName.length > 150) {
      branchName = branchName.slice(0, 150).trim();
    }

    const region = detectRegion(rawAddress);
    branches.push({
      branch_name: branchName,
      address: rawAddress,
      region,
      phone: defaultPhone,
    });
  }

  const businessName = brandName.toLowerCase().startsWith('công ty')
    ? brandName.slice(0, 120)
    : `Công ty TNHH ${brandName}`.slice(0, 120);

  const taxCode = generateTaxCode(brandName, index);
  const email = generateEmail(brandName, index);

  const partner: NormalizedPartner = {
    business_name: businessName,
    tax_code: taxCode,
    email,
    phone: defaultPhone,
    brand_logo: raw.primaryImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&auto=format&fit=crop&q=80',
    representative_title: 'Giám đốc Điều hành',
    branches: branches,
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
  const mainAddress = branches.length > 0 ? branches[0].address : `${brandName}, TP. Hồ Chí Minh`;
  const mainPhone = branches.length > 0 ? branches[0].phone : defaultPhone;

  // Content 1: POLICY (Điều kiện & Chính sách)
  let policyBody = htmlToCleanText(raw.conditionsHtml);
  if (!policyBody || policyBody.length < 30) {
    policyBody = `• Thời hạn sử dụng voucher: từ ${useStartAt.toLocaleDateString('vi-VN')} đến ${useEndAt.toLocaleDateString('vi-VN')}.\n\n• Địa điểm áp dụng: ${mainAddress}.\n\n• Áp dụng 01 voucher/ 01 người/ 01 dịch vụ. Quý khách vui lòng liên hệ hotline ${mainPhone} để đặt lịch trước khi đến.\n\n• Voucher đã bao gồm thuế VAT theo quy định. Không quy đổi thành tiền mặt.`;
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

  const cleanCategory = normalizeCategoryName(raw.categoryName);

  // 8. Chuẩn hóa Bình luận & Đánh giá (Reviews & Feedback)
  const reviews: NormalizedReview[] = [];
  const sampleCustomerNames = [
    'Nguyễn Thu Hà', 'Trần Minh Tuấn', 'Lê Hoàng Long', 'Phạm Thanh Thảo',
    'Vũ Đức Anh', 'Đỗ Hải Yến', 'Bùi Gia Huy', 'Hoàng Ngọc Mai',
    'Đặng Tiến Dũng', 'Ngô Phương Linh', 'Trịnh Quốc Bảo', 'Dương Thúy Hằng'
  ];

  if (raw.reviewsRaw && raw.reviewsRaw.length > 0) {
    for (let rIdx = 0; rIdx < raw.reviewsRaw.length; rIdx++) {
      const r = raw.reviewsRaw[rIdx];
      const custName = r.authorName || sampleCustomerNames[(index + rIdx) % sampleCustomerNames.length];
      const custEmail = `cust.${generateSlug(custName)}.${(index + rIdx) % 100}@gmail.com`;
      const submittedAt = new Date(Date.now() - ((rIdx + 1) * 3 + (index % 5)) * 24 * 60 * 60 * 1000);
      reviews.push({
        customer_name: custName,
        customer_email: custEmail,
        rating: r.rating || 5,
        review_content: r.content.slice(0, 500),
        submitted_at: submittedAt,
      });
    }
  } else {
    // Tạo 2-3 đánh giá chân thực dựa trên ngành hàng động của voucher
    const catLower = cleanCategory.toLowerCase();
    let catReviews = [
      `Dịch vụ tại ${brandName} rất tốt và chuyên nghiệp. Đặt mua và quét mã voucher tiện lợi, nhân viên hỗ trợ nhiệt tình.`,
      `Trải nghiệm tuyệt vời tại ${brandName}, chất lượng dịch vụ đúng như mô tả trong chương trình ưu đãi ${cleanCategory}. Rất đáng tiền!`,
      `Đã sử dụng voucher tại ${brandName} và rất hài lòng, sẽ tiếp tục ủng hộ thương hiệu trong các chương trình tới.`
    ];

    if (catLower.includes('buffet') || catLower.includes('ẩm thực') || catLower.includes('ăn') || catLower.includes('nhà hàng') || catLower.includes('quà tặng')) {
      catReviews = [
        `Đồ ăn tại ${brandName} rất tươi ngon, nêm nếm vừa miệng và phục vụ nhiệt tình. Mua voucher tiết kiệm được nhiều.`,
        `Không gian ${brandName} ấm cúng, món ăn trình bày đẹp mắt. Quét mã voucher nhanh chóng, rất hài lòng!`,
        `Đã rủ cả gia đình đi ăn cuối tuần tại ${brandName}. Sẽ tiếp tục ủng hộ thương hiệu trong các chương trình tới!`
      ];
    } else if (catLower.includes('spa') || catLower.includes('làm đẹp') || catLower.includes('da') || catLower.includes('massage') || catLower.includes('tóc') || catLower.includes('nail')) {
      catReviews = [
        `Dịch vụ tại ${brandName} cực kỳ chuyên nghiệp, kỹ thuật viên tay nghề cao và tư vấn tận tâm.`,
        `Không gian thơm mùi tinh dầu rất thư giãn. Dùng voucher được chăm sóc trọn gói chu đáo không phát sinh thêm chi phí.`,
        `Trải nghiệm rất ưng ý tại ${brandName}, phòng ốc sạch sẽ riêng tư. 10/10 điểm!`
      ];
    } else if (catLower.includes('nha khoa') || catLower.includes('răng')) {
      catReviews = [
        `Bác sĩ tại ${brandName} thao tác nhẹ nhàng, êm ái không hề bị ê buốt. Phòng khám vô trùng tuyệt đối.`,
        `Dịch vụ tại ${brandName} rất sạch sẽ, tư vấn nhiệt tình và không phụ thu thêm phí gì.`,
        `Cơ sở vật chất hiện đại, bác sĩ tận tâm giải thích rõ ràng từng bước. Rất hài lòng!`
      ];
    } else if (catLower.includes('khách sạn') || catLower.includes('resort') || catLower.includes('hotel') || catLower.includes('du lịch') || catLower.includes('tour')) {
      catReviews = [
        `Phòng nghỉ tại ${brandName} sạch sẽ, tiện nghi đầy đủ, nhân viên hỗ trợ nhiệt tình chu đáo.`,
        `Check-in bằng mã voucher nhanh gọn trong 2 phút. Trải nghiệm kỳ nghỉ tuyệt vời cùng gia đình!`,
        `Dịch vụ đúng như mô tả, lịch trình linh hoạt và hỗ trợ khách hàng rất tốt.`
      ];
    }

    const numReviews = 2 + (index % 2); // 2 hoặc 3 review mỗi voucher
    for (let rIdx = 0; rIdx < numReviews; rIdx++) {
      const custName = sampleCustomerNames[(index * 2 + rIdx) % sampleCustomerNames.length];
      const custEmail = `cust.${generateSlug(custName)}.${(index + rIdx) % 100}@gmail.com`;
      const rating = (index + rIdx) % 7 === 0 ? 4 : 5;
      const submittedAt = new Date(Date.now() - ((rIdx + 1) * 4 + (index % 7)) * 24 * 60 * 60 * 1000);
      reviews.push({
        customer_name: custName,
        customer_email: custEmail,
        rating,
        review_content: catReviews[rIdx % catReviews.length],
        submitted_at: submittedAt,
      });
    }
  }

  return {
    program_name: raw.title,
    category_name: cleanCategory,
    category_description: `Voucher ưu đãi hấp dẫn ngành hàng ${cleanCategory}`,
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
    branches: branches,
    banner,
    popup,
    contents,
    reviews,
  };
}
