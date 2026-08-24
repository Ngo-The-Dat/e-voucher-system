export interface ScrapedCategory {
  categoryId?: number;
  slug: string;
  name: string;
  description?: string;
  sourcePlatform?: string;
  url: string;
}

export interface RawScrapedBranch {
  branchName?: string;
  address: string;
  phone?: string;
}

export interface RawScrapedVoucher {
  sourcePlatform?: 'HOTDEAL' | 'DEALTODAY' | 'KLOOK' | string;
  sourceUrl: string;
  categorySlug: string;
  categoryName: string;
  categoryId?: number;
  title: string;
  originalPriceRaw: string;
  salePriceRaw: string;
  primaryImage: string;
  detailUrl: string;
  conditionsHtml?: string;
  detailsHtml?: string;
  galleryImages?: string[];
  partnerNameRaw?: string;
  branchNameRaw?: string;
  addressRaw?: string;
  branchesRaw?: RawScrapedBranch[];
  phoneRaw?: string;
  useStartAtRaw?: string;
  useEndAtRaw?: string;
  reviewsRaw?: RawScrapedReview[];
}

export interface RawScrapedReview {
  authorName?: string;
  rating?: number;
  content: string;
  submittedAtRaw?: string;
}

export interface NormalizedReview {
  customer_name: string;
  customer_email: string;
  rating: number;
  review_content: string;
  submitted_at: Date;
}

export interface NormalizedBranch {
  branch_name: string;
  address: string;
  region: 'Miền Bắc' | 'Miền Trung' | 'Miền Nam';
  phone: string;
}

export interface NormalizedPartner {
  business_name: string;
  tax_code: string;
  email: string;
  phone: string;
  brand_logo: string;
  representative_title: string;
  branches: NormalizedBranch[];
}

export interface NormalizedVoucherProgram {
  program_name: string;
  category_name: string;
  category_description?: string;
  category_id?: number;
  original_price: number;
  sale_price: number;
  issue_quantity: number;
  sale_start_at: Date;
  sale_end_at: Date;
  use_start_at: Date;
  use_end_at: Date;
  display_status: 'PUBLISHED' | 'DRAFT' | 'PENDING_APPROVAL' | 'HIDDEN' | 'ENDED';
  images: Array<{
    image_url: string;
    is_primary: boolean;
    sort_order: number;
  }>;
  partner: NormalizedPartner;
  branches: NormalizedBranch[];
  banner?: {
    title: string;
    image_url: string;
    target_url: string;
    display_position: string;
    display_from: Date;
    display_to: Date;
    status: 'ACTIVE' | 'INACTIVE';
  };
  popup?: {
    title: string;
    content: string;
    target_url: string;
    image_url: string;
    start_at: Date;
    end_at: Date;
    status: 'ACTIVE' | 'INACTIVE';
  };
  contents: Array<{
    title: string;
    body: string;
    content_type: 'POLICY' | 'ARTICLE' | 'PROMOTION' | 'GUIDE';
    status: 'ACTIVE' | 'INACTIVE';
  }>;
  reviews: NormalizedReview[];
}

export interface CrawlOptions {
  limitPerCategory?: number;
  categorySlugs?: string[];
  dryRun?: boolean;
  exportSql?: boolean;
  sqlOutputPath?: string;
}
