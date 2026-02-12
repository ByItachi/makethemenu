import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useProducts, useCategories, useTables, useCreateOrder } from "@/hooks/use-resto";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, Trash2, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

type CartItem = {
  productId: number;
  product: any;
  quantity: number;
  notes?: string;
};

export default function POS() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const { data: categories } = useCategories();
  const { data: products } = useProducts(selectedCategory ?? undefined);
  const { data: tables } = useTables();
  const createOrder = useCreateOrder();

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { productId: product.id, product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((acc, item) => acc + (Number(item.product.price) * item.quantity), 0);
  const tax = subtotal * 0.1; // 10% tax example
  const total = subtotal + tax;

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    
    createOrder.mutate({
      tableId: selectedTable ? parseInt(selectedTable) : null,
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        notes: item.notes
      }))
    }, {
      onSuccess: () => {
        setCart([]);
        setSelectedTable("");
      }
    });
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Product Selection */}
        <div className="flex-1 flex flex-col border-r border-border relative">
          {/* Header & Search */}
          <div className="p-4 border-b bg-card/50 backdrop-blur-sm z-10 space-y-4">
             <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search menu..." 
                  className="pl-9 bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="w-full whitespace-nowrap pb-2">
              <div className="flex gap-2">
                <Button 
                  variant={selectedCategory === null ? "default" : "outline"}
                  onClick={() => setSelectedCategory(null)}
                  className="rounded-full px-6"
                >
                  All Items
                </Button>
                {categories?.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "default" : "outline"}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="rounded-full px-6"
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4 bg-muted/20">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
              <AnimatePresence>
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    layout
                  >
                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group border-border/50 hover:border-primary/50"
                      onClick={() => addToCart(product)}
                    >
                      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                        {/* Use Unsplash images for demo, fallback to colored placeholder */}
                        {product.imageUrl ? (
                           <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-muted-foreground/20">
                            <ShoppingBag className="h-12 w-12" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                          ${Number(product.price).toFixed(2)}
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 h-8">
                          {product.description || "No description available"}
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Side - Cart */}
        <div className="w-[400px] flex flex-col bg-card shadow-2xl z-20">
          <div className="p-4 border-b">
            <h2 className="font-display font-bold text-xl mb-4">Current Order</h2>
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger className="w-full h-11">
                <SelectValue placeholder="Select Table (Optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Takeaway / Counter</SelectItem>
                {tables?.map((table) => (
                  <SelectItem key={table.id} value={table.id.toString()}>
                    Table {table.name} ({table.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {cart.map((item) => (
                <motion.div 
                  key={item.productId}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-3 p-3 bg-muted/30 rounded-lg border border-border/50"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.product.name}</h4>
                    <div className="text-primary font-bold text-sm mt-1">
                      ${(Number(item.product.price) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="h-7 w-7 rounded-full"
                      onClick={() => updateQuantity(item.productId, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="h-7 w-7 rounded-full"
                      onClick={() => updateQuantity(item.productId, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
              
              {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center h-60 text-muted-foreground border-2 border-dashed border-muted rounded-xl bg-muted/10">
                  <ShoppingBag className="h-10 w-10 mb-2 opacity-20" />
                  <p>Order is empty</p>
                  <p className="text-xs">Select items from the menu</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 bg-muted/20 border-t space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
              <span>Total</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>

            <Button 
              className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20" 
              size="lg"
              disabled={cart.length === 0 || createOrder.isPending}
              onClick={handlePlaceOrder}
            >
              {createOrder.isPending ? "Processing..." : `Place Order • $${total.toFixed(2)}`}
              {!createOrder.isPending && <ChevronRight className="ml-2 h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
