import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";

export default function Settings() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

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

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm">
          <h1 className="text-2xl font-display font-bold">Settings</h1>
        </header>

        <main className="flex-1 overflow-auto p-6 max-w-4xl">
           <div className="space-y-6">
             <Card>
               <CardHeader>
                 <CardTitle>Restaurant Profile</CardTitle>
                 <CardDescription>Manage your restaurant details</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label>Restaurant Name</Label>
                     <Input defaultValue="RestoPOS Diner" />
                   </div>
                   <div className="space-y-2">
                     <Label>Phone Number</Label>
                     <Input defaultValue="+1 (555) 123-4567" />
                   </div>
                 </div>
                 <div className="space-y-2">
                   <Label>Address</Label>
                   <Input defaultValue="123 Culinary Ave, Foodie City, FC 90210" />
                 </div>
                 <Button>Save Changes</Button>
               </CardContent>
             </Card>

             <Card>
               <CardHeader>
                 <CardTitle>Appearance</CardTitle>
                 <CardDescription>Customize your interface</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="flex items-center justify-between">
                   <div className="space-y-0.5">
                     <div className="font-medium">Dark Mode</div>
                     <div className="text-sm text-muted-foreground">Switch between light and dark themes</div>
                   </div>
                   <Button variant="outline" size="icon" onClick={toggleTheme}>
                     {theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                   </Button>
                 </div>
               </CardContent>
             </Card>

             <Card>
               <CardHeader>
                 <CardTitle>Account</CardTitle>
                 <CardDescription>You are logged in via Replit Auth</CardDescription>
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
