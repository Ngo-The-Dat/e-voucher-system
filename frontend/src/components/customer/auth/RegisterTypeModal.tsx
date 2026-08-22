"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, User, ArrowRight, CheckCircle2, Sparkles, Building2 } from "lucide-react";

interface RegisterTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegisterTypeModal({ isOpen, onClose }: RegisterTypeModalProps) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (path: string) => {
    onClose();
    router.push(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 sm:p-8 z-10 animate-scaleUp overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-8 pr-6 sm:pr-0">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#0f2c59]/10 text-[#0f2c59] mb-3">
            <Sparkles className="w-6 h-6 text-[#0f2c59]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Chọn loại tài khoản đăng ký
          </h2>
          <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto">
            Lựa chọn vai trò phù hợp nhất với nhu cầu sử dụng của bạn trên Vouchify Marketplace.
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          {/* Card 1: Khách hàng */}
          <div
            onClick={() => handleSelect("/register")}
            className="group relative flex flex-col justify-between p-6 rounded-2xl border-2 border-gray-100 bg-gray-50/50 hover:bg-white hover:border-[#0f2c59] hover:shadow-xl transition-all duration-200 cursor-pointer text-left"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100/60 text-[#0f2c59] flex items-center justify-center group-hover:bg-[#0f2c59] group-hover:text-white transition-colors duration-200">
                  <User className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-[#0f2c59] border border-blue-100">
                  Cá nhân
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#0f2c59] transition-colors mb-2">
                Khách hàng cá nhân
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 leading-relaxed">
                Dành cho người mua sắm muốn săn voucher ưu đãi, tích điểm thưởng và sử dụng mã giảm giá.
              </p>

              <ul className="space-y-2 mb-6 text-xs sm:text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>Voucher giảm giá tới 50%</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>Thanh toán tiện lợi, an toàn</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>Quản lý kho voucher cá nhân</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              className="w-full py-3 px-4 rounded-xl bg-white border border-gray-200 text-gray-800 font-semibold text-sm group-hover:bg-[#0f2c59] group-hover:text-white group-hover:border-[#0f2c59] transition-all duration-200 flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Đăng ký Khách hàng</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Card 2: Đối tác / Doanh nghiệp */}
          <div
            onClick={() => handleSelect("/partner/register")}
            className="group relative flex flex-col justify-between p-6 rounded-2xl border-2 border-gray-100 bg-gray-50/50 hover:bg-white hover:border-[#0f2c59] hover:shadow-xl transition-all duration-200 cursor-pointer text-left"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100/60 text-[#0f2c59] flex items-center justify-center group-hover:bg-[#0f2c59] group-hover:text-white transition-colors duration-200">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                  Doanh nghiệp
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#0f2c59] transition-colors mb-2">
                Đối tác / Cửa hàng
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 leading-relaxed">
                Dành cho các doanh nghiệp, thương hiệu và chủ cửa hàng muốn phát hành voucher và tiếp cận khách hàng.
              </p>

              <ul className="space-y-2 mb-6 text-xs sm:text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>Phát hành e-voucher nhanh chóng</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>Quản lý doanh thu & đối soát tự động</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>Hệ thống phân quyền nhân viên</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              className="w-full py-3 px-4 rounded-xl bg-white border border-gray-200 text-gray-800 font-semibold text-sm group-hover:bg-[#0f2c59] group-hover:text-white group-hover:border-[#0f2c59] transition-all duration-200 flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Đăng ký Đối tác</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Đã có tài khoản?{" "}
            <button
              type="button"
              onClick={onClose}
              className="font-semibold text-[#0f2c59] hover:underline cursor-pointer ml-1"
            >
              Đăng nhập ngay
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
