import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Building2, CreditCard, Activity } from "lucide-react";
import WorldMap from "@/components/WorldMap";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Restaurant {
  id: number;
  name: string;
  type: string;
  address: string;
  city?: string;
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  status: string;
  license?: string;
  licenseCode?: string;
  licenseExpiry?: string;
}

interface PendingPayment {
  id: number;
  businessName: string;
  amount: string;
  currency: string;
  date: string;
  plan: string;
  status: string;
}

export default function AdminOverview() {
  const [selectedCity, setSelectedCity] = useState<string>("all");

  const { data: restaurants } = useQuery<Restaurant[]>({
    queryKey: ["/api/admin/restaurants"],
  });

  const { data: pendingPayments } = useQuery<PendingPayment[]>({
    queryKey: ["/api/admin/pending-payments"],
  });

  const cities = useMemo(() => {
    if (!restaurants) return [];
    const uniqueCities = Array.from(new Set(restaurants.map(r => r.city).filter(Boolean)));
    return uniqueCities.sort();
  }, [restaurants]);

  const filteredRestaurants = useMemo(() => {
    if (!restaurants) return [];
    if (selectedCity === "all") return restaurants;
    return restaurants.filter(r => r.city === selectedCity);
  }, [restaurants, selectedCity]);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Genel Bakış</h1>
          <p className="text-muted-foreground mt-1">Sistem durumu ve özet istatistikler</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">+20.1% geçen aydan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif İşletmeler</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{restaurants?.filter(r => r.status === 'active').length || 150}</div>
              <p className="text-xs text-muted-foreground">+4 yeni işletme</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aylık Ciro</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₺45,231.89</div>
              <p className="text-xs text-muted-foreground">+19% geçen aydan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sistem Sağlığı</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">%99.9</div>
              <p className="text-xs text-muted-foreground">Tüm servisler aktif</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bekleyen Ödemeler</CardTitle>
            <CardDescription>Onay bekleyen son ödemeler</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingPayments?.map(payment => (
                <div key={payment.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                      {payment.businessName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{payment.businessName}</p>
                      <p className="text-sm text-muted-foreground">{payment.plan} Planı</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{payment.amount} {payment.currency}</p>
                    <p className="text-sm text-muted-foreground">{payment.date}</p>
                  </div>
                </div>
              ))}
              {(!pendingPayments || pendingPayments.length === 0) && (
                <p className="text-muted-foreground text-center py-4">Bekleyen ödeme bulunmuyor.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>İşletme Haritası</CardTitle>
                        <CardDescription>Dünya genelindeki işletmelerin konumu</CardDescription>
                    </div>
                    <div className="w-full md:w-[250px]">
                        <Select value={selectedCity} onValueChange={setSelectedCity}>
                            <SelectTrigger>
                                <SelectValue placeholder="Şehir Filtrele" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Şehirler</SelectItem>
                                {cities.map(city => (
                                    <SelectItem key={city} value={city as string}>{city}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <WorldMap restaurants={filteredRestaurants} />
            </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
