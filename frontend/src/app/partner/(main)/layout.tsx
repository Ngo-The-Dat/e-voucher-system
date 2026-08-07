import ShellLayout from "@/components/partner/layout/ShellLayout";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ShellLayout>{children}</ShellLayout>;
}
