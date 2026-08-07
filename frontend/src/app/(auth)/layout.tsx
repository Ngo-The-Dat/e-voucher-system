export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-surface-dim flex items-center justify-center p-4 md:p-6">
      {children}
    </div>
  );
}
