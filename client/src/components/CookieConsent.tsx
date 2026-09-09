import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";

type CookiePrefs = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

const STORAGE_KEY = "cookieConsent";

function readStoredConsent(): CookiePrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { necessary: true, analytics: !!parsed.analytics, marketing: !!parsed.marketing, preferences: !!parsed.preferences };
  } catch {
    return null;
  }
}

export function CookieConsent() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>({ necessary: true, analytics: false, marketing: false, preferences: false });

  useEffect(() => {
    const stored = readStoredConsent();
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const persist = (next: CookiePrefs) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, decidedAt: new Date().toISOString() }));
    setVisible(false);
    setCustomizeOpen(false);
  };

  const handleAcceptAll = () => persist({ necessary: true, analytics: true, marketing: true, preferences: true });
  const handleRejectAll = () => persist({ necessary: true, analytics: false, marketing: false, preferences: false });
  const handleSaveCustom = () => persist(prefs);

  if (!visible) return null;

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 z-[60] p-4 sm:p-6">
        <div className="site-container">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Cookie className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-base mb-1">{t("cookie.title")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("cookie.description")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={handleRejectAll}>
                {t("cookie.reject")}
              </Button>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setCustomizeOpen(true)}>
                {t("cookie.customize")}
              </Button>
              <Button size="sm" className="flex-1 sm:flex-none" onClick={handleAcceptAll}>
                {t("cookie.accept")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-primary" />
              {t("cookie.customizeTitle")}
            </DialogTitle>
            <DialogDescription>{t("cookie.customizeDescription")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-sm">{t("cookie.necessary")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("cookie.necessaryDesc")}</p>
              </div>
              <Switch checked disabled />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-sm">{t("cookie.analytics")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("cookie.analyticsDesc")}</p>
              </div>
              <Switch
                checked={prefs.analytics}
                onCheckedChange={(checked) => setPrefs((p) => ({ ...p, analytics: checked }))}
              />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-sm">{t("cookie.marketing")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("cookie.marketingDesc")}</p>
              </div>
              <Switch
                checked={prefs.marketing}
                onCheckedChange={(checked) => setPrefs((p) => ({ ...p, marketing: checked }))}
              />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-sm">{t("cookie.preferences")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("cookie.preferencesDesc")}</p>
              </div>
              <Switch
                checked={prefs.preferences}
                onCheckedChange={(checked) => setPrefs((p) => ({ ...p, preferences: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button className="w-full" onClick={handleSaveCustom}>
              {t("cookie.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
