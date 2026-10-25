import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SectorIcon, moduleLabel } from "@/lib/sector-icons";
import { Blocks, ChevronDown, Search } from "lucide-react";

interface SectorProfile {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  modules: string[];
  orderFields: unknown[] | null;
  orderStatuses: unknown[] | null;
  dashboardCards: string[] | null;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

export default function AdminSectors() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isLoading } = useQuery<{ sectors: SectorProfile[] }>({
    queryKey: ["/api/admin/sectors"],
  });

  const sectors = useMemo(() => data?.sectors ?? [], [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr");
    if (!q) return sectors;
    return sectors.filter(
      (s) =>
        s.name.toLocaleLowerCase("tr").includes(q) ||
        s.slug.toLocaleLowerCase("tr").includes(q) ||
        s.modules.some((m) => moduleLabel(m).toLocaleLowerCase("tr").includes(q))
    );
  }, [sectors, search]);

  const updateSector = async (sector: SectorProfile, patch: Partial<SectorProfile>) => {
    setSavingId(sector.id);
    try {
      await apiRequest("PUT", `/api/admin/sectors/${sector.id}`, { ...sector, ...patch });
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/sectors"] });
      toast({ title: "Kaydedildi", description: `${patch.name ?? sector.name} güncellendi.` });
    } catch (err) {
      toast({
        title: "Hata",
        description: err instanceof Error ? err.message : "Sektör güncellenemedi.",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  const activeCount = sectors.filter((s) => s.isActive).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="pt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Blocks className="w-6 h-6 text-primary" /> Sektörler
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Platformun çalıştığı sektör profilleri: modül seti, sipariş alanları ve durum akışları.
            </p>
          </div>
          <Badge variant="outline" className="text-xs mt-2">
            {activeCount} etkin / {sectors.length} toplam
          </Badge>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sektör veya modül ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {sectors.length === 0
                ? "Henüz sektör tanımlı değil."
                : "Aramanıza uygun sektör bulunamadı."}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((sector) => {
              const expanded = expandedId === sector.id;
              const moduleCount = sector.modules?.length ?? 0;
              return (
                <Card key={sector.id} className="overflow-hidden">
                  <div className="flex flex-wrap items-center gap-4 p-4">
                    <div
                      className={cn(
                        "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg",
                        sector.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}
                    >
                      <SectorIcon name={sector.icon} className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium truncate">{sector.name}</span>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                          {sector.slug}
                        </code>
                        {sector.isFeatured && (
                          <Badge variant="secondary" className="text-xs">Öne çıkan</Badge>
                        )}
                        {!sector.isActive && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">Pasif</Badge>
                        )}
                      </div>
                      {sector.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{sector.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(sector.modules ?? []).slice(0, 6).map((m) => (
                          <Badge key={m} variant="secondary" className="text-[11px] font-normal">
                            {moduleLabel(m)}
                          </Badge>
                        ))}
                        {moduleCount > 6 && (
                          <Badge variant="outline" className="text-[11px] font-normal">
                            +{moduleCount - 6} modül
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-4">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground">Öne çıkan</span>
                        <Switch
                          checked={sector.isFeatured}
                          disabled={savingId === sector.id}
                          onCheckedChange={(v) => updateSector(sector, { isFeatured: v })}
                          aria-label={`${sector.name} öne çıkan`}
                        />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground">Etkin</span>
                        <Switch
                          checked={sector.isActive}
                          disabled={savingId === sector.id}
                          onCheckedChange={(v) => updateSector(sector, { isActive: v })}
                          aria-label={`${sector.name} etkin`}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpandedId(expanded ? null : sector.id)}
                        aria-label={expanded ? "Detayı kapat" : "Detayı aç"}
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                      </Button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="border-t border-border bg-muted/30 p-4 space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            Tüm Modüller ({moduleCount})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {(sector.modules ?? []).map((m) => (
                              <Badge key={m} variant="secondary" className="text-[11px] font-normal">
                                {moduleLabel(m)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            Panel Kartları
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {(sector.dashboardCards ?? []).length === 0 ? (
                              <span className="text-xs text-muted-foreground">Tanımlı değil</span>
                            ) : (
                              (sector.dashboardCards ?? []).map((c) => (
                                <Badge key={c} variant="outline" className="text-[11px] font-normal">
                                  {c}
                                </Badge>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          Sipariş / İş Emri Alanları
                        </p>
                        {(sector.orderFields ?? []).length === 0 ? (
                          <p className="text-xs text-muted-foreground">Ek alan tanımlı değil.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {(sector.orderFields ?? []).map((f, i) => {
                              const field = f as { label?: string; type?: string; unit?: string; required?: boolean };
                              return (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
                                >
                                  {field.label ?? "?"}
                                  {field.type ? (
                                    <span className="text-muted-foreground">({field.type})</span>
                                  ) : null}
                                  {field.unit ? <span className="text-muted-foreground">· {field.unit}</span> : null}
                                  {field.required ? <span className="text-destructive">*</span> : null}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Modül setini ve sipariş alanlarını düzenlemek için{" "}
                        <code className="rounded bg-muted px-1">server/migrations/v12.ts</code> içindeki profil
                        tanımını güncelleyin; yeni sektör eklemek için yeni kayıt eklemek yeterlidir.
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

