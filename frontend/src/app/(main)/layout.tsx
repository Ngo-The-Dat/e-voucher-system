import ShellLayout from "@/components/layout/ShellLayout";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ShellLayout>{children}</ShellLayout>;
}
