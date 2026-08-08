import { BadgeCheck, ShieldCheck, Zap } from "lucide-react";

export default function TrustBadges() {
  return (
    <section className="py-16 bg-surface border-y border-outline-variant/30 px-margin-mobile md:px-margin-desktop">
      <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-outline-variant/30">
        <div className="flex flex-col items-center py-4 md:py-0 px-4">
          <div className="w-16 h-16 bg-primary-container/20 rounded-full flex items-center justify-center mb-4 text-primary">
            <BadgeCheck className="w-8 h-8" />
          </div>
          <h3 className="font-title-md text-title-md font-bold text-on-surface mb-2">
            Voucher chính hãng
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant">
            100% voucher được phát hành trực tiếp từ các đối tác thương hiệu uy tín.
          </p>
        </div>
        <div className="flex flex-col items-center py-4 md:py-0 px-4">
          <div className="w-16 h-16 bg-secondary-container/20 rounded-full flex items-center justify-center mb-4 text-secondary">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="font-title-md text-title-md font-bold text-on-surface mb-2">
            Thanh toán an toàn
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Hệ thống thanh toán bảo mật đa lớp, hỗ trợ nhiều phương thức linh hoạt.
          </p>
        </div>
        <div className="flex flex-col items-center py-4 md:py-0 px-4">
          <div className="w-16 h-16 bg-tertiary-container/20 rounded-full flex items-center justify-center mb-4 text-tertiary">
            <Zap className="w-8 h-8" />
          </div>
          <h3 className="font-title-md text-title-md font-bold text-on-surface mb-2">
            Nhận voucher tức thì
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Mã e-voucher được gửi ngay lập tức qua ứng dụng và email sau khi thanh toán.
          </p>
        </div>
      </div>
    </section>
  );
}
