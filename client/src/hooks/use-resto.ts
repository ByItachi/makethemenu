import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { 
  type Table, type InsertTable,
  type Category, type InsertCategory,
  type Product, type InsertProduct,
  type Order, type InsertOrder,
  type OrderWithItems
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// ==========================================
// TABLES HOOKS
// ==========================================

export function useTables() {
  return useQuery({
    queryKey: [api.tables.list.path],
    queryFn: async () => {
      const res = await fetch(api.tables.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tables");
      return api.tables.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: InsertTable) => {
      const res = await fetch(api.tables.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create table");
      return api.tables.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tables.list.path] });
      toast({ title: "Başarılı", description: "Masa oluşturuldu" });
    },
    onError: (error) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    }
  });
}

export function useUpdateTable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertTable>) => {
      const url = buildUrl(api.tables.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update table");
      return api.tables.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tables.list.path] });
      toast({ title: "Başarılı", description: "Masa güncellendi" });
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.tables.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete table");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tables.list.path] });
      toast({ title: "Başarılı", description: "Masa silindi" });
    },
  });
}

// ==========================================
// CATEGORIES HOOKS
// ==========================================

export function useCategories() {
  return useQuery({
    queryKey: [api.categories.list.path],
    queryFn: async () => {
      const res = await fetch(api.categories.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return api.categories.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertCategory) => {
      const res = await fetch(api.categories.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create category");
      return api.categories.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.categories.list.path] });
      toast({ title: "Başarılı", description: "Kategori oluşturuldu" });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.categories.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete category");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.categories.list.path] });
      toast({ title: "Başarılı", description: "Kategori silindi" });
    },
  });
}

// ==========================================
// PRODUCTS HOOKS
// ==========================================

export function useProducts(categoryId?: number) {
  return useQuery({
    queryKey: [api.products.list.path, categoryId],
    queryFn: async () => {
      let url = api.products.list.path;
      if (categoryId) {
        url += `?categoryId=${categoryId}`;
      }
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch products");
      return api.products.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertProduct) => {
      // Ensure price is string for Decimal type in backend if needed, or number if schema allows
      const payload = { ...data, price: Number(data.price) };
      const res = await fetch(api.products.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create product");
      return api.products.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      toast({ title: "Başarılı", description: "Ürün oluşturuldu" });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertProduct>) => {
      const url = buildUrl(api.products.update.path, { id });
      const payload = { ...data };
      if (payload.price) payload.price = String(payload.price);
      
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update product");
      return api.products.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      toast({ title: "Başarılı", description: "Ürün güncellendi" });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.products.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete product");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      toast({ title: "Başarılı", description: "Ürün silindi" });
    },
  });
}

// ==========================================
// ORDERS HOOKS
// ==========================================

export function useOrders(status?: string) {
  return useQuery({
    queryKey: [api.orders.list.path, status],
    queryFn: async () => {
      let url = api.orders.list.path;
      if (status) {
        url += `?status=${status}`;
      }
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return await res.json() as OrderWithItems[];
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { tableId: number | null, items: { productId: number, quantity: number, notes?: string }[] }) => {
      const res = await fetch(api.orders.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create order");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.tables.list.path] }); // Table status might change
      toast({ title: "Başarılı", description: "Sipariş başarıyla oluşturuldu" });
    },
    onError: (error) => {
      toast({ title: "Sipariş Hatası", description: error.message, variant: "destructive" });
    }
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const url = buildUrl(api.orders.updateStatus.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update status");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.tables.list.path] }); // If order paid, table free?
      toast({ title: "Güncellendi", description: "Sipariş durumu güncellendi" });
    },
  });
}
