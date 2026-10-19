import { useQuery } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, Download } from "lucide-react";

type PaymentRow = {
  id: number;
  restaurantId: number;
  kind: string;
  planCode: string;
  interval: string;
  amount: string;
  taxAmount: string;
  status: string;
  invoiceNo: string | null;
  paidAt: string | null;
  createdAt: string;
};

const money = (v: number | string) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(v));

export default function AdminInvoices() {
  const payments = useQuery<PaymentRow[]>({ queryKey: ["/api/admin/payments"] });
  const rows = (payments.data ?? []).filter((r) => r.invoiceNo && r.status === "succeeded");

  const downloadCsv = () => {
    const head = "fatura_no,tarih,isletme,plan,donem,tutar,kdv,durum";
    const lines = rows.map((r) =>
      [r.invoiceNo, r.paidAt ?? r.createdAt, `#${r.restaurantId}`, r.planCode, r.interval === "yearly" ? "yillik" : "aylik", r.amount, r.taxAmount, r.status].join(","),
    );
    const blob = new Blob(["\ufeff" + [head, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `faturalar-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 md:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Faturalar</h1>
            <p className="text-muted-foreground mt-1">Kesilen faturalar ve raporlar</p>
          </div>
          <Button disabled={rows.length === 0} onClick={downloadCsv}>
            <Download className="h-4 w-4 mr-2" />
            Rapor İndir (CSV)
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Son Faturalar</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            {rows.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Görüntülenecek fatura bulunamadı</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-3">Fatura No</th><th className="py-2 pr-3">Tarih</th><th className="py-2 pr-3">İşletme</th>
                    <th className="py-2 pr-3">Plan</th><th className="py-2 pr-3">Tutar</th><th className="py-2">KDV</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-mono">{r.invoiceNo}</td>
                      <td className="py-2 pr-3">{new Date(r.paidAt ?? r.createdAt).toLocaleDateString("tr-TR")}</td>
                      <td className="py-2 pr-3">#{r.restaurantId}</td>
                      <td className="py-2 pr-3">{r.planCode} ({r.interval === "yearly" ? "yıllık" : "aylık"})</td>
                      <td className="py-2 pr-3">{money(r.amount)}</td>
                      <td className="py-2">{money(r.taxAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
