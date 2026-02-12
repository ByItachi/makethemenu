import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type ContactInput = z.infer<typeof api.contact.submit.input>;

export function useSubmitContact() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: ContactInput) => {
      // Validate with shared schema before sending
      const validated = api.contact.submit.input.parse(data);
      
      const res = await fetch(api.contact.submit.path, {
        method: api.contact.submit.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Bir hata oluştu');
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Mesajınız Gönderildi!",
        description: "En kısa sürede size dönüş yapacağız.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Mesaj gönderilemedi. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    }
  });
}
