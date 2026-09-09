import { UtensilsCrossed, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export function Topbar() {
  const { t } = useLanguage();

  return (
    <div className="bg-[#FFF5F5] dark:bg-background w-full py-2 border-b border-primary/10 relative">
      <div className="site-container grid grid-cols-1 sm:grid-cols-3 items-center text-xs sm:text-sm font-medium text-primary/80">

        {/* Empty col for spacing to allow center alignment of middle col */}
        <div className="hidden sm:block"></div>

        {/* Centered Content */}
        <div className="hidden sm:flex items-center justify-center gap-2 min-w-0 px-2">
          <UtensilsCrossed className="w-4 h-4 text-primary shrink-0" />
          <span className="text-primary font-bold whitespace-nowrap">{t("topbar.brand")}</span>
          <span className="text-gray-600 dark:text-muted-foreground hidden lg:inline truncate">{t("topbar.tagline")}</span>
        </div>

        {/* Right Side */}
        <div className="flex items-center justify-center sm:justify-end gap-4 col-span-1 sm:col-span-1 min-w-0">
          <a href="tel:+902167060624" className="hover:text-primary transition-colors whitespace-nowrap">
            +90 (216) 706 06 24
          </a>

          <span className="text-gray-400 hidden sm:inline">{t("topbar.or")}</span>

          <Button
            variant="outline"
            size="sm"
            className="h-7 rounded-full border-primary/20 text-primary hover:bg-primary/5 hover:text-primary text-xs px-4"
          >
            <Phone className="w-3 h-3 mr-2" />
            {t("topbar.callUs")}
          </Button>
        </div>
      </div>
    </div>
  );
}
