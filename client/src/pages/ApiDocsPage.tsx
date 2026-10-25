import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Globe,
  KeyRound,
  Menu,
  Search,
  ShieldAlert,
  Terminal,
  X,
  Zap,
} from "lucide-react";
import {
  apiErrorCodes,
  apiRateLimits,
  apiSections,
  endpointId,
  searchApiDocs,
  type ApiEndpoint,
  type HttpMethod,
} from "@/lib/api-docs";

const METHOD_STYLES: Record<HttpMethod, string> = {
  GET: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  POST: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  PATCH: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  PUT: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  DELETE: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
};

/** Hata kodları ve oran limitleri bölümleri (uç nokta içermeyen referans bölümler). */
const REFERENCE_SECTIONS = [
  { id: "hata-kodlari", title: "Hata Kodları" },
  { id: "rate-limits", title: "Rate Limits" },
];

export default function ApiDocsPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [docsQuery, setDocsQuery] = useState("");
  const [heroSearchOpen, setHeroSearchOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>(endpointId(apiSections[0].endpoints[0]));
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(apiSections.map((s) => s.id)),
  );

  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const searchToggleRef = useRef<HTMLButtonElement>(null);

  // Hero arama paneli — Bilgi Merkezi'ndeki davranışın aynısı: açılınca odağı alana verir.
  useEffect(() => {
    if (!heroSearchOpen) return;
    const t = window.setTimeout(() => document.getElementById("api-docs-search")?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [heroSearchOpen]);

  const toggleHeroSearch = useCallback(() => setHeroSearchOpen((o) => !o), []);

  // Dokümantasyon içi arama — uç nokta, metot, parametre ve başlıklarda eşleşir.
  const filteredSections = useMemo(() => searchApiDocs(docsQuery), [docsQuery]);
  const isFiltering = docsQuery.trim().length > 0;

  const allEndpointIds = useMemo(
    () => apiSections.flatMap((s) => s.endpoints.map(endpointId)),
    [],
  );

  // Arama sırasında eşleşen bölümleri otomatik aç
  useEffect(() => {
    if (!isFiltering) return;
    setOpenSections((prev) => {
      const next = new Set(prev);
      for (const s of filteredSections) next.add(s.id);
      return next;
    });
  }, [isFiltering, filteredSections]);

  const toggleSection = useCallback((id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const navigateToAnchor = useCallback(
    (id: string) => {
      const section = apiSections.find((s) => s.endpoints.some((ep) => endpointId(ep) === id));
      if (section) {
        setOpenSections((prev) => new Set(prev).add(section.id));
      }
      setActiveId(id);
      setMobileOpen(false);
      // Hash'i güncelle ve yumuşak kaydır; sayfa yenilendiğinde de aynı bölüm açılır.
      window.history.replaceState(null, "", `#${id}`);
      window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 30);
    },
    [],
  );

  // Sayfa hash ile açıldıysa ilgili bölüme kaydır
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash && allEndpointIds.includes(hash)) {
      const t = window.setTimeout(() => {
        const section = apiSections.find((s) => s.endpoints.some((ep) => endpointId(ep) === hash));
        if (section) setOpenSections((prev) => new Set(prev).add(section.id));
        setActiveId(hash);
        document.getElementById(hash)?.scrollIntoView({ block: "start" });
      }, 120);
      return () => window.clearTimeout(t);
    }
  }, [allEndpointIds]);

  // Kaydırma sırasında aktif bölümü takip et (deterministik scrollspy)
  useEffect(() => {
    const ids = [...allEndpointIds, ...REFERENCE_SECTIONS.map((r) => r.id)];
    const ZONE = 170; // scroll-mt (158px) + pay: scrollIntoView sonrası bölüm eşik altında kalsın
    const compute = () => {
      let active = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= ZONE) active = id;
        else break;
      }
      setActiveId(active);
    };
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    compute();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [allEndpointIds]);

  // Mobil çekmece açıkken Escape ile kapat
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    drawerCloseRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebarNav = (
    <nav aria-label="API bölümleri" className="text-sm">
      <ul className="space-y-1">
        {apiSections
          .filter((s) => !isFiltering || filteredSections.some((f) => f.id === s.id))
          .map((section) => {
            const open = isFiltering || openSections.has(section.id);
            const sectionActive = section.endpoints.some((ep) => endpointId(ep) === activeId);
            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={open}
                  className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left font-medium hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    sectionActive ? "text-primary" : "text-foreground"
                  }`}
                >
                  {open ? (
                    <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  )}
                  <span className="truncate">{section.title}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
                    {section.endpoints.length}
                  </span>
                </button>
                {open && (
                  <ul className="mt-0.5 mb-1 ml-3 space-y-0.5 border-l border-border pl-2">
                    {section.endpoints.map((ep) => {
                      const id = endpointId(ep);
                      const active = activeId === id;
                      return (
                        <li key={id}>
                          <a
                            href={`#${id}`}
                            aria-current={active ? "true" : undefined}
                            onClick={(e) => {
                              e.preventDefault();
                              navigateToAnchor(id);
                            }}
                            className={`flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                              active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                            }`}
                          >
                            <span className={`shrink-0 rounded border px-1 text-[10px] font-semibold leading-4 ${METHOD_STYLES[ep.method]}`}>
                              {ep.method}
                            </span>
                            <span className="truncate" title={`${ep.method} ${ep.path}`}>
                              {ep.path}
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        {REFERENCE_SECTIONS.map((ref) => (
          <li key={ref.id}>
            <a
              href={`#${ref.id}`}
              aria-current={activeId === ref.id ? "true" : undefined}
              onClick={(e) => {
                e.preventDefault();
                setActiveId(ref.id);
                setMobileOpen(false);
                window.history.replaceState(null, "", `#${ref.id}`);
                window.setTimeout(() => document.getElementById(ref.id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
              }}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeId === ref.id ? "bg-primary/10 text-primary" : "text-foreground"
              }`}
            >
              {ref.id === "hata-kodlari" ? (
                <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              ) : (
                <Zap className="w-3.5 h-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              {ref.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );

  const searchField = (scope: "hero" | "drawer") => {
    const inputId = scope === "hero" ? "api-docs-search" : "api-docs-search-drawer";
    return (
    <div className="relative">
      <label htmlFor={inputId} className="sr-only">
        Dokümantasyonda ara
      </label>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
      <input
        id={inputId}
        type="text"
        autoComplete="off"
        value={docsQuery}
        onChange={(e) => setDocsQuery(e.target.value)}
        placeholder="Uç nokta, metot veya parametre ara..."
        className="w-full h-9 rounded-md border border-border bg-background pl-8 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {isFiltering && (
        <button
          type="button"
          onClick={() => setDocsQuery("")}
          aria-label="Dokümantasyon aramasını temizle"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero — Bilgi Merkezi hero'su ile aynı ortalı yapı ve boşluk:
          py-24 bölüm + pt-32 ile h1 diğer iç sayfalarla aynı hizada (navbar altı 224px). */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container text-center pt-32 relative z-10">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
            API <span className="text-primary">Dokümantasyonu</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            MakeTheMenu API'si siteyle aynı alan adında çalışır; kimlik doğrulama oturum çerezi (
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">mtm.sid</code>) ile yapılır. Tüm
            yanıtlar JSON döner (CSV/QR indirmeleri hariç).
          </p>

          {/* Belirgin arama butonu — Bilgi Merkezi'ndeki kalıbın aynısı; dokümanda aramayı açar */}
          <div className="mt-8 flex justify-center">
            <button
              ref={searchToggleRef}
              type="button"
              onClick={toggleHeroSearch}
              aria-expanded={heroSearchOpen}
              aria-controls="api-search-panel"
              aria-label={heroSearchOpen ? "Arama alanını kapat" : "Arama alanını aç"}
              className="group inline-flex items-center gap-3 rounded-full border border-border bg-card pl-4 pr-5 py-3 shadow-sm hover:shadow-md hover:border-primary/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground group-hover:scale-105 transition-transform" aria-hidden="true">
                {heroSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </span>
              <span className="text-left">
                <span className="block text-sm font-medium leading-tight">API dokümanında ara</span>
                <span className="block text-xs text-muted-foreground leading-tight">Uç nokta, metot ve parametrelerde arayın</span>
              </span>
            </button>
          </div>

          {/* Arama alanı */}
          {heroSearchOpen && (
            <div id="api-search-panel" className="mt-6 mx-auto max-w-2xl px-2 text-left" role="search">
              {searchField("hero")}
            </div>
          )}
        </div>
      </section>

      <div className="site-container pb-24">

        {/* Mobil içerik menüsü */}
        <div className="lg:hidden sticky top-[150px] z-30 -mx-2 mb-6 px-2">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-expanded={mobileOpen}
            aria-controls="api-docs-drawer"
            aria-label="Dokümantasyon menüsünü aç"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Menu className="w-4 h-4" aria-hidden="true" /> İçindekiler
          </button>
        </div>

        <div className="flex items-start gap-8">
          {/* Masaüstü sidebar */}
          <aside className="hidden lg:block w-72 shrink-0 sticky top-[150px] max-h-[calc(100vh-166px)] overflow-y-auto rounded-xl border border-border bg-card p-4">
            {sidebarNav}
          </aside>

          {/* İçerik */}
          <main className="flex-1 min-w-0">
            {isFiltering && filteredSections.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-10 text-center">
                <Search className="w-8 h-8 mx-auto text-muted-foreground mb-3" aria-hidden="true" />
                <p className="font-medium mb-1">Sonuç bulunamadı</p>
                <p className="text-sm text-muted-foreground">
                  "<strong>{docsQuery}</strong>" için eşleşen uç nokta, metot veya parametre yok.
                </p>
              </div>
            )}

            {filteredSections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-[158px] mb-14" aria-label={section.title}>
                <h2 className="text-2xl font-display font-bold mb-2">{section.title}</h2>
                {section.intro && <p className="text-muted-foreground mb-6 max-w-3xl">{section.intro}</p>}

                {section.endpoints.length === 0 && <p className="text-sm text-muted-foreground">Bu bölümde uç nokta yok.</p>}
                {section.endpoints.map((ep) => (
                  <EndpointBlock key={endpointId(ep)} endpoint={ep} />
                ))}
              </section>
            ))}

            {/* Hata kodları referansı */}
            <section id="hata-kodlari" className="scroll-mt-[158px] mb-14" aria-label="Hata Kodları">
              <h2 className="text-2xl font-display font-bold mb-2">Hata Kodları</h2>
              <p className="text-muted-foreground mb-6 max-w-3xl">
                Hatalı yanıtlarda gövde her zaman <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{"{ message, code? }"}</code> biçimindedir.
              </p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Durum</th>
                      <th className="px-4 py-2.5 font-medium">Kod</th>
                      <th className="px-4 py-2.5 font-medium">Anlamı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {apiErrorCodes.map((err) => (
                      <tr key={`${err.status}-${err.code ?? "genel"}`}>
                        <td className="px-4 py-2.5 align-top">
                          <span className={`rounded border px-1.5 text-xs font-semibold ${err.status < 500 ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" : "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30"}`}>
                            {err.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 align-top font-mono text-xs">{err.code ?? "—"}</td>
                        <td className="px-4 py-2.5 align-top text-muted-foreground">{err.meaning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Rate limits referansı */}
            <section id="rate-limits" className="scroll-mt-[158px]" aria-label="Rate Limits">
              <h2 className="text-2xl font-display font-bold mb-2">Rate Limits</h2>
              <p className="text-muted-foreground mb-6 max-w-3xl">
                Kimlik doğrulama uç noktalarında pencere bazlı oran limiti uygulanır. Limit aşıldığında
                <strong> 429</strong> döner. Limitler ortam değişkenleriyle yapılandırılabilir.
              </p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Kapsam</th>
                      <th className="px-4 py-2.5 font-medium">Limit</th>
                      <th className="px-4 py-2.5 font-medium">Ortam değişkeni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {apiRateLimits.map((rl) => (
                      <tr key={rl.scope}>
                        <td className="px-4 py-2.5">{rl.scope}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{rl.limit}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{rl.env}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Mobil çekmece */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Dokümantasyon menüsü">
          <button
            type="button"
            aria-label="Menüyü kapat"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div id="api-docs-drawer" className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <span className="font-display font-semibold">İçindekiler</span>
              <button
                ref={drawerCloseRef}
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Menüyü kapat"
                className="rounded-md p-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              {searchField("drawer")}
              <div className="mt-3">{sidebarNav}</div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function EndpointBlock({ endpoint }: { endpoint: ApiEndpoint }) {
  const id = endpointId(endpoint);
  return (
    <article id={id} className="scroll-mt-[158px] mb-10 rounded-xl border border-border bg-card">
      <header className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <span className={`shrink-0 rounded border px-2 py-0.5 text-xs font-bold ${METHOD_STYLES[endpoint.method]}`}>
          {endpoint.method}
        </span>
        <code className="break-all font-mono text-sm font-semibold">{endpoint.path}</code>
        <Badge variant="secondary" className="ml-auto shrink-0 gap-1">
          {endpoint.auth === "Gerekmiyor" ? (
            <Globe className="w-3 h-3 opacity-50" aria-hidden="true" />
          ) : (
            <KeyRound className="w-3 h-3" aria-hidden="true" />
          )}
          {endpoint.auth}
        </Badge>
      </header>

      <div className="space-y-5 p-4">
        <p className="text-sm text-foreground/90">{endpoint.summary}</p>
        {endpoint.description && <p className="text-sm text-muted-foreground">{endpoint.description}</p>}

        {endpoint.params && endpoint.params.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">Parametreler</h3>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium">Ad</th>
                    <th className="px-3 py-2 font-medium">Yer</th>
                    <th className="px-3 py-2 font-medium">Tip</th>
                    <th className="px-3 py-2 font-medium">Açıklama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {endpoint.params.map((p) => (
                    <tr key={`${p.loc}-${p.name}`}>
                      <td className="px-3 py-2 align-top font-mono text-xs">
                        {p.name}
                        {p.required && <span className="ml-1 text-red-500" title="Zorunlu">*</span>}
                      </td>
                      <td className="px-3 py-2 align-top text-xs text-muted-foreground">{p.loc}</td>
                      <td className="px-3 py-2 align-top font-mono text-xs text-muted-foreground">{p.type}</td>
                      <td className="px-3 py-2 align-top text-muted-foreground">{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {endpoint.headersNote && (
              <p className="mt-2 text-xs text-muted-foreground">Not: {endpoint.headersNote}</p>
            )}
          </div>
        )}

        {endpoint.curl && (
          <CodeBlock label="cURL ile örnek istek" code={endpoint.curl} />
        )}
        {endpoint.js && <CodeBlock label="JavaScript (fetch) örneği" code={endpoint.js} />}

        <div>
          <h3 className="mb-2 text-sm font-semibold">Yanıtlar</h3>
          <div className="space-y-3">
            {endpoint.responses.map((res) => (
              <div key={`${res.status}-${res.label ?? ""}`} className="rounded-lg border border-border">
                <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-1.5">
                  <span
                    className={`rounded border px-1.5 text-xs font-semibold ${
                      res.status < 400
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                        : "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30"
                    }`}
                  >
                    {res.status}
                  </span>
                  {res.label && <span className="text-xs text-muted-foreground">{res.label}</span>}
                </div>
                {res.body ? (
                  <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
                    <code className="font-mono">{res.body}</code>
                  </pre>
                ) : (
                  <p className="px-3 py-2 text-xs text-muted-foreground">Başarılı yanıt gövdesi döner.</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {endpoint.errors && endpoint.errors.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">Hata durumları</h3>
            <ul className="space-y-1.5 text-sm">
              {endpoint.errors.map((err) => (
                <li key={`${err.status}-${err.when}`} className="flex items-start gap-2 text-muted-foreground">
                  <span className={`mt-0.5 shrink-0 rounded border px-1 text-[10px] font-semibold leading-4 ${
                    err.status < 500
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                      : "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30"
                  }`}>
                    {err.status}
                  </span>
                  {err.when}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}

/** Kopyalama butonlu kod bloğu — kopyalama gerçekten çalışır ve geri bildirim verir. */
function CodeBlock({ code, label }: { code: string; label: string }) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  const copy = async () => {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        ok = true;
      } else {
        // Güvenli bağlam dışı (http) ortamlar için geri dönüş
        const ta = document.createElement("textarea");
        ta.value = code;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      }
    } catch {
      ok = false;
    }
    setState(ok ? "ok" : "fail");
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setState("idle"), 2500);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Terminal className="w-3.5 h-3.5 text-primary" aria-hidden="true" /> {label}
        </h3>
        <button
          type="button"
          onClick={copy}
          aria-label={`${label} — kodu kopyala`}
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            state === "ok"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : state === "fail"
                ? "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
                : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          {state === "ok" ? (
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
          ) : state === "fail" ? (
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          <span aria-live="polite">
            {state === "ok" ? "Kopyalandı" : state === "fail" ? "Kopyalanamadı" : "Kopyala"}
          </span>
        </button>
      </div>
      <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}
