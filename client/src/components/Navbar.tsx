import { Topbar } from "@/components/Topbar";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Menu,
  ChevronDown,
  Store,
  Coffee,
  GitBranch,
  Cloud,
  Pizza,
  Utensils,
  Hotel,
  Sun,
  Smartphone,
  ChefHat,
  FileText,
  Bike,
  BarChart3,
  Package,
  Puzzle,
  Link as LinkIcon,
  Users,
  Monitor,
  LayoutTemplate,
  Building2,
  Smile,
  Phone,
  Handshake,
  Megaphone,
  BookOpen,
  HelpCircle,
  Code,
  Moon,
  Languages,
  Pencil as PencilIcon,
  Download as DownloadIcon
} from "lucide-react";
import { useState, useEffect } from "react";
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDarkMode } from "@/contexts/DarkModeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const businessTypes = [
  { titleKey: "nav.biz.restaurant", icon: Store, href: "/restoran-otomasyon-sistemi" },
  { titleKey: "nav.biz.cafe", icon: Coffee, href: "/cafe-otomasyon-sistemi" },
  { titleKey: "nav.biz.multiChain", icon: GitBranch, href: "/coklu-sube-adisyon-pos-sistemi" },
  { titleKey: "nav.biz.cloudKitchen", icon: Cloud, href: "/cloud-kitchen-bulut-mutfak-adisyon-programi-pos-sistemi" },
  { titleKey: "nav.biz.fastFood", icon: Utensils, href: "/fast-food-isletme-adisyon-programi" },
  { titleKey: "nav.biz.pizza", icon: Pizza, href: "/pizza-restaurant-pos-otomasyon-sistemi" },
  { titleKey: "nav.biz.burger", icon: Utensils, href: "/burger-cafe-restoran-adisyon-sistemi" },
  { titleKey: "nav.biz.hotel", icon: Hotel, href: "/otel-restoran-yazilimi-otel-yazilim-programi" },
  { titleKey: "nav.biz.seasonal", icon: Sun, href: "/sezonluk-isletmeler" },
];

const features = [
  { titleKey: "nav.feat.templates", icon: LayoutTemplate, href: "/sablonlar" },
  { titleKey: "nav.feat.digitalMenu", icon: Smartphone, href: "/ozellikler/dijital-menu" },
  { titleKey: "nav.feat.stock", icon: Package, href: "/ozellikler/stok-yonetimi" },
  { titleKey: "nav.feat.kitchen", icon: ChefHat, href: "/ozellikler/mutfak" },
  { titleKey: "nav.feat.integrations", icon: Puzzle, href: "/ozellikler/entegrasyonlar" },
  { titleKey: "nav.feat.eInvoice", icon: FileText, href: "/ozellikler/e-fatura" },
  { titleKey: "nav.feat.chainManagement", icon: LinkIcon, href: "/ozellikler/zincir-yonetimi" },
  { titleKey: "nav.feat.courier", icon: Bike, href: "/ozellikler/kurye" },
  { titleKey: "nav.feat.customerMgmt", icon: Users, href: "/ozellikler/musteri-yonetimi" },
  { titleKey: "nav.feat.reporting", icon: BarChart3, href: "/ozellikler/raporlama" },
  { titleKey: "nav.feat.hardware", icon: Monitor, href: "/ozellikler/donanim" },
];

const about = [
  { titleKey: "nav.abt.company", icon: Building2, href: "/hakkimizda/sirket" },
  { titleKey: "nav.abt.customers", icon: Smile, href: "/hakkimizda/musteriler" },
  { titleKey: "nav.abt.contact", icon: Phone, href: "/iletisim" },
];

const partners = [
  { titleKey: "nav.ptn.dealership", icon: Handshake, href: "/is-ortakligi/bayilik" },
  { titleKey: "nav.ptn.campaigns", icon: Megaphone, href: "/is-ortakligi/kampanyalar" },
];

const resources = [
  { titleKey: "nav.res.blog", icon: BookOpen, href: "/kaynaklar/blog" },
  { titleKey: "nav.res.knowledgeBase", icon: HelpCircle, href: "/kaynaklar/bilgi-merkezi" },
  { titleKey: "nav.res.api", icon: Code, href: "/kaynaklar/api" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    // Sayfa ortasında yükleme/refresh durumunda ilk durumu hemen hesapla
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // Sayfa değişince en üste dön - header içeriğin üstünde bozuk görünmesin
  useEffect(() => {
    window.scrollTo(0, 0);
    setScrolled(false);
  }, [location]);

  // Sayfa bazlı arka plan rengi belirle - sadece ana sayfada üstte şeffaf olsun
  const getNavbarBackground = () => {
    if (scrolled || isOpen || location !== "/") {
      // Kaydırılınca ve iç sayfalarda her zaman okunur, dolgulu arka plan
      return "bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm";
    }

    // Ana sayfada en üstte şeffaf (hero görünsün)
    return "bg-transparent";
  };

  return (
    <div className={`fixed top-0 w-full z-50 transition-all duration-300 ${getNavbarBackground()}`}>
      <Topbar />
      <nav className={`w-full ${scrolled || isOpen ? "py-3" : "py-5"}`}>
        <div className="site-container">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center group cursor-pointer z-50 relative shrink-0">
              <img
                src="/makethemenu-header.png"
                alt="makethemenu"
                draggable={false}
                className="h-11 md:h-14 w-auto max-w-[190px] md:max-w-[220px] object-contain drop-shadow-md group-hover:scale-105 transition-transform select-none block dark:hidden"
              />
              <img
                src="/makethemenu-footer.png"
                alt="makethemenu"
                draggable={false}
                className="h-11 md:h-14 w-auto max-w-[190px] md:max-w-[220px] object-contain drop-shadow-md group-hover:scale-105 transition-transform select-none hidden dark:block"
              />
            </Link>

            {/* Desktop Nav - Centered */}
            <div className="hidden lg:flex items-center justify-center flex-1 px-1 min-w-0">
              <div className="flex items-center">
                <DropdownNavItem title={t("nav.businessTypes")}>
                  <ul className="grid w-[600px] grid-cols-2 gap-3 p-4">
                    {businessTypes.map((item) => (
                      <ListItem key={item.titleKey} title={t(item.titleKey)} href={item.href} icon={item.icon} />
                    ))}
                  </ul>
                </DropdownNavItem>

                <DropdownNavItem title={t("nav.features")}>
                  <ul className="grid w-[600px] grid-cols-2 gap-3 p-4">
                    {features.map((item) => (
                      <ListItem key={item.titleKey} title={t(item.titleKey)} href={item.href} icon={item.icon} />
                    ))}
                  </ul>
                </DropdownNavItem>

                <DropdownNavItem title={t("nav.about")}>
                  <ul className="grid w-[300px] gap-3 p-4">
                    {about.map((item) => (
                      <ListItem key={item.titleKey} title={t(item.titleKey)} href={item.href} icon={item.icon} />
                    ))}
                  </ul>
                </DropdownNavItem>

                <Link href="/fiyatlar">
                  <div className="px-2.5 py-2 font-medium text-sm text-foreground/80 hover:text-foreground transition-colors cursor-pointer whitespace-nowrap">
                    {t("nav.pricing")}
                  </div>
                </Link>

                <Link href="/indir">
                  <div className="px-2.5 py-2 font-medium text-sm text-foreground/80 hover:text-foreground transition-colors cursor-pointer whitespace-nowrap">
                    İndir
                  </div>
                </Link>

                <DropdownNavItem title={t("nav.partners")}>
                  <ul className="grid w-[300px] gap-3 p-4">
                    {partners.map((item) => (
                      <ListItem key={item.titleKey} title={t(item.titleKey)} href={item.href} icon={item.icon} />
                    ))}
                  </ul>
                </DropdownNavItem>

                <DropdownNavItem title={t("nav.resources")}>
                  <ul className="grid w-[300px] gap-3 p-4">
                    {resources.map((item) => (
                      <ListItem key={item.titleKey} title={t(item.titleKey)} href={item.href} icon={item.icon} />
                    ))}
                  </ul>
                </DropdownNavItem>

                <Link href="/basari-hikayeleri">
                  <div className="px-2.5 py-2 font-medium text-sm text-foreground/80 hover:text-foreground transition-colors cursor-pointer whitespace-nowrap">
                    {t("nav.successStories")}
                  </div>
                </Link>
              </div>
            </div>

            {/* Buttons - Right Aligned */}
            <div className="hidden lg:flex items-center gap-0.5 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Dil seç">
                    <Languages className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLanguage("tr")} className={language === "tr" ? "font-bold" : ""}>
                    🇹🇷 Türkçe
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage("en")} className={language === "en" ? "font-bold" : ""}>
                    🇬🇧 English
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={toggleDarkMode}
                aria-label={isDarkMode ? t("theme.toggleToLight") : t("theme.toggleToDark")}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <Link href="/giris">
                <Button variant="ghost" className="font-semibold text-sm px-3">{t("nav.login")}</Button>
              </Link>
              <Link href="/giris">
                <Button className="rounded-full px-5 text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 whitespace-nowrap">
                  {t("nav.getStarted")}
                </Button>
              </Link>
            </div>

            {/* Mobile Toggle */}
            <div className="lg:hidden ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                aria-label={isDarkMode ? t("theme.toggleToLight") : t("theme.toggleToDark")}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="text-left">{t("nav.mobileMenu")}</SheetTitle>
                  </SheetHeader>

                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      variant={language === "tr" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setLanguage("tr")}
                    >
                      🇹🇷 Türkçe
                    </Button>
                    <Button
                      variant={language === "en" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setLanguage("en")}
                    >
                      🇬🇧 English
                    </Button>
                  </div>

                  <div className="flex flex-col gap-2 mt-6">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="business">
                        <AccordionTrigger>{t("nav.businessTypes")}</AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 gap-2 pl-4">
                            {businessTypes.map((item) => (
                              <MobileLink key={item.titleKey} href={item.href} icon={item.icon} onClick={() => setIsOpen(false)}>
                                {t(item.titleKey)}
                              </MobileLink>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="features">
                        <AccordionTrigger>{t("nav.features")}</AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 gap-2 pl-4">
                            {features.map((item) => (
                              <MobileLink key={item.titleKey} href={item.href} icon={item.icon} onClick={() => setIsOpen(false)}>
                                {t(item.titleKey)}
                              </MobileLink>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="about">
                        <AccordionTrigger>{t("nav.about")}</AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 gap-2 pl-4">
                            {about.map((item) => (
                              <MobileLink key={item.titleKey} href={item.href} icon={item.icon} onClick={() => setIsOpen(false)}>
                                {t(item.titleKey)}
                              </MobileLink>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="pricing">
                        <AccordionTrigger>{t("nav.pricing")}</AccordionTrigger>
                        <AccordionContent>
                          <Link href="/fiyatlar" onClick={() => setIsOpen(false)} className="block py-2 px-4 hover:bg-accent rounded-md transition-colors">
                            {t("nav.pricing")}
                          </Link>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="download">
                        <AccordionTrigger>İndir</AccordionTrigger>
                        <AccordionContent>
                          <Link href="/indir" onClick={() => setIsOpen(false)} className="block py-2 px-4 hover:bg-accent rounded-md transition-colors">
                            İndir
                          </Link>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="partners">
                        <AccordionTrigger>{t("nav.partners")}</AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 gap-2 pl-4">
                            {partners.map((item) => (
                              <MobileLink key={item.titleKey} href={item.href} icon={item.icon} onClick={() => setIsOpen(false)}>
                                {t(item.titleKey)}
                              </MobileLink>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="resources">
                        <AccordionTrigger>{t("nav.resources")}</AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 gap-2 pl-4">
                            {resources.map((item) => (
                              <MobileLink key={item.titleKey} href={item.href} icon={item.icon} onClick={() => setIsOpen(false)}>
                                {t(item.titleKey)}
                              </MobileLink>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <Link href="/basari-hikayeleri" onClick={() => setIsOpen(false)}>
                        <div className="flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline border-b">
                          {t("nav.successStories")}
                        </div>
                      </Link>
                    </Accordion>

                    <div className="mt-6 flex flex-col gap-3">
                      <Link href="/giris" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full h-12 text-lg">{t("nav.login")}</Button>
                      </Link>
                      <Link href="/giris" onClick={() => setIsOpen(false)}>
                        <Button className="w-full h-12 text-lg">{t("nav.getStarted")}</Button>
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}

const DropdownNavItem = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="relative group px-2.5 py-2">
    <button className="flex items-center gap-1 font-medium text-sm text-foreground/80 hover:text-foreground transition-colors outline-none whitespace-nowrap">
      {title}
      <ChevronDown className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:rotate-180" />
    </button>
    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
      <div className="bg-background/95 backdrop-blur-md border border-border/50 rounded-xl shadow-xl overflow-hidden ring-1 ring-black/5">
        {children}
      </div>
    </div>
  </div>
);

const ListItem = ({ className, title, children, icon: Icon, href, ...props }: any) => {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group/item",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-primary/70 group-hover/item:text-white transition-colors" />}
          <div className="text-sm font-medium leading-none">{title}</div>
        </div>
        {children && <p className="line-clamp-2 text-sm leading-snug text-muted-foreground mt-1">
          {children}
        </p>}
      </Link>
    </li>
  );
};

const MobileLink = ({ children, icon: Icon, href, onClick }: any) => (
  <Link href={href} onClick={onClick}>
    <div className="flex items-center gap-3 py-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer">
      {Icon && <Icon className="w-4 h-4" />}
      <span className="text-sm font-medium">{children}</span>
    </div>
  </Link>
);
