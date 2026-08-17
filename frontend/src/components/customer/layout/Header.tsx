"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Search, ShoppingCart, Bell, Menu, X, LogIn, UserPlus, LogOut, User, Ticket, Utensils, Plane, Monitor, Sparkles, Gamepad2, ShoppingBag, ChevronDown, List } from "lucide-react";
import { customerAuthApi, CustomerUser } from "@/lib/customer-api";

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { cart } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Sync auth state
  const checkAuth = () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("customer_access_token") || localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      const storedUser = localStorage.getItem("customer_user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser(null);
        }
      }
      customerAuthApi.getMe().then((userData) => {
        setUser(userData);
        localStorage.setItem("customer_user", JSON.stringify(userData));
      }).catch(() => {
        // If token expired/invalid
      });
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
    const handleAuthChange = () => checkAuth();
    window.addEventListener("customer-auth-changed", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    return () => {
      window.removeEventListener("customer-auth-changed", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  // Sync state with url query if present
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearchQuery(q);
    else setSearchQuery("");
  }, [searchParams]);

  const handleLogout = () => {
    customerAuthApi.logout();
    localStorage.removeItem("customer_user");
    setIsLoggedIn(false);
    setUser(null);
    setUserDropdownOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("customer-auth-changed"));
    }
    router.push("/login");
    router.refresh();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/vouchers?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/vouchers");
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    setIsCategoryOpen(false);
    setMobileMenuOpen(false);
    router.push(`/vouchers?category=${encodeURIComponent(categoryName)}`);
  };

  const cartItemsCount = cart.length;

  const categories = [
    { name: "Điện tử", icon: Monitor },
    { name: "Ẩm thực", icon: Utensils },
    { name: "Du lịch", icon: Plane },
    { name: "Làm đẹp", icon: Sparkles },
    { name: "Giải trí", icon: Gamepad2 },
    { name: "Mua sắm", icon: ShoppingBag }
  ];

  return (
    <header className="top-0 sticky z-50 w-full flex flex-col shadow-sm transition-all">
      {/* Top tier (Deep Blue Background) */}
      <div className="bg-[#0f2c59] w-full">
        <div className="flex items-center justify-between h-20 px-margin-mobile md:px-6 xl:px-margin-desktop max-w-container-max mx-auto gap-4">
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
            className="hidden md:flex flex-grow max-w-xl mx-auto px-4"
          >
            <div className="relative w-full flex items-center bg-white rounded-full shadow-md overflow-hidden h-11">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm voucher, thương hiệu..."
                className="flex-grow h-full pl-6 pr-4 text-gray-800 outline-none text-body-md placeholder-gray-400"
              />
              <button
                type="submit"
                className="h-9 px-6 mr-1 bg-[#0f2c59] text-white rounded-full font-label-md hover:bg-[#0f2c59]/90 transition-colors flex items-center justify-center cursor-pointer shadow-sm"
              >
                Tìm kiếm
              </button>
            </div>
          </form>

          {/* Utilities & Actions */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Cart Icon */}
            <Link
              href="/cart"
              aria-label="shopping_cart"
              className="text-white hover:text-white/80 transition-colors p-2 rounded-full hover:bg-white/10 relative flex items-center justify-center"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartItemsCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-error text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* Notification Icon */}
            <button
              aria-label="notifications"
              className="text-white hover:text-white/80 transition-colors p-2 rounded-full hover:bg-white/10 hidden md:flex items-center justify-center cursor-pointer"
            >
              <Bell className="w-6 h-6" />
            </button>

            {/* Account / Auth */}
            {isLoggedIn ? (
              <div className="relative hidden sm:block ml-1">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="w-10 h-10 rounded-full border border-white/30 bg-white/20 text-white font-bold text-base flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors shadow-sm"
                  title={user?.full_name || "Tài khoản"}
                >
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                </button>

                {userDropdownOpen && (
                  <div
                    onMouseLeave={() => setUserDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-50 text-gray-800 animate-fadeIn"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-title-sm text-title-sm font-bold truncate">{user?.full_name || "Khách hàng"}</p>
                      <p className="font-body-xs text-body-xs text-gray-500 truncate">{user?.email}</p>
                    </div>

                    <Link
                      href="/my-vouchers"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 font-label-md text-label-md hover:bg-gray-50 transition-colors"
                    >
                      <Ticket className="w-4 h-4 text-[#0f2c59]" />
                      <span>Voucher của tôi</span>
                    </Link>

                    <Link
                      href="/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 font-label-md text-label-md hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-[#0f2c59]" />
                      <span>Đơn hàng của tôi</span>
                    </Link>

                    <div className="border-t border-gray-100 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 font-label-md text-label-md text-error hover:bg-error/5 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-3 ml-2">
                <Link
                  href="/login"
                  className="flex items-center justify-center px-5 py-2 border border-white text-white rounded-full font-label-md font-semibold hover:bg-white/10 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="flex items-center justify-center px-5 py-2 bg-white text-[#0f2c59] rounded-full font-label-md font-semibold hover:bg-gray-100 transition-colors shadow-sm"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Mobile Menu Burger Icon */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white hover:bg-white/10 rounded-full cursor-pointer flex items-center justify-center ml-1"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom tier (Light background) */}
      {pathname === "/" && (
        <div className="bg-white border-b border-gray-200 w-full hidden md:block">
          <div className="h-12 flex items-center px-margin-mobile md:px-6 xl:px-margin-desktop max-w-container-max mx-auto gap-8">
            {/* Categories Dropdown */}
            <div
              className="relative h-full flex items-center z-40 group"
              onMouseEnter={() => setIsCategoryOpen(true)}
              onMouseLeave={() => setIsCategoryOpen(false)}
            >
              <button className="flex items-center gap-2 text-gray-800 font-semibold hover:text-[#0f2c59] transition-colors cursor-pointer h-full">
                <List className="w-5 h-5" />
                Danh mục
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              <div className={`absolute top-full left-0 w-64 bg-white shadow-xl rounded-b-xl border border-gray-100 py-2 transition-all duration-200 origin-top-left ${isCategoryOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'}`}>
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => handleCategoryClick(cat.name)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 hover:text-[#0f2c59] transition-colors cursor-pointer"
                  >
                    <cat.icon className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-body-md">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-8 h-full">
              <Link
                href="/"
                className={`font-label-md transition-colors h-full flex items-center border-b-2 ${
                  pathname === "/"
                    ? "text-[#0f2c59] border-[#0f2c59] font-bold"
                    : "text-gray-600 border-transparent hover:text-[#0f2c59]"
                }`}
              >
                Khám phá
              </Link>
              <Link
                href="/my-vouchers"
                className={`font-label-md transition-colors h-full flex items-center border-b-2 ${
                  pathname.startsWith("/my-vouchers")
                    ? "text-[#0f2c59] border-[#0f2c59] font-bold"
                    : "text-gray-600 border-transparent hover:text-[#0f2c59]"
                }`}
              >
                Voucher của tôi
              </Link>
              <Link
                href="/orders"
                className={`font-label-md transition-colors h-full flex items-center border-b-2 ${
                  pathname.startsWith("/orders")
                    ? "text-[#0f2c59] border-[#0f2c59] font-bold"
                    : "text-gray-600 border-transparent hover:text-[#0f2c59]"
                }`}
              >
                Đơn hàng
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white p-4 transition-all flex flex-col gap-4 absolute top-full left-0 w-full shadow-lg">
          {/* Mobile Auth Status Header */}
          {!isLoggedIn ? (
            <div className="flex gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100 mb-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 text-center font-label-md text-label-md font-semibold bg-white border border-gray-200 rounded-lg text-[#0f2c59]"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 text-center font-label-md text-label-md font-semibold bg-[#0f2c59] text-white rounded-lg"
              >
                Đăng ký
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 mb-2">
              <div className="min-w-0 pr-2">
                <p className="font-title-sm text-title-sm font-bold text-gray-800 truncate">{user?.full_name}</p>
                <p className="font-body-xs text-body-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="p-2 text-error hover:bg-error/10 rounded-lg flex items-center gap-1 font-label-sm text-label-sm font-semibold shrink-0 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Thoát</span>
              </button>
            </div>
          )}

          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm voucher, thương hiệu..."
              className="w-full h-11 pl-4 pr-12 rounded-lg border border-gray-200 bg-gray-50 outline-none text-body-md"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-3 bg-[#0f2c59] text-white rounded-md flex items-center justify-center cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>

          {/* Mobile Navigation Links */}
          <nav className="flex flex-col gap-2 font-label-md text-label-md mt-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-3 px-4 rounded-lg flex items-center gap-3 ${
                pathname === "/" ? "bg-[#0f2c59]/5 text-[#0f2c59] font-bold" : "text-gray-700"
              }`}
            >
              Khám phá
            </Link>
            <Link
              href="/my-vouchers"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-3 px-4 rounded-lg flex items-center gap-3 ${
                pathname.startsWith("/my-vouchers") ? "bg-[#0f2c59]/5 text-[#0f2c59] font-bold" : "text-gray-700"
              }`}
            >
              Voucher của tôi
            </Link>
            <Link
              href="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-3 px-4 rounded-lg flex items-center gap-3 ${
                pathname.startsWith("/orders") ? "bg-[#0f2c59]/5 text-[#0f2c59] font-bold" : "text-gray-700"
              }`}
            >
              Đơn hàng của tôi
            </Link>
            <Link
              href="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-3 px-4 rounded-lg flex items-center gap-3 ${
                pathname === "/cart" ? "bg-[#0f2c59]/5 text-[#0f2c59] font-bold" : "text-gray-700"
              }`}
            >
              Giỏ hàng ({cartItemsCount})
            </Link>
          </nav>

          {/* Mobile Categories */}
          <div className="border-t border-gray-200 pt-4 mt-2">
            <p className="text-label-sm font-semibold text-gray-500 mb-3 px-2 uppercase">Danh mục chính</p>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => {
                    handleCategoryClick(cat.name);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 py-2.5 px-3 text-left text-label-sm border border-gray-100 rounded-lg bg-gray-50 hover:bg-[#0f2c59]/5 hover:text-[#0f2c59] hover:border-[#0f2c59]/20 transition-colors cursor-pointer"
                >
                  <cat.icon className="w-4 h-4 text-gray-500" />
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
