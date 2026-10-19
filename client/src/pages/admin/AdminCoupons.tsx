import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type Coupon = {
  id: number;
  code: string;
  percentOff: number | null;
  amountOff: string | null;
  validUntil: string | null;
  maxRedemptions: number | null;
  redemptions: number;
  isActive: boolean;
};

export default function AdminCoupons() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const coupons = useQuery<Coupon[]>({ queryKey: ["/api/admin/coupons"] });

  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"percent" | "amount">("percent");
  const [percentOff, setPercentOff] = useState("10");
  const [amountOff, setAmountOff] = useState("50");
  const [validDays, setValidDays] = useState("30");
  const [maxRedemptions, setMaxRedemptions] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const body = {
        code: code.trim().toUpperCase(),
        percentOff: kind === "percent" ? Number(percentOff) : null,
        amountOff: kind === "amount" ? Number(amountOff) : null,
        validDays: validDays.trim() ? Number(validDays) : null,
        maxRedemptions: maxRedemptions.trim() ? Number(maxRedemptions) : null,
      };
      await apiRequest("POST", "/api/admin/coupons", body);
    },
    onSuccess: () => {
      toast({ title: "Kupon oluşturuldu" });
      setCode("");
      qc.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
    },
    onError: (e: Error) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  const toggle = useMutation({
    mutationFn: async (c: Coupon) => apiRequest("PATCH", `/api/admin/coupons/${c.id}`, { isActive: !c.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/coupons"] }),
    onError: (e: Error) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kuponlar</h1>
          <p className="text-muted-foreground mt-1">Abonelik ödemelerinde geçerli indirim kodları</p>
        </div>

        <Card>
          <CardHeader><CardTitle>Yeni kupon</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6 items-end">
            <div className="space-y-1">
              <Label htmlFor="coupon-code">Kod</Label>
              <Input id="coupon-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="YAZ2026" maxLength={32} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="coupon-kind">İndirim türü</Label>
              <select
                id="coupon-kind"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={kind}
                onChange={(e) => setKind(e.target.value as "percent" | "amount")}
              >
                <option value="percent">Yüzde (%)</option>
                <option value="amount">Tutar (TL)</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="coupon-value">{kind === "percent" ? "Yüzde" : "Tutar (TL)"}</Label>
              <Input id="coupon-value" type="number" min={1} value={kind === "percent" ? percentOff : amountOff} onChange={(e) => (kind === "percent" ? setPercentOff(e.target.value) : setAmountOff(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="coupon-days">Geçerlilik (gün)</Label>
              <Input id="coupon-days" type="number" min={1} value={validDays} onChange={(e) => setValidDays(e.target.value)} placeholder="süresiz için boş" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="coupon-max">Kullanım limiti</Label>
              <Input id="coupon-max" type="number" min={1} value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} placeholder="sınırsız için boş" />
            </div>
            <Button disabled={create.isPending || !code.trim()} onClick={() => create.mutate()}>Oluştur</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Kuponlar (son 200)</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="py-2 pr-3">Kod</th><th className="py-2 pr-3">İndirim</th><th className="py-2 pr-3">Geçerlilik</th>
                  <th className="py-2 pr-3">Kullanım</th><th className="py-2 pr-3">Durum</th><th className="py-2">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {(coupons.data ?? []).map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">{c.code}</td>
                    <td className="py-2 pr-3">{c.percentOff != null ? `%${c.percentOff}` : c.amountOff != null ? `${c.amountOff} TL` : "—"}</td>
                    <td className="py-2 pr-3">{c.validUntil ? new Date(c.validUntil).toLocaleDateString("tr-TR") : "süresiz"}</td>
                    <td className="py-2 pr-3">{c.redemptions}{c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ""}</td>
                    <td className="py-2 pr-3"><Badge variant={c.isActive ? "secondary" : "destructive"}>{c.isActive ? "Aktif" : "Pasif"}</Badge></td>
                    <td className="py-2">
                      <Button size="sm" variant="outline" disabled={toggle.isPending} onClick={() => toggle.mutate(c)}>
                        {c.isActive ? "Pasifleştir" : "Aktifleştir"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
