import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, CreditCard, Receipt, Settings, MapPin, Building2, FileText, LogOut, Bell, Menu, Ticket, Palette, Sparkles, Globe, BarChart3, Blocks, Puzzle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const items = [
  { href: "/admin", label: "Tüm Bölümler", icon: LayoutDashboard },
  { href: "/admin/businesses", label: "İşletme Listesi", icon: Building2 },
  { href: "/admin/venues", label: "Mekanlar", icon: MapPin },
  { href: "/admin/licenses", label: "Lisanslar", icon: FileText },
  { href: "/admin/notifications", label: "Bildirimler", icon: Bell },
  { href: "/admin/payments", label: "Ödeme", icon: CreditCard },
  { href: "/admin/templates", label: "Şablonlar", icon: Palette },
  { href: "/admin/ai-builder", label: "AI Builder", icon: Sparkles },
  { href: "/admin/demos", label: "Demo Sayfaları", icon: Globe },
  { href: "/admin/coupons", label: "Kuponlar", icon: Ticket },
  { href: "/admin/invoices", label: "Fatura", icon: Receipt },
  { href: "/admin/settings/analytics", label: "Ölçümleme ve SEO", icon: BarChart3 },
  { href: "/admin/sectors", label: "Sektörler", icon: Blocks },
  { href: "/admin/integrations", label: "Entegrasyonlar", icon: Puzzle },
  { href: "/admin/settings", label: "Ayarlar", icon: Settings },
];

function AdminSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();

  return (
    <div className="h-full flex flex-col text-foreground">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <img
            src="/makethemenu-header.png"
            alt="makethemenu"
            draggable={false}
            className="h-11 w-auto max-w-[190px] object-contain select-none block dark:hidden"
          />
          <img
            src="/makethemenu-footer.png"
            alt="makethemenu"
            draggable={false}
            className="h-11 w-auto max-w-[190px] object-contain select-none hidden dark:block"
          />
        </div>
        <span className="text-xs text-muted-foreground mt-1 block">Sistem Yönetimi</span>
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
        <div className="flex gap-2">
          <ThemeToggle />
          <Link href="/" className="flex-1 min-w-0">
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
          <img
            src="/makethemenu-header.png"
            alt="makethemenu"
            draggable={false}
            className="h-8 w-auto max-w-[140px] object-contain select-none block dark:hidden"
          />
          <img
            src="/makethemenu-footer.png"
            alt="makethemenu"
            draggable={false}
            className="h-8 w-auto max-w-[140px] object-contain select-none hidden dark:block"
          />
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
