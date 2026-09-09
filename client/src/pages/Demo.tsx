import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function Demo() {
  useEffect(() => {
    const mockUser = {
      id: "demo-user-id",
      email: "demo@makethemenu.com",
      firstName: "Demo",
      lastName: "User",
      profileImageUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem("demo_user", JSON.stringify(mockUser));
    window.location.href = "/panel";
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
