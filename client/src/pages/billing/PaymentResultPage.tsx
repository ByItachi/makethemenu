import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

export function PaymentSuccessPage() {
  return (
    <ResultShell
      ok
      title="Ödemeniz alındı"
      description="Aboneliğiniz güncellendi. Plan bilgileriniz işletme ayarları sayfasında görünür."
    />
  );
}

export function PaymentFailedPage() {
  return (
    <ResultShell
      title="Ödeme tamamlanamadı"
      description="Ödeme reddedildi. Kartınızı kontrol edip tekrar deneyebilirsiniz; mevcut planınız değişmedi."
    />
  );
}

function ResultShell({ ok, title, description }: { ok?: boolean; title: string; description: string }) {
  const Icon = ok ? CheckCircle2 : XCircle;
  return (
    <div className="mx-auto max-w-md p-6">
      <Card>
        <CardHeader className="items-center text-center">
          <Icon className={`h-12 w-12 ${ok ? "text-green-600" : "text-destructive"}`} />
          <CardTitle className="mt-2">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/isletme">İşletme ayarlarına dön</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
