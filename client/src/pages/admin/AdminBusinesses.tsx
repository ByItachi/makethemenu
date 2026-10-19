import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Calendar, Building2, Store, Plus, Pencil, Trash2, MoreVertical, Clock } from "lucide-react";
import AdminLayout from "./AdminLayout";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  status: "active" | "pending" | "inactive";
  joinedAt: string;
  license?: string;
  licenseExpiry?: string;
}

export default function AdminBusinesses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [viewingRestaurant, setViewingRestaurant] = useState<Restaurant | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState("Restoran");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<"active" | "pending" | "inactive">("active");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: restaurants, isLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/admin/restaurants"],
  });

  const createMutation = useMutation({
    mutationFn: async (newRestaurant: Partial<Restaurant>) => {
      const response = await fetch("/api/admin/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRestaurant),
      });
      if (!response.ok) throw new Error("Failed to create restaurant");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/restaurants"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Başarılı", description: "İşletme başarıyla eklendi." });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (restaurant: Restaurant) => {
      const response = await fetch("/api/admin/restaurants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(restaurant),
      });
      if (!response.ok) throw new Error("Failed to update restaurant");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/restaurants"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Başarılı", description: "İşletme güncellendi." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/restaurants?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete restaurant");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/restaurants"] });
      toast({ title: "Başarılı", description: "İşletme silindi." });
    },
  });

  const resetForm = () => {
    setName("");
    setType("Restoran");
    setAddress("");
    setStatus("active");
    setEditingRestaurant(null);
  };

  const handleEdit = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setName(restaurant.name);
    setType(restaurant.type);
    setAddress(restaurant.address);
    setStatus(restaurant.status);
    setIsDialogOpen(true);
  };

  const handleView = (restaurant: Restaurant) => {
    setViewingRestaurant(restaurant);
    setIsDetailsOpen(true);
  };

  const handleSubmit = () => {
    if (!name || !address) {
      toast({ title: "Hata", description: "Lütfen tüm alanları doldurun.", variant: "destructive" });
      return;
    }

    if (editingRestaurant) {
      updateMutation.mutate({
        ...editingRestaurant,
        name,
        type,
        address,
        status,
      });
    } else {
      createMutation.mutate({
        name,
        type,
        address,
        status,
      });
    }
  };

  const uniqueCities = Array.from(new Set(restaurants?.map(r => r.city).filter(Boolean))) as string[];

  const filteredRestaurants = restaurants?.filter((r) =>
    (r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.address.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedCity === "all" || r.city === selectedCity)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
      case "inactive":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      default:
        return "bg-muted/60 text-muted-foreground hover:bg-muted";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "Aktif";
      case "pending": return "Beklemede";
      case "inactive": return "Pasif";
      default: return status;
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">İşletme Listesi</h1>
            <p className="text-muted-foreground mt-1">Sistemdeki restoran ve kafelerin yönetimi</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto flex-wrap">
             <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm flex-1 md:flex-none">
                <Search className="h-5 w-5 text-muted-foreground/70" />
                <Input
                  placeholder="Restoran ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-none shadow-none focus-visible:ring-0 w-full md:w-64"
                />
              </div>
              
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full sm:w-[180px] bg-white">
                  <SelectValue placeholder="Şehir Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Şehirler</SelectItem>
                  {uniqueCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Yeni İşletme
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingRestaurant ? "İşletmeyi Düzenle" : "Yeni İşletme Ekle"}</DialogTitle>
                    <DialogDescription>
                      İşletme bilgilerini aşağıdan yönetebilirsiniz.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-1.5 sm:gap-4">
                      <Label htmlFor="name" className="sm:text-right">İsim</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-1.5 sm:gap-4">
                      <Label htmlFor="type" className="sm:text-right">Tip</Label>
                      <Select value={type} onValueChange={setType}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Tip Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Restoran">Restoran</SelectItem>
                          <SelectItem value="Kafe">Kafe</SelectItem>
                          <SelectItem value="Büfe">Büfe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-1.5 sm:gap-4">
                      <Label htmlFor="address" className="sm:text-right">Adres</Label>
                      <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-1.5 sm:gap-4">
                      <Label htmlFor="status" className="sm:text-right">Durum</Label>
                      <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Durum Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Aktif</SelectItem>
                          <SelectItem value="pending">Beklemede</SelectItem>
                          <SelectItem value="inactive">Pasif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                      {createMutation.isPending || updateMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam İşletme</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{restaurants?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Kayıtlı restoran ve kafe</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif İşletmeler</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {restaurants?.filter(r => r.status === "active").length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Şu an hizmet verenler</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bekleyen İşletmeler</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {restaurants?.filter(r => r.status === "pending").length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Onay bekleyen başvurular</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          {isLoading ? (
            <div className="text-center py-10">Yükleniyor...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredRestaurants?.map((restaurant) => (
                <Card key={restaurant.id} className="hover:shadow-md transition-shadow group relative">
                  <div className="absolute top-4 right-4 z-10">
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(restaurant)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => {
                            if(confirm('Silmek istediğinize emin misiniz?')) {
                                deleteMutation.mutate(restaurant.id);
                            }
                        }}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4 pr-8">
                      <div className="flex items-center gap-3">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${restaurant.type === 'Restoran' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                          {restaurant.type === 'Restoran' ? <Building2 className="h-6 w-6" /> : <Store className="h-6 w-6" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                          <p className="text-sm text-muted-foreground">{restaurant.type}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={getStatusColor(restaurant.status)}>
                        {getStatusText(restaurant.status)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-foreground/80">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground/70" />
                        <span>{restaurant.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground/70" />
                        <span>Katılım: {new Date(restaurant.joinedAt).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" type="button" className="w-full" onClick={(e) => { e.stopPropagation(); handleView(restaurant); }}>Detaylar</Button>
                      <Button size="sm" type="button" className="w-full" onClick={(e) => { e.stopPropagation(); handleEdit(restaurant); }}>Yönet</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>İşletme Detayları</DialogTitle>
              <DialogDescription>
                {viewingRestaurant?.name} için detaylı bilgiler.
              </DialogDescription>
            </DialogHeader>
            {viewingRestaurant && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-1.5 sm:gap-4">
                <Label className="sm:text-right font-bold">İsim:</Label>
                <div className="col-span-3">{viewingRestaurant.name}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-1.5 sm:gap-4">
                <Label className="sm:text-right font-bold">Tip:</Label>
                <div className="col-span-3">{viewingRestaurant.type}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-1.5 sm:gap-4">
                <Label className="sm:text-right font-bold">Adres:</Label>
                <div className="col-span-3">{viewingRestaurant.address}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-1.5 sm:gap-4">
                <Label className="sm:text-right font-bold">Durum:</Label>
                <div className="col-span-3">
                    <Badge variant="outline" className={getStatusColor(viewingRestaurant.status)}>
                        {getStatusText(viewingRestaurant.status)}
                    </Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-1.5 sm:gap-4">
                <Label className="sm:text-right font-bold">Katılım:</Label>
                <div className="col-span-3">{viewingRestaurant.joinedAt ? new Date(viewingRestaurant.joinedAt).toLocaleDateString('tr-TR') : '-'}</div>
              </div>
               <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-1.5 sm:gap-4">
                <Label className="sm:text-right font-bold">ID:</Label>
                <div className="col-span-3">{viewingRestaurant.id}</div>
              </div>
            </div>
            )}
            <DialogFooter>
              <Button type="button" onClick={() => setIsDetailsOpen(false)}>Kapat</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
