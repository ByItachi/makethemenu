import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Receipt, Settings, LogOut, PanelLeftOpen, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const items = [
  { href: "/panel", label: "Panel", icon: LayoutDashboard },
  { href: "/pos", label: "POS", icon: ShoppingBag },
  { href: "/masalar", label: "Masalar", icon: PanelLeftOpen },
  { href: "/siparisler", label: "Siparişler", icon: Receipt },
  { href: "/menu", label: "Menü Yönetimi", icon: UtensilsCrossed },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="h-full flex flex-col text-sidebar-foreground">
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
        <span className="text-xs text-muted-foreground mt-1 block">Yönetim</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {items.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group",
                  isActive
                    ? "bg-primary text-primary-foreground dark:text-white shadow-md shadow-primary/25 font-medium"
                    : "hover:bg-primary/10 text-foreground dark:text-white"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary-foreground dark:text-white" : "text-primary dark:text-white")} />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9 border border-primary/20">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary">{user?.firstName?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate text-sidebar-foreground">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full justify-start gap-2 border-sidebar-border text-destructive dark:text-red-400 hover:bg-destructive/10 dark:hover:bg-red-900/20 hover:text-destructive dark:hover:text-red-300 hover:border-destructive/30 dark:hover:border-red-400/30 transition-all"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" />
          Çıkış Yap
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-screen w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex-col text-sidebar-foreground">
        <SidebarNav />
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 z-40 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img
            src="/makethemenu-header.png"
            alt="makethemenu"
            draggable={false}
            className="h-9 w-auto max-w-[160px] object-contain select-none block dark:hidden"
          />
          <img
            src="/makethemenu-footer.png"
            alt="makethemenu"
            draggable={false}
            className="h-9 w-auto max-w-[160px] object-contain select-none hidden dark:block"
          />
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Menüyü aç">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-sidebar text-sidebar-foreground border-sidebar-border">
          <SheetTitle className="sr-only">Menü</SheetTitle>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
