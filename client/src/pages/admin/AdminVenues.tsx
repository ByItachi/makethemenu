import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Building2, Calendar, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface Restaurant {
  id: number;
  name: string;
  type: string;
  address: string;
  status: "active" | "pending" | "inactive";
  joinedAt: string;
  license?: string;
  licenseExpiry?: string;
}

export default function AdminVenues() {
  const { data: restaurants, isLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/admin/restaurants"],
  });

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mekanlar</h1>
          <p className="text-gray-500 mt-1">Sistemdeki kayıtlı mekanlar ve lisans durumları</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <p>Yükleniyor...</p>
          ) : (
            restaurants?.map((restaurant) => (
              <Card key={restaurant.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 items-center">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {restaurant.address}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={restaurant.status === "active" ? "default" : "secondary"}
                      className={restaurant.status === "active" ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {restaurant.status === "active" ? "Aktif" : "Beklemede"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">Lisans Tipi</p>
                          <p className="text-xs text-muted-foreground">{restaurant.license || "Standart"}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                        {restaurant.license || "Standart"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="text-sm font-medium">Bitiş Tarihi</p>
                          <p className="text-xs text-muted-foreground">{restaurant.licenseExpiry || "Süresiz"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-medium text-orange-600">
                        <Clock className="h-3 w-3" />
                        {restaurant.licenseExpiry ? "30 Gün Kaldı" : "-"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Son kontrol: Bugün 14:30</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
