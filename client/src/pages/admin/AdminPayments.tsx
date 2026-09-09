import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, DollarSign, Settings, TrendingUp, Clock } from "lucide-react";
import PaymentProvidersConfig from "@/components/admin/PaymentProvidersConfig";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminPayments() {
  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ödemeler</h1>
          <p className="text-gray-500 mt-1">Gelen ve bekleyen ödemeler</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Bu Ay Toplam Ciro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₺124,500</div>
              <div className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                %12.5 artış
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Bekleyen Ödemeler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">₺12,350</div>
              <div className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                3 işlem
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Başarılı Ödemeler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">₺89,200</div>
              <div className="text-xs text-blue-500 mt-1">42 işlem</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Aktif Ödeme Kanalları</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">0</div>
              <div className="text-xs text-purple-500 mt-1">Yapılandırılmamış</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="providers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="providers">Ödeme Sağlayıcıları</TabsTrigger>
            <TabsTrigger value="history">Ödeme Geçmişi</TabsTrigger>
          </TabsList>
          
          <TabsContent value="providers">
            <PaymentProvidersConfig />
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Ödeme Geçmişi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-10 text-gray-500">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Henüz işlem bulunamadı</p>
                  <p className="text-sm mt-2">Ödeme sağlayıcıları yapılandırıldıktan sonra ödeme geçmişi burada görünecektir.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
