import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminInvoices() {
  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Faturalar</h1>
            <p className="text-gray-500 mt-1">Kesilen faturalar ve raporlar</p>
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Rapor İndir
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Son Faturalar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Görüntülenecek fatura bulunamadı</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
