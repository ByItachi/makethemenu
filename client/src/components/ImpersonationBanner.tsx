import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, LogOut } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

type Me = { id: number; email?: string; fullName?: string; impersonatedBy?: number | null };

export function ImpersonationBanner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: me } = useQuery<Me>({
    queryKey: ["/api/auth/user"],
    enabled: !!user,
    retry: false,
  });

  const stop = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/stop-impersonating");
      return res.json();
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/admin";
    },
  });

  if (!user || !me?.impersonatedBy) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[90] bg-amber-500 text-black text-sm font-medium">
      <div className="site-container flex items-center justify-between gap-3 py-1.5 px-4">
        <span className="flex items-center gap-2 min-w-0">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span className="truncate">
            Temsilci oturumu: {me.fullName || me.email} olarak girildi
          </span>
        </span>
        <button
          onClick={() => stop.mutate()}
          disabled={stop.isPending}
          className="flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-1 hover:bg-black/10 disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          Yöneticiye Dön
        </button>
      </div>
    </div>
  );
}
