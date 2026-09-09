import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, CreditCard, Receipt, Settings, MapPin, Building2, FileText, LogOut, Bell, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const items = [
  { href: "/admin", label: "Tüm Bölümler", icon: LayoutDashboard },
  { href: "/admin/businesses", label: "İşletme Listesi", icon: Building2 },
  { href: "/admin/venues", label: "Mekanlar", icon: MapPin },
  { href: "/admin/licenses", label: "Lisanslar", icon: FileText },
  { href: "/admin/notifications", label: "Bildirimler", icon: Bell },
  { href: "/admin/payments", label: "Ödeme", icon: CreditCard },
  { href: "/admin/invoices", label: "Fatura", icon: Receipt },
  { href: "/admin/settings", label: "Ayarlar", icon: Settings },
];

function AdminSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();

  return (
    <div className="h-full flex flex-col text-foreground">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/20">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-none text-foreground">Admin<span className="text-primary">Panel</span></h1>
            <span className="text-xs text-muted-foreground">Sistem Yönetimi</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 font-medium"
                    : "hover:bg-primary/10 text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Link href="/">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-screen w-64 flex-shrink-0 bg-background border-r border-border flex-col text-foreground">
        <AdminSidebarNav />
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 z-40 bg-background border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20">
            <Settings className="h-4 w-4" />
          </div>
          <h1 className="font-display font-bold text-base leading-none text-foreground">Admin<span className="text-primary">Panel</span></h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Menüyü aç">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-background text-foreground border-border">
          <SheetTitle className="sr-only">Menü</SheetTitle>
          <AdminSidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
