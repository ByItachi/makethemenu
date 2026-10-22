import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, AlertCircle, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface License {
  id: number;
  code: string;
  type: string;
  status: string;
  business: string;
  expiry: string;
}

interface LicenseActivity {
  id: number;
  action: string;
  code: string;
  date: string;
  details: string;
}

export default function AdminLicenses() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  
  const [newLicenseType, setNewLicenseType] = useState("Basic");
  const [newBusinessName, setNewBusinessName] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: licenses } = useQuery<License[]>({
    queryKey: ["/api/admin/licenses"],
  });

  const { data: activities } = useQuery<LicenseActivity[]>({
    queryKey: ["/api/admin/license-activities"],
  });

  const createLicenseMutation = useMutation({
    mutationFn: async (data: { type: string; business: string; expiry: string; code: string }) => {
      const response = await fetch("/api/admin/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create license");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/licenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/license-activities"] });
      setIsDialogOpen(false);
      setNewBusinessName("");
      toast({
        title: "Başarılı",
        description: "Yeni lisans başarıyla oluşturuldu.",
      });
    },
  });

  const updateLicenseMutation = useMutation({
    mutationFn: async (data: License) => {
      const response = await fetch("/api/admin/licenses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update license");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/licenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/license-activities"] });
      setIsEditOpen(false);
      setSelectedLicense(null);
      toast({
        title: "Başarılı",
        description: "Lisans güncellendi.",
      });
    },
  });

  const deleteLicenseMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/licenses?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete license");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/licenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/license-activities"] });
      toast({
        title: "Başarılı",
        description: "Lisans silindi.",
      });
    },
  });

  const handleCreateLicense = () => {
    if (!newBusinessName) {
        toast({
            title: "Hata",
            description: "Lütfen bir işletme adı giriniz.",
            variant: "destructive"
        });
        return;
    }

    const randomCode = `L-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date();
    const expiryDate = new Date(today.setFullYear(today.getFullYear() + 1)).toISOString().split('T')[0];

    createLicenseMutation.mutate({
      type: newLicenseType,
      business: newBusinessName,
      expiry: expiryDate,
      code: randomCode,
    });
  };

  const handleEditClick = (license: License) => {
    setSelectedLicense({ ...license });
    setIsEditOpen(true);
  };

  const handleUpdateLicense = () => {
    if (selectedLicense) {
      updateLicenseMutation.mutate(selectedLicense);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Lisanslar</h1>
            <p className="text-muted-foreground mt-1">İşletme lisans yönetimi ve takibi</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Yeni Lisans Oluştur
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Yeni Lisans Oluştur</DialogTitle>
                <DialogDescription>
                  Yeni bir işletme için lisans kodu oluşturun.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-1.5 sm:gap-4">
                  <Label htmlFor="business" className="sm:text-right">
                    İşletme
                  </Label>
                  <Input
                    id="business"
                    placeholder="İşletme Adı"
                    className="col-span-3"
                    value={newBusinessName}
                    onChange={(e) => setNewBusinessName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-1.5 sm:gap-4">
                  <Label htmlFor="type" className="sm:text-right">
                    Paket
                  </Label>
                  <Select value={newLicenseType} onValueChange={setNewLicenseType}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Paket Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Basic">Basic</SelectItem>
                      <SelectItem value="Pro">Pro</SelectItem>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateLicense} disabled={createLicenseMutation.isPending}>
                  {createLicenseMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Lisans Düzenle</DialogTitle>
                <DialogDescription>Seçili lisansın işletme, paket ve durum bilgilerini güncelleyin.</DialogDescription>
              </DialogHeader>
              {selectedLicense && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-1.5 sm:gap-4">
                    <Label htmlFor="edit-business" className="sm:text-right">
                      İşletme
                    </Label>
                    <Input
                      id="edit-business"
                      value={selectedLicense.business}
                      onChange={(e) => setSelectedLicense({ ...selectedLicense, business: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-1.5 sm:gap-4">
                    <Label htmlFor="edit-type" className="sm:text-right">
                      Paket
                    </Label>
                    <Select 
                      value={selectedLicense.type} 
                      onValueChange={(val) => setSelectedLicense({ ...selectedLicense, type: val })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Paket Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Basic">Basic</SelectItem>
                        <SelectItem value="Pro">Pro</SelectItem>
                        <SelectItem value="Enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-1.5 sm:gap-4">
                    <Label htmlFor="edit-status" className="sm:text-right">
                      Durum
                    </Label>
                     <Select 
                      value={selectedLicense.status} 
                      onValueChange={(val) => setSelectedLicense({ ...selectedLicense, status: val })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Durum Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Aktif</SelectItem>
                        <SelectItem value="Pending">Beklemede</SelectItem>
                        <SelectItem value="Inactive">Pasif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button onClick={handleUpdateLicense} disabled={updateLicenseMutation.isPending}>
                  {updateLicenseMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Lisans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{licenses?.length || 0}</div>
              <div className="flex items-center text-sm text-green-600 mt-1">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span>Aktif</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Yaklaşan Yenilemeler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <div className="flex items-center text-sm text-orange-600 mt-1">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>30 gün içinde</span>
              </div>
            </CardContent>
          </Card>
          <Card>
             <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tahmini Gelir</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₺124,500</div>
              <div className="flex items-center text-sm text-green-600 mt-1">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span>Bu ay</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Lisans Listesi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {licenses?.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">Henüz lisans bulunmuyor.</div>
                            ) : (
                                licenses?.map((license) => (
                                    <div key={license.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {license.code.substring(0, 2)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{license.business}</p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Badge variant="outline" className="font-mono text-xs">{license.code}</Badge>
                                                    <span>•</span>
                                                    <span>{license.type}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden sm:block">
                                                <Badge className={license.status === 'Active' ? 'bg-green-600' : 'bg-muted-foreground/50'}>
                                                    {license.status === 'Active' ? 'Aktif' : license.status}
                                                </Badge>
                                                <p className="text-xs text-muted-foreground mt-1">Bitiş: {license.expiry}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(license)}>
                                                    <Pencil className="h-4 w-4 text-blue-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                                    if (confirm("Bu lisansı silmek istediğinize emin misiniz?")) {
                                                        deleteLicenseMutation.mutate(license.id);
                                                    }
                                                }}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-1">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Son Hareketler
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                         {activities && activities.length > 0 ? (
                            <div className="relative border-l border-border ml-3 space-y-6 pb-2">
                                {activities.map((activity) => (
                                    <div key={activity.id} className="ml-6 relative">
                                        <span className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background ring-2 ring-border"></span>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-foreground">{activity.details}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{activity.action}</Badge>
                                                <span className="text-xs text-muted-foreground">{activity.date}</span>
                                            </div>
                                            <span className="text-xs font-mono text-muted-foreground/70 mt-1">{activity.code}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                <FileText className="h-10 w-10 mb-2 opacity-20" />
                                <p>Henüz görüntülenecek veri yok</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </AdminLayout>
  );
}
