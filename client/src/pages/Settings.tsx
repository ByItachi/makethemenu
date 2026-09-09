import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface RestaurantProfile {
  name: string;
  phone: string;
  address: string;
  email?: string;
  taxNumber?: string;
  taxOffice?: string;
}

export default function Settings() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form states
  const [profile, setProfile] = useState<RestaurantProfile>({
    name: "",
    phone: "",
    address: "",
    email: "",
    taxNumber: "",
    taxOffice: ""
  });

  const { data: serverProfile, isLoading } = useQuery<RestaurantProfile>({
    queryKey: ["/api/settings/profile"],
  });

  useEffect(() => {
    if (serverProfile) {
      setProfile(serverProfile);
    }
  }, [serverProfile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedProfile: RestaurantProfile) => {
      const response = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProfile),
      });
      if (!response.ok) throw new Error("Failed to update profile");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/profile"] });
      toast({ title: "Başarılı", description: "Restoran bilgileri güncellendi." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Güncelleme başarısız oldu.", variant: "destructive" });
    }
  });

  useEffect(() => {
    // Basic theme toggle logic for demo
    if (document.documentElement.classList.contains('dark')) {
      setTheme('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      document.documentElement.classList.add('dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      setTheme('light');
    }
  };

  const handleSave = () => {
    updateProfileMutation.mutate(profile);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">
        <header className="h-16 border-b flex items-center justify-between px-4 sm:px-6 bg-card/50 backdrop-blur-sm">
          <h1 className="text-xl sm:text-2xl font-display font-bold">Ayarlar</h1>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 max-w-4xl">
           <div className="space-y-6">
             <Card>
               <CardHeader>
                 <CardTitle>Restoran Profili</CardTitle>
                 <CardDescription>Restoran detaylarını yönetin</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 {isLoading ? (
                    <div>Yükleniyor...</div>
                 ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Restoran Adı</Label>
                            <Input 
                                value={profile.name} 
                                onChange={(e) => setProfile({...profile, name: e.target.value})} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Telefon Numarası</Label>
                            <Input 
                                value={profile.phone} 
                                onChange={(e) => setProfile({...profile, phone: e.target.value})} 
                            />
                        </div>
                        </div>
                        <div className="space-y-2">
                        <Label>Adres</Label>
                        <Input 
                            value={profile.address} 
                            onChange={(e) => setProfile({...profile, address: e.target.value})} 
                        />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label>Vergi Numarası</Label>
                                <Input 
                                    value={profile.taxNumber || ""} 
                                    onChange={(e) => setProfile({...profile, taxNumber: e.target.value})} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Vergi Dairesi</Label>
                                <Input 
                                    value={profile.taxOffice || ""} 
                                    onChange={(e) => setProfile({...profile, taxOffice: e.target.value})} 
                                />
                            </div>
                        </div>
                        <Button onClick={handleSave} disabled={updateProfileMutation.isPending}>
                            {updateProfileMutation.isPending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                        </Button>
                    </>
                 )}
               </CardContent>
             </Card>

             <Card>
               <CardHeader>
                 <CardTitle>Görünüm</CardTitle>
                 <CardDescription>Arayüzü özelleştirin</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="flex items-center justify-between">
                   <div className="space-y-0.5">
                     <div className="font-medium">Karanlık Mod</div>
                     <div className="text-sm text-muted-foreground">Açık ve koyu tema arasında geçiş yap</div>
                   </div>
                   <Button variant="outline" size="icon" onClick={toggleTheme}>
                     {theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                   </Button>
                 </div>
               </CardContent>
             </Card>

             <Card>
               <CardHeader>
                 <CardTitle>Hesap</CardTitle>
                 <CardDescription>Replit Auth ile giriş yaptınız</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    {user?.profileImageUrl && (
                      <img src={user.profileImageUrl} alt="Profile" className="h-16 w-16 rounded-full" />
                    )}
                    <div>
                      <p className="font-medium text-lg">{user?.firstName} {user?.lastName}</p>
                      <p className="text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
               </CardContent>
             </Card>
           </div>
        </main>
      </div>
    </div>
  );
}
