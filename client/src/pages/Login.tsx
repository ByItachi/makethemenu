import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed } from "lucide-react";

export default function Login() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute inset-0 z-0 opacity-20 dark:opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="z-10 w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary text-primary-foreground shadow-xl mb-4">
            <UtensilsCrossed className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight">RestoPOS</h1>
          <p className="text-muted-foreground mt-2">Modern Restaurant Management System</p>
        </div>

        <Card className="border-border/50 shadow-2xl backdrop-blur-sm bg-card/80">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Sign in to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full h-12 text-base font-medium" 
              size="lg"
              onClick={handleLogin}
            >
              Log in with Replit
            </Button>
            
            <div className="mt-6 text-center text-xs text-muted-foreground">
              <p>Secure authentication powered by Replit</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
