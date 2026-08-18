import PromoPopupModal from "@/components/customer/home/PromoPopupModal";
import HeroBanner from "@/components/customer/home/HeroBanner";
import CategoriesGrid from "@/components/customer/home/CategoriesGrid";
import FeaturedDeals from "@/components/customer/home/FeaturedDeals";
import MiddleBanner from "@/components/customer/home/MiddleBanner";
import FeaturedArticles from "@/components/customer/home/FeaturedArticles";
import TrustBadges from "@/components/customer/home/TrustBadges";

export default function Home() {
  return (
    <main className="flex-grow">
      {/* Popup ưu đãi chào mừng */}
      <PromoPopupModal />

      {/* Banner trình chiếu chính */}
      <HeroBanner />

      {/* Danh mục ngành hàng */}
      <CategoriesGrid />

      {/* Ưu đãi hot & Flash sale */}
      <FeaturedDeals />

      {/* Banner nổi bật giữa trang */}
      <MiddleBanner />

      {/* Cẩm nang, kinh nghiệm săn deal & bài viết */}
      <FeaturedArticles />

      {/* Cam kết tin cậy */}
      <TrustBadges />
    </main>
  );
}
