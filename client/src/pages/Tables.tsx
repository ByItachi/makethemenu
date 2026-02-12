import { Sidebar } from "@/components/Sidebar";
import { useTables, useCreateTable, useUpdateTable, useDeleteTable } from "@/hooks/use-resto";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTableSchema } from "@shared/schema";
import { z } from "zod";
import { Users, MoreVertical, Trash2, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Tables() {
  const { data: tables, isLoading } = useTables();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm">
          <h1 className="text-2xl font-display font-bold">Floor Plan</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Table</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Table</DialogTitle>
              </DialogHeader>
              <TableForm onSuccess={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-muted/10">
          <div className="table-grid">
            {tables?.map((table) => (
              <TableCard key={table.id} table={table} />
            ))}
          </div>
          {tables?.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
               <div className="p-6 rounded-full bg-muted mb-4">
                 <Users className="h-10 w-10 opacity-50" />
               </div>
               <p className="text-lg font-medium">No tables set up</p>
               <p className="text-sm">Create your first table to get started</p>
             </div>
          )}
        </main>
      </div>
    </div>
  );
}

function TableCard({ table }: { table: any }) {
  const deleteTable = useDeleteTable();
  const updateTable = useUpdateTable();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return "bg-green-500/10 text-green-600 border-green-200 dark:border-green-900";
      case 'occupied': return "bg-red-500/10 text-red-600 border-red-200 dark:border-red-900";
      case 'reserved': return "bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-900";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "aspect-square rounded-2xl border-2 p-4 flex flex-col justify-between relative group cursor-pointer shadow-sm hover:shadow-md transition-all",
        getStatusColor(table.status)
      )}
    >
      <div className="flex justify-between items-start">
        <span className="font-bold text-xl">{table.name}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
             <DropdownMenuItem onClick={() => updateTable.mutate({ id: table.id, status: 'available' })}>Mark Available</DropdownMenuItem>
             <DropdownMenuItem onClick={() => updateTable.mutate({ id: table.id, status: 'occupied' })}>Mark Occupied</DropdownMenuItem>
             <DropdownMenuItem onClick={() => updateTable.mutate({ id: table.id, status: 'reserved' })}>Mark Reserved</DropdownMenuItem>
             <DropdownMenuItem className="text-destructive" onClick={() => deleteTable.mutate(table.id)}>Delete Table</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 opacity-20">
        <Users className="h-12 w-12" />
      </div>

      <div className="flex justify-between items-end">
        <div className="text-xs font-medium uppercase tracking-wider">{table.status}</div>
        <div className="flex items-center gap-1 text-sm font-medium">
          <Users className="h-3 w-3" />
          {table.capacity}
        </div>
      </div>
    </motion.div>
  );
}

function TableForm({ onSuccess }: { onSuccess: () => void }) {
  const createTable = useCreateTable();
  const formSchema = insertTableSchema.pick({ name: true, capacity: true });
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createTable.mutate(data, {
      onSuccess,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="name">Table Name/Number</Label>
        <Input id="name" {...register("name")} placeholder="e.g. T1, Patio-1" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="capacity">Capacity</Label>
        <Input id="capacity" type="number" {...register("capacity", { valueAsNumber: true })} placeholder="4" />
        {errors.capacity && <p className="text-sm text-destructive">{errors.capacity.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={createTable.isPending}>
        {createTable.isPending ? "Creating..." : "Create Table"}
      </Button>
    </form>
  );
}
