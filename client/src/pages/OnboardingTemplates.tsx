import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ReadyTemplatesGallery } from "@/pages/restoran/online/ReadyTemplatesGallery";
import { useAuth } from "@/hooks/use-auth";

/** Kayıt sonrası ilk giriş: yeni işletme sahibine şablon seçtirir, seçilirse /panel'e gider. */
export default function OnboardingTemplates() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Onboarding adımı yalnızca işletmesi olan oturumlar içindir.
  useEffect(() => {
    if (user && !user.restaurantId) navigate("/panel");
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-muted/40 py-10">
      <div className="site-container max-w-5xl space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">Menünüze bir tasarım seçin</h1>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">
            Aşağıdaki hazır şablonlardan birini seçtiğinizde dijital menünüz bu tasarımla yayınlanır.
            Seçimi sonra panelinizden dilediğiniz zaman değiştirebilirsiniz.
          </p>
        </header>

        <ReadyTemplatesGallery onApplied={() => navigate("/panel")} />

        <div className="flex justify-center pb-10">
          <Button variant="ghost" onClick={() => navigate("/panel")}>
            Şimdilik atla, sonra seçerim
          </Button>
        </div>
      </div>
    </div>
  );
}
