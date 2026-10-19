import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, MonitorDown, HardDrive, Cpu, ShieldCheck, Terminal } from "lucide-react";

const DOWNLOAD_URL = "/downloads/MakeTheMenu-Setup-1.0.1.exe";

const REQUIREMENTS = [
  { icon: MonitorDown, label: "İşletim sistemi", value: "Windows 10 / 11 (64-bit)" },
  { icon: HardDrive, label: "Disk alanı", value: "En az 400 MB" },
  { icon: Cpu, label: "Bellek", value: "4 GB RAM önerilir" },
  { icon: ShieldCheck, label: "Lisans", value: "Ücretsiz indir, kurduktan sonra oturum aç" },
];

const STEPS = [
  {
    title: "Kurulum dosyasını indirin",
    detail: "Aşağıdaki buton ile Windows kurulumunu (yaklaşık 93 MB) bilgisayarınıza indirin.",
  },
  {
    title: "Kurulumu çalıştırın",
    detail: "İndirilen MakeTheMenu-Setup-1.0.1.exe dosyasını çalıştırın; kurulum sihirbazı adımlarını izleyin.",
  },
  {
    title: "Hesabınızla giriş yapın",
    detail: "Uygulama açıldığında web panel hesabınızla (örn. demo@makethemenu.com) giriş yapın.",
  },
];

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Masaüstü Uygulamayı İndir</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              MakeTheMenu POS'u Windows'a kurun; internet kesilse bile kasa, masa ve adisyon
              işlemleriniz kesintisiz devam etsin.
            </p>
            <Button size="lg" className="h-14 px-8 text-base" asChild>
              <a href={DOWNLOAD_URL} download="MakeTheMenu-Setup-1.0.1.exe">
                <Download className="h-5 w-5" />
                Windows için indir (v1.0.1)
              </a>
            </Button>
          </div>

          <Card className="max-w-3xl mx-auto mb-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
              {REQUIREMENTS.map((r) => (
                <div key={r.label} className="flex items-start gap-3">
                  <r.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{r.label}</p>
                    <p className="text-sm text-muted-foreground">{r.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="max-w-3xl mx-auto grid gap-4">
            {STEPS.map((s, i) => (
              <Card key={s.title}>
                <div className="flex items-start gap-4 p-5">
                  <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium">{s.title}</p>
                    <p className="text-sm text-muted-foreground">{s.detail}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <p className="max-w-3xl mx-auto mt-8 text-xs text-muted-foreground flex items-start gap-2">
            <Terminal className="h-4 w-4 shrink-0 mt-0.5" />
            Kurulum sihirbazı Windows SmartScreen uyarısı verebilir; bu, uygulamanın henüz
            sertifikalanmamış olması içindir. "Yine de çalıştır" ile devam edebilirsiniz.
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
