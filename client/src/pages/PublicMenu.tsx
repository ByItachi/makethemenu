import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import { Loader2, ShoppingBasket, X, Minus, Plus, Trash2, CheckCircle2, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
        "rotation-per-second"?: string;
        "camera-orbit"?: string;
        "shadow-intensity"?: number;
        exposure?: number;
        ar?: boolean;
        "ar-modes"?: string;
      };
    }
  }
}

type PublicProduct = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  model3dUrl: string | null;
  isAvailable: boolean | null;
};

type PublicMenu = {
  restaurant: {
    name: string;
    slug: string;
    type: string | null;
    description: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    currency: string;
  };
  categories: { id: number; name: string; products: PublicProduct[] }[];
};

type CartLine = { productId: number; name: string; price: number; quantity: number };

function formatPrice(price: number | string, currency: string) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(Number(price));
}

// 3D menu viewer (spec §6): @google/model-viewer lazy-loads from the CDN only when a
// product actually has a .glb/.gltf model. Supports camera orbit and phone AR.
const MODEL_VIEWER_CDN = "/vendor/model-viewer.min.js";
let modelViewerPromise: Promise<void> | null = null;

function loadModelViewer(): Promise<void> {
  if (typeof window !== "undefined" && customElements.get("model-viewer")) return Promise.resolve();
  modelViewerPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.type = "module";
    s.src = MODEL_VIEWER_CDN;
    s.onload = () => resolve();
    s.onerror = () => {
      modelViewerPromise = null;
      reject(new Error("model-viewer yüklenemedi"));
    };
    document.head.appendChild(s);
  });
  return modelViewerPromise;
}

function Model3dViewer({ src, alt }: { src: string; alt: string }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    let alive = true;
    loadModelViewer()
      .then(() => {
        if (alive) setStatus("ready");
      })
      .catch(() => {
        if (alive) setStatus("error");
      });
    return () => {
      alive = false;
    };
  }, []);
  if (status === "error") {
    return <p className="text-xs text-muted-foreground">3D model şu anda görüntülenemiyor.</p>;
  }
  if (status === "loading") {
    return (
      <div className="h-56 flex items-center justify-center rounded-lg bg-muted" aria-label="3D model yükleniyor">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return (
    <model-viewer
      src={src}
      alt={alt}
      camera-controls
      auto-rotate
      ar
      ar-modes="webxr scene-viewer quick-look"
      className="rounded-lg overflow-hidden bg-muted"
      style={{ width: "100%", height: 224 }}
    />
  );
}

export default function PublicMenuPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const { toast } = useToast();
  const [menu, setMenu] = useState<PublicMenu | null>(null);
  const [state, setState] = useState<"loading" | "notfound" | "error" | "ready">("loading");
  const [selected, setSelected] = useState<PublicProduct | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [placed, setPlaced] = useState<{ id: number; totalAmount: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ customerName: "", phone: "", note: "" });

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    (async () => {
      try {
        const res = await fetch(`/api/public/menu/${encodeURIComponent(slug)}`);
        if (cancelled) return;
        if (res.status === 301) {
          const data = await res.json();
          if (data.redirectTo) {
            window.location.replace(data.redirectTo);
            return;
          }
        }
        if (res.status === 404) return setState("notfound");
        if (!res.ok) return setState("error");
        setMenu(await res.json());
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Anonymous analytics: one menu_view per load, plus qr_scan when opened from a QR table code.
  useEffect(() => {
    if (state !== "ready" || !menu) return;
    const q = new URLSearchParams(window.location.search);
    const fromQr = q.get("ref") === "qr" || q.get("masa") !== null || q.get("table") !== null;
    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: menu.restaurant.slug, type: "menu_view" }),
      keepalive: true,
    }).catch(() => {});
    if (fromQr) {
      fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: menu.restaurant.slug, type: "qr_scan" }),
        keepalive: true,
      }).catch(() => {});
    }
  }, [state, menu]);

  // Per-menu cart persistence so a refresh does not lose the basket.
  useEffect(() => {
    if (!slug) return;
    try {
      const raw = localStorage.getItem(`mtm-cart-${slug}`);
      if (raw) setCart(JSON.parse(raw));
    } catch {}
  }, [slug]);
  useEffect(() => {
    if (!slug) return;
    try {
      localStorage.setItem(`mtm-cart-${slug}`, JSON.stringify(cart));
    } catch {}
  }, [cart, slug]);

  const openProduct = (p: PublicProduct) => {
    setSelected(p);
    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, type: "product_view", productId: p.id }),
      keepalive: true,
    }).catch(() => {});
  };

  const cartCount = useMemo(() => cart.reduce((s, l) => s + l.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((s, l) => s + l.price * l.quantity, 0), [cart]);

  const addToCart = (p: PublicProduct, qty: number) => {
    setCart((prev) => {
      const line = prev.find((l) => l.productId === p.id);
      if (line) return prev.map((l) => (l.productId === p.id ? { ...l, quantity: Math.min(50, l.quantity + qty) } : l));
      return [...prev, { productId: p.id, name: p.name, price: Number(p.price), quantity: qty }];
    });
    setSelected(null);
    toast({ title: "Sepete eklendi", description: p.name });
  };

  const setQty = (productId: number, qty: number) => {
    setCart((prev) => (qty <= 0 ? prev.filter((l) => l.productId !== productId) : prev.map((l) => (l.productId === productId ? { ...l, quantity: Math.min(50, qty) } : l))));
  };

  const placeOrder = async () => {
    if (!menu || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/public/menu/${encodeURIComponent(slug)}/orders`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName,
          phone: form.phone,
          note: form.note || null,
          items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: "Sipariş verilemedi", description: body.message ?? "Bir hata oluştu.", variant: "destructive" });
        return;
      }
      setPlaced({ id: body.id, totalAmount: body.totalAmount });
      setCart([]);
      setForm({ customerName: "", phone: "", note: "" });
    } catch {
      toast({ title: "Hata", description: "Sipariş gönderilemedi, tekrar deneyin.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!menu) return;
    const r = menu.restaurant;
    document.title = `${r.name} | Menü`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", r.description || `${r.name} dijital menüsü`);
  }, [menu]);

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (state === "notfound") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background text-foreground p-6 text-center">
        <h1 className="text-2xl font-bold">Menü bulunamadı</h1>
        <p className="text-muted-foreground">Bu adreste yayımlanmış bir menü yok.</p>
        <Link href="/" className="text-primary underline">Ana sayfaya dön</Link>
      </div>
    );
  }

  if (state === "error" || !menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
        <p>Menü yüklenemedi. Lütfen daha sonra tekrar deneyin.</p>
      </div>
    );
  }

  const { restaurant, categories } = menu;
  const currency = restaurant.currency;

  return (
    <main className="min-h-screen bg-background text-foreground pb-28">
      <header className="border-b border-border px-4 sm:px-6 py-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold break-words">{restaurant.name}</h1>
        {restaurant.description && <p className="mt-2 text-muted-foreground text-sm sm:text-base">{restaurant.description}</p>}
        {(restaurant.city || restaurant.phone) && (
          <p className="mt-2 text-sm text-muted-foreground">
            {[restaurant.city, restaurant.phone].filter(Boolean).join(" · ")}
          </p>
        )}
      </header>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 space-y-10">
        {categories.length === 0 && <p className="text-center text-muted-foreground">Bu menüde henüz ürün yok.</p>}
        {categories.map((cat) => (
          <section key={cat.id} aria-labelledby={`cat-${cat.id}`}>
            <h2 id={`cat-${cat.id}`} className="text-xl font-semibold mb-4">{cat.name}</h2>
            <ul className="divide-y divide-border">
              {cat.products.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => openProduct(p)}
                    className="w-full text-left py-3 flex items-start justify-between gap-4 hover:bg-muted/40 transition-colors px-2 -mx-2 rounded-md"
                  >
                    <div>
                      <p className="font-medium">
                        {p.name}
                        {p.model3dUrl && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold align-middle">
                            <Box className="h-3 w-3" /> 3D
                          </span>
                        )}
                        {p.isAvailable === false && <span className="ml-2 text-xs text-red-600">Tükendi</span>}
                      </p>
                      {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                    </div>
                    <span className="whitespace-nowrap font-semibold">{formatPrice(p.price, currency)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* Floating cart button */}
      {cartCount > 0 && !cartOpen && (
        <div className="fixed bottom-4 inset-x-4 sm:left-auto sm:right-6 sm:w-72 z-40">
          <Button className="w-full h-12 shadow-lg" onClick={() => setCartOpen(true)} data-testid="button-open-cart">
            <ShoppingBasket className="h-5 w-5 mr-2" />
            Sepet ({cartCount}) · {formatPrice(cartTotal, currency)}
          </Button>
        </div>
      )}

      {/* Product sheet: bottom panel on mobile, centered dialog on desktop */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6" onClick={() => setSelected(null)}>
          <div
            className="w-full sm:max-w-md bg-background text-foreground rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={selected.name}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-semibold">{selected.name}</h2>
              <Button variant="ghost" size="icon" onClick={() => setSelected(null)} aria-label="Kapat">
                <X className="h-5 w-5" />
              </Button>
            </div>
            {selected.description && <p className="mt-2 text-sm text-muted-foreground">{selected.description}</p>}
            {selected.model3dUrl && (
              <div className="mt-3">
                <Model3dViewer src={selected.model3dUrl} alt={selected.name} />
                <p className="mt-1 text-xs text-muted-foreground">Döndürmek için sürükleyin · Telefonla AR deneyin</p>
              </div>
            )}
            <p className="mt-3 text-2xl font-bold">{formatPrice(selected.price, currency)}</p>
            {selected.isAvailable === false ? (
              <p className="mt-4 text-sm text-destructive">Bu ürün şu anda tükenmiş.</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => addToCart(selected, 1)}>+ Sepete ekle</Button>
                <Button onClick={() => addToCart(selected, 2)} className="bg-primary">2 adet ekle</Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setCartOpen(false)}>
          <div
            className="w-full sm:max-w-md bg-background text-foreground rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Sepet"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Siparişiniz</h2>
              <Button variant="ghost" size="icon" onClick={() => setCartOpen(false)} aria-label="Kapat">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {placed ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
                <p className="text-lg font-semibold">Siparişiniz alındı</p>
                <p className="text-sm text-muted-foreground">Sipariş numarası: #{placed.id} · Toplam: {formatPrice(placed.totalAmount, currency)}</p>
                <p className="text-xs text-muted-foreground">İşletmeniz siparişinizi gördüğünde durumunu güncelleyecek.</p>
                <Button className="mt-3" onClick={() => { setPlaced(null); setCartOpen(false); }}>Menüye dön</Button>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-border my-3">
                  {cart.map((l) => (
                    <li key={l.productId} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{l.name}</p>
                        <p className="text-sm text-muted-foreground">{formatPrice(l.price, currency)} × {l.quantity}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQty(l.productId, l.quantity - 1)} aria-label="Azalt">
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center">{l.quantity}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQty(l.productId, l.quantity + 1)} aria-label="Artır">
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setQty(l.productId, 0)} aria-label="Kaldır">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="text-right font-semibold">Ara toplam: {formatPrice(cartTotal, currency)}</p>
                <p className="text-right text-xs text-muted-foreground">Vergiler kasada hesaplanır.</p>

                <div className="mt-4 space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="pub-name">Adınız</Label>
                    <Input id="pub-name" value={form.customerName} maxLength={120} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="Ad Soyad" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pub-phone">Telefon</Label>
                    <Input id="pub-phone" type="tel" value={form.phone} maxLength={32} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="05…" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pub-note">Not (isteğe bağlı)</Label>
                    <Input id="pub-note" value={form.note} maxLength={500} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Örn. az acılı olsun" />
                  </div>
                  <Button className="w-full h-12" disabled={sending || !form.customerName.trim() || form.phone.trim().length < 7} onClick={placeOrder} data-testid="button-place-order">
                    {sending ? "Gönderiliyor…" : `Siparişi gönder · ${formatPrice(cartTotal, currency)}`}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">Siparişi işletme onaylar; tutar kasada veya çevrimiçi ödemede netleşir.</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
