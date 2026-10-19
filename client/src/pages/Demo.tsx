import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function Demo() {
  useEffect(() => {
    // Sahte demo oturumu kaldırıldı; gerçek giriş sayfasına yönlendir.
    window.location.href = "/giris";
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground">
      <img
        src="/makethemenu-header.png"
        alt="makethemenu"
        draggable={false}
        className="h-14 w-auto max-w-[220px] object-contain select-none block dark:hidden"
      />
      <img
        src="/makethemenu-footer.png"
        alt="makethemenu"
        draggable={false}
        className="h-14 w-auto max-w-[220px] object-contain select-none hidden dark:block"
      />
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Demo hesabına giriş yapılıyor...</p>
    </div>
  );
}
