import Link from "next/link";

export default function HeroBanner() {
  return (
    <section className="relative bg-surface-container-low pt-24 pb-32 px-margin-mobile md:px-margin-desktop overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center opacity-30 mix-blend-multiply"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAEyX6QrXDI3jCpu330ltSLLYmJci5pYryyT9RyP0VW2sYFFbBpZ46v2L84u2VDCfwb1PmHuxQ-L9ufzDVSRgQiIR6UcxeD3bi45lt3iOozvrENQVJVG1YbezmCPv5dt9WjTv9Q5MkH2JNc5hxXymdVT4FR8pPsgTZXSiFxAN84BWxCAWVqC0JIkacFvn1FnnKS21o-zKvSV8gkMttQBATioXZphOqzXO9uheiZMxTvHyF08h88-eae')"
          }}
        />
      </div>
      <div className="relative z-10 max-w-container-max mx-auto flex flex-col items-center text-center">
        <h1 className="font-headline-xl text-headline-xl text-on-background mb-6 max-w-3xl leading-tight">
          Voucher tốt hơn cho mọi trải nghiệm
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-10 max-w-2xl">
          Khám phá hàng ngàn ưu đãi độc quyền từ các thương hiệu hàng đầu. Mua sắm thông minh,
          tiết kiệm tối đa cùng Lumina Marketplace.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/vouchers"
            className="px-8 py-4 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-semibold hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer"
          >
            Khám phá voucher
          </Link>
        </div>
      </div>
    </section>
  );
}
