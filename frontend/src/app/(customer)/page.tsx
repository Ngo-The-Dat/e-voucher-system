import HeroBanner from "@/components/customer/home/HeroBanner";
import CategoriesGrid from "@/components/customer/home/CategoriesGrid";
import FeaturedDeals from "@/components/customer/home/FeaturedDeals";
import TrustBadges from "@/components/customer/home/TrustBadges";

export default function Home() {
  return (
    <main className="flex-grow">
      <HeroBanner />
      <CategoriesGrid />
      <FeaturedDeals />
      <TrustBadges />
    </main>
  );
}
