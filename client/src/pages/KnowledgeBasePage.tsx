import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { BookOpen, HelpCircle, Search, Settings, Shield, X, ArrowRight, FileText } from "lucide-react";
import {
  kbArticles,
  kbCategories,
  getKbCategory,
  searchKbArticles,
  type KbArticle,
} from "@/lib/knowledge-base";
import { useSeo } from "@/lib/seo";

const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  baslangic: BookOpen,
  "menu-ve-yayin": FileText,
  entegrasyonlar: Settings,
  guvenlik: Shield,
  faturalama: HelpCircle,
};

export default function KnowledgeBasePage() {
  const [, navigate] = useLocation();

  useSeo({
    title: "Bilgi Bankası",
    description:
      "Makethemenu bilgi bankası: kurulum, menü yayını, entegrasyonlar, güvenlik ve faturalama konularında adım adım rehberler.",
    path: "/kaynaklar/bilgi-merkezi",
    breadcrumbs: [
      { name: "Ana Sayfa", path: "/" },
      { name: "Bilgi Merkezi", path: "/kaynaklar/bilgi-merkezi" },
    ],
  });

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Tek kaynak: içerik kütüphanesinden filtre. Sahte/sabit sonuç yoktur.
  const results = useMemo(() => searchKbArticles(query, selectedCategory ?? undefined), [query, selectedCategory]);
  const dropdownResults = useMemo(() => searchKbArticles(query), [query]);

  useEffect(() => {
    if (searchOpen) {
      // Arama alanı açıldığında otomatik odaklan
      const t = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(t);
    }
  }, [searchOpen]);

  useEffect(() => setActiveIndex(-1), [query]);

  const closeSearch = useCallback((refocus = true) => {
    setSearchOpen(false);
    setActiveIndex(-1);
    if (refocus) searchToggleRef.current?.focus();
  }, []);

  const openSearch = useCallback(() => {
    setSearchOpen((open) => !open);
  }, []);

  const navigateToArticle = useCallback(
    (slug: string) => {
      closeSearch(false);
      navigate(`/kaynaklar/bilgi-merkezi/${slug}`);
    },
    [closeSearch, navigate],
  );

  const onSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeSearch();
      return;
    }
    if (!query || dropdownResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => {
        const next = (i + 1) % dropdownResults.length;
        document.getElementById(`kb-opt-${next}`)?.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => {
        const next = (i - 1 + dropdownResults.length) % dropdownResults.length;
        document.getElementById(`kb-opt-${next}`)?.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      navigateToArticle(dropdownResults[activeIndex].slug);
    }
  };

  const selectCategoryAndScroll = (id: string) => {
    setSelectedCategory((cur) => (cur === id ? null : id));
    window.setTimeout(() => {
      document.getElementById("makaleler")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const hasQuery = query.trim().length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero + arama */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container text-center pt-32 relative z-10">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
            Bilgi <span className="text-primary">Merkezi</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sık sorulan sorular, başlangıç kılavuzları ve sorun giderme makaleleri.
          </p>

          {/* Belirgin büyüteç ikonu — arama alanını açar/kapatır */}
          <div className="mt-8 flex justify-center">
            <button
              ref={searchToggleRef}
              type="button"
              onClick={openSearch}
              aria-expanded={searchOpen}
              aria-controls="kb-search-panel"
              aria-label={searchOpen ? "Arama alanını kapat" : "Arama alanını aç"}
              className="group inline-flex items-center gap-3 rounded-full border border-border bg-card pl-4 pr-5 py-3 shadow-sm hover:shadow-md hover:border-primary/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground group-hover:scale-105 transition-transform" aria-hidden="true">
                {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </span>
              <span className="text-left">
                <span className="block text-sm font-medium leading-tight">Bilgi merkezinde ara</span>
                <span className="block text-xs text-muted-foreground leading-tight">Makale, kategori ve etiketlerde arayın</span>
              </span>
            </button>
          </div>

          {/* Arama alanı */}
          {searchOpen && (
            <div id="kb-search-panel" className="mt-6 mx-auto max-w-2xl px-2 text-left" role="search">
              <div className="relative">
                <label htmlFor="kb-search-input" className="sr-only">
                  Makalelerde ara
                </label>
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <input
                  ref={inputRef}
                  id="kb-search-input"
                  type="text"
                  role="combobox"
                  autoComplete="off"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onSearchKeyDown}
                  placeholder="Arayın: ödeme, yazıcı, kurulum, QR..."
                  aria-controls="kb-search-results"
                  aria-activedescendant={activeIndex >= 0 ? `kb-opt-${activeIndex}` : undefined}
                  aria-expanded={hasQuery}
                  className="w-full max-w-full h-11 rounded-lg border border-border bg-card pl-9 pr-24 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {hasQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    aria-label="Aramayı temizle"
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                    Temizle
                  </button>
                )}
              </div>

              {/* Açılır sonuç listesi — ok tuşları ve Enter ile gezilebilir */}
              {hasQuery && (
                <ul
                  ref={listRef}
                  id="kb-search-results"
                  role="listbox"
                  aria-label="Arama sonuçları"
                  className="mt-2 max-h-80 overflow-y-auto rounded-lg border border-border bg-card shadow-lg divide-y divide-border"
                >
                  {dropdownResults.length === 0 ? (
                    <li className="px-4 py-6 text-center text-sm text-muted-foreground" role="option" aria-selected={false}>
                      <strong className="text-foreground">"{query}"</strong> için sonuç bulunamadı.
                      <span className="block mt-1 text-xs">Farklı bir terim deneyin; öneriler: ödeme, QR, yazıcı, plan, alan adı.</span>
                    </li>
                  ) : (
                    dropdownResults.map((article, i) => (
                      <li key={article.slug} id={`kb-opt-${i}`} role="option" aria-selected={i === activeIndex}>
                        <button
                          type="button"
                          tabIndex={-1}
                          onMouseEnter={() => setActiveIndex(i)}
                          onClick={() => navigateToArticle(article.slug)}
                          className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                            i === activeIndex ? "bg-accent" : "bg-card hover:bg-accent/50"
                          }`}
                        >
                          <Search className="w-4 h-4 mt-0.5 text-primary shrink-0" aria-hidden="true" />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium line-clamp-1">{article.title}</span>
                            <span className="block text-xs text-muted-foreground line-clamp-1">{article.description}</span>
                            <span className="mt-1 inline-block text-[11px] text-muted-foreground">
                              {getKbCategory(article.category)?.name}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Kategori kartları */}
      <section className="py-16">
        <div className="site-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {kbCategories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.id] ?? BookOpen;
              const count = kbArticles.filter((a) => a.category === cat.id).length;
              const active = selectedCategory === cat.id;
              return (
                <Card
                  key={cat.id}
                  className={`text-left transition-all hover:shadow-lg ${active ? "border-primary ring-2 ring-primary/30" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => selectCategoryAndScroll(cat.id)}
                    aria-pressed={active}
                    aria-label={`${cat.name} makalelerini gör`}
                    className="w-full h-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-primary" aria-hidden="true" /> {cat.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-3">{cat.description}</p>
                      <span className="inline-flex items-center gap-1 text-sm text-primary font-medium">
                        {count} makaleyi gör <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </span>
                    </CardContent>
                  </button>
                </Card>
              );
            })}
          </div>

          {/* Filtre rozetleri */}
          <div id="makaleler" className="scroll-mt-24 mb-6 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              aria-pressed={selectedCategory === null}
              className={`rounded-full px-4 py-1.5 text-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                selectedCategory === null
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              Tümü
            </button>
            {kbCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory((cur) => (cur === cat.id ? null : cat.id))}
                aria-pressed={selectedCategory === cat.id}
                className={`rounded-full px-4 py-1.5 text-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Makale kartları */}
          {results.length === 0 ? (
            <Card className="p-10 text-center">
              <Search className="w-8 h-8 mx-auto text-muted-foreground mb-3" aria-hidden="true" />
              <p className="font-medium mb-1">Sonuç bulunamadı</p>
              <p className="text-sm text-muted-foreground">
                {hasQuery ? (
                  <>
                    <strong>"{query}"</strong> için hiç makale eşleşmedi. Farklı bir terim deneyin veya aramayı temizleyin.
                  </>
                ) : (
                  "Bu kategoride henüz makale yok."
                )}
              </p>
            </Card>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4" role="status">
                {hasQuery
                  ? `"${query}" için ${results.length} sonuç`
                  : selectedCategory
                    ? `${getKbCategory(selectedCategory)?.name} — ${results.length} makale`
                    : `${results.length} makale`}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.map((article) => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function ArticleCard({ article }: { article: KbArticle }) {
  const category = getKbCategory(article.category);
  return (
    <Link href={`/kaynaklar/bilgi-merkezi/${article.slug}`} aria-label={`${article.title} makalesini aç`}>
      <Card className="h-full hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer group">
        <CardHeader>
          <div className="flex items-center justify-between gap-2 mb-1">
            <Badge variant="secondary">{category?.name}</Badge>
            <span className="text-xs text-muted-foreground">Güncellendi: {article.updated}</span>
          </div>
          <CardTitle className="text-lg leading-snug group-hover:text-primary transition-colors">
            <span className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary shrink-0" aria-hidden="true" /> {article.title}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4 line-clamp-2">{article.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {article.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="rounded-md bg-secondary/60 px-2 py-0.5 text-xs text-secondary-foreground">
                #{tag}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
