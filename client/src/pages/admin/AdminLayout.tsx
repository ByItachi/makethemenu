import { AdminSidebar } from "@/components/AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto h-screen bg-muted/20 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
