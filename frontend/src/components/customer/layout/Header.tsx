"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Search, ShoppingCart, Bell, Ticket, Menu, X } from "lucide-react";
import Image from "next/image";

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { cart } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync state with url query if present
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearchQuery(q);
    else setSearchQuery("");
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/vouchers?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/vouchers");
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    router.push(`/vouchers?category=${encodeURIComponent(categoryName)}`);
  };

  const cartItemsCount = cart.length;

  const categories = [
    "Điện tử",
    "Ẩm thực",
    "Du lịch",
    "Làm đẹp",
    "Giải trí",
    "Mua sắm"
  ];

  return (
    <header className="bg-primary border-b border-white/10 shadow-sm top-0 sticky z-50 w-full transition-all">
      <div className="flex items-center justify-between h-20 md:h-24 px-margin-mobile md:px-6 xl:px-margin-desktop max-w-container-max mx-auto gap-2 md:gap-4">
        {/* Brand */}
        <Link
          href="/"
          className="text-xl sm:text-2xl lg:text-headline-lg font-bold text-white tracking-tight shrink-0 whitespace-nowrap"
        >
          Lumina<span className="hidden sm:inline"> Marketplace</span>
        </Link>

        {/* Search Bar (Desktop) */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-grow max-w-xs lg:max-w-md xl:max-w-xl mx-4 flex-col"
        >
          <div className="relative w-full group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm voucher, thương hiệu..."
              className="w-full h-10 pl-4 pr-12 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/60 focus:bg-white focus:text-text-main focus:placeholder-text-muted focus:ring-2 focus:ring-white/20 transition-all outline-none text-body-md"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 bottom-0 px-4 text-white/80 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-4 mt-2.5 py-1 px-1 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                className="text-label-sm font-label-sm text-white/80 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
              >
                {cat}
              </button>
            ))}
          </div>
        </form>

        {/* Navigation & Actions */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0">
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 mr-4">
            <Link
              href="/"
              className={`font-label-md text-label-md transition-colors duration-200 pb-1 ${
                pathname === "/"
                  ? "text-white font-bold border-b-2 border-white"
                  : "text-white/80 font-medium hover:text-white"
              }`}
            >
              Khám phá
            </Link>
            <Link
              href="/vouchers"
              className={`font-label-md text-label-md transition-colors duration-200 pb-1 ${
                pathname.startsWith("/vouchers")
                  ? "text-white font-bold border-b-2 border-white"
                  : "text-white/80 font-medium hover:text-white"
              }`}
            >
              Danh mục
            </Link>
            <Link
              href="/my-vouchers"
              className={`font-label-md text-label-md transition-colors duration-200 pb-1 ${
                pathname.startsWith("/my-vouchers")
                  ? "text-white font-bold border-b-2 border-white"
                  : "text-white/80 font-medium hover:text-white"
              }`}
            >
              Voucher của tôi
            </Link>
          </nav>

          {/* Cart Icon */}
          <Link
            href="/cart"
            aria-label="shopping_cart"
            className="text-white/90 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 relative flex items-center justify-center"
          >
            <ShoppingCart className={`w-6 h-6 ${pathname === "/cart" ? "fill-white" : ""}`} />
            {cartItemsCount > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-error text-on-error text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </Link>

          {/* Notifications (Mock) */}
          <button
            aria-label="notifications"
            className="text-white/90 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 hidden md:flex items-center justify-center cursor-pointer"
          >
            <Bell className="w-6 h-6" />
          </button>

          {/* My Vouchers Shortcut (Desktop) */}
          <Link
            href="/my-vouchers"
            className="hidden md:flex lg:hidden items-center gap-2 border border-white/20 rounded-lg px-4 py-2 font-label-md text-label-md text-white hover:bg-white/10 transition-colors"
          >
            <Ticket className="w-5 h-5" />
            Voucher của tôi
          </Link>

          {/* Avatar (Mock) */}
          <div className="hidden sm:block w-10 h-10 rounded-full overflow-hidden border border-white/20 cursor-pointer ml-1 md:ml-2 relative">
            <Image
              width={40}
              height={40}
              alt="Ảnh đại diện người dùng"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqGdpRficcqsgdz-i0dIgDVTErKxUqYhHMUQnh_Kz9yj1HPD9DIKVtvZg-YBsJFLFv4VFYtsS3r4FylIVrLhCew3c_JFPQnZRUrTPHcV8Pfa771gYZewmF9k5LER3RWzoGwjixjPtLVbfXxLqHD5fUUIxeTN6AB7iZJUdX0BXWTSZQ0vqbOCBkDT77vETSGdpWLq7g6ySvbCZk0OKmqqVSjtB71THFtD1-BFzgHsT6KT1-gRW87gOi"
            />
          </div>

          {/* Mobile Menu Burger Icon */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white/90 hover:bg-white/10 rounded-full cursor-pointer flex items-center justify-center"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-outline-variant bg-surface-container-lowest p-4 transition-all flex flex-col gap-4">
          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm voucher, thương hiệu..."
              className="w-full h-10 pl-4 pr-12 rounded-lg border border-outline-variant bg-surface-container-low outline-none text-body-md"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-3 bg-primary text-on-primary rounded-md flex items-center justify-center cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>

          {/* Mobile Navigation Links */}
          <nav className="flex flex-col gap-3 font-label-md text-label-md mt-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-2 px-3 rounded-lg ${
                pathname === "/" ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant"
              }`}
            >
              Khám phá
            </Link>
            <Link
              href="/vouchers"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-2 px-3 rounded-lg ${
                pathname.startsWith("/vouchers") ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant"
              }`}
            >
              Danh mục
            </Link>
            <Link
              href="/my-vouchers"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-2 px-3 rounded-lg ${
                pathname.startsWith("/my-vouchers") ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant"
              }`}
            >
              Voucher của tôi
            </Link>
            <Link
              href="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-2 px-3 rounded-lg ${
                pathname === "/cart" ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant"
              }`}
            >
              Giỏ hàng ({cartItemsCount})
            </Link>
          </nav>

          {/* Mobile Categories Shortcut */}
          <div className="border-t border-outline-variant pt-3">
            <p className="text-label-sm font-semibold text-text-muted mb-2 px-3 uppercase">Danh mục chính</p>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    handleCategoryClick(cat);
                    setMobileMenuOpen(false);
                  }}
                  className="py-2 text-center text-label-sm border border-outline-variant rounded-md bg-surface-container-low hover:bg-primary-container hover:text-on-primary-container transition-colors cursor-pointer"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
