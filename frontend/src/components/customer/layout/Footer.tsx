import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-surface-container-highest dark:bg-inverse-surface border-t border-outline-variant dark:border-outline full-width mt-auto transition-all">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="font-headline-lg text-headline-lg font-black text-primary dark:text-inverse-primary"
          >
            Lumina Marketplace
          </Link>
          <p className="font-body-md text-body-md text-on-surface-variant dark:text-surface-variant">
            © 2026 Lumina Marketplace. Nền tảng voucher hàng đầu Việt Nam.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="font-label-md text-label-md font-bold text-on-surface mb-1">
            Khám phá
          </h4>
          <a
            href="#"
            className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-inverse-primary transition-all font-body-md text-body-md"
          >
            Về chúng tôi
          </a>
          <a
            href="#"
            className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-inverse-primary transition-all font-body-md text-body-md"
          >
            Thương hiệu nổi bật
          </a>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="font-label-md text-label-md font-bold text-on-surface mb-1">
            Hỗ trợ
          </h4>
          <a
            href="#"
            className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-inverse-primary transition-all font-body-md text-body-md"
          >
            Trung tâm hỗ trợ
          </a>
          <a
            href="#"
            className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-inverse-primary transition-all font-body-md text-body-md"
          >
            Liên hệ
          </a>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="font-label-md text-label-md font-bold text-on-surface mb-1">
            Pháp lý
          </h4>
          <a
            href="#"
            className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-inverse-primary transition-all font-body-md text-body-md"
          >
            Điều khoản sử dụng
          </a>
          <a
            href="#"
            className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-inverse-primary transition-all font-body-md text-body-md"
          >
            Chính sách bảo mật
          </a>
        </div>
      </div>
    </footer>
  );
}
