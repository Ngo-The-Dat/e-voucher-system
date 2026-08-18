import PartnerShellLayout from "@/components/partner/layout/PartnerShellLayout";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PartnerShellLayout>{children}</PartnerShellLayout>;
}
