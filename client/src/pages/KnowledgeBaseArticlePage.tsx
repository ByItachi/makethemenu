import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight, HelpCircle, Search, X } from "lucide-react";
import {
  getKbArticle,
  getKbCategory,
  getKbRelated,
  kbArticles,
  kbCategories,
  searchKbArticles,
} from "@/lib/knowledge-base";
import { useSeo } from "@/lib/seo";

export default function KnowledgeBaseArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = getKbArticle(slug ?? "");
  const category = article ? getKbCategory(article.category) : undefined;

  useSeo({
    title: article ? article.title : "Makale Bulunamadı",
    description: article?.description ?? "Makethemenu bilgi merkezi makaleleri.",
    path: article ? `/kaynaklar/bilgi-merkezi/${article.slug}` : "/kaynaklar/bilgi-merkezi",
    noindex: !article,
    breadcrumbs: [
      { name: "Ana Sayfa", path: "/" },
      { name: "Bilgi Merkezi", path: "/kaynaklar/bilgi-merkezi" },
      ...(category ? [{ name: category.name, path: `/kaynaklar/bilgi-merkezi?kategori=${category.id}` }] : []),
      ...(article ? [{ name: article.title, path: `/kaynaklar/bilgi-merkezi/${article.slug}` }] : []),
    ],
  });

  // Masaüstü sol sidebar: kategori/makale filtresi (canlı filtreleme)
  const [filterQuery, setFilterQuery] = useState("");
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    () => new Set(category ? [category.id] : []),
  );
  const isFiltering = filterQuery.trim().length > 0;
  const filteredArticles = useMemo(
    () => (isFiltering ? searchKbArticles(filterQuery) : kbArticles),
    [isFiltering, filterQuery],
  );
  const visibleCategories = useMemo(
    () => kbCategories.filter((cat) => filteredArticles.some((a) => a.category === cat.id)),
    [filteredArticles],
  );

  // Makale değiştiğinde ait olduğu kategoriyi açık tut
  useEffect(() => {
    if (category) setOpenCategories((prev) => new Set(prev).add(category.id));
  }, [category]);

  const toggleCategory = (id: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!article) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <section className="py-32">
          <div className="site-container text-center max-w-xl mx-auto">
            <HelpCircle className="w-10 h-10 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
            <h1 className="text-3xl font-display font-bold mb-3">Makale bulunamadı</h1>
            <p className="text-muted-foreground mb-6">
              Aradığınız makale taşınmış veya hiç var olmamış olabilir.
            </p>
            <Link
              href="/kaynaklar/bilgi-merkezi"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Bilgi Merkezi'ne dön
            </Link>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const related = getKbRelated(article.slug);
  const popular = kbArticles.filter((a) => a.slug !== article.slug).slice(0, 4);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container relative z-10 pt-32 max-w-3xl">
          <nav aria-label="Konum" className="text-sm text-muted-foreground mb-6">
            <Link href="/kaynaklar/bilgi-merkezi" className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
              Bilgi Merkezi
            </Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <span className="text-foreground">{category?.name}</span>
          </nav>
          <Badge variant="secondary" className="mb-3">{category?.name}</Badge>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 leading-tight">{article.title}</h1>
          <p className="text-lg text-muted-foreground mb-2">{article.description}</p>
          <p className="text-sm text-muted-foreground mb-8">Güncellendi: {article.updated}</p>
          <div className="flex flex-wrap gap-1.5">
            {article.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-secondary/60 px-2 py-0.5 text-xs text-secondary-foreground">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="site-container">
          <div className="flex items-start gap-8">
            {/* Masaüstü sol sidebar — makale filtresi ve kategori/makale gezinmesi */}
            <aside
              aria-label="Bilgi merkezi filtresi"
              className="hidden lg:block w-72 shrink-0 sticky top-[150px] max-h-[calc(100vh-166px)] overflow-y-auto rounded-xl border border-border bg-card p-4"
            >
              <div className="relative mb-3">
                <label htmlFor="kb-article-filter" className="sr-only">
                  Makalelerde filtrele
                </label>
                <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <input
                  id="kb-article-filter"
                  type="text"
                  autoComplete="off"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Makale filtrele..."
                  className="w-full h-9 rounded-md border border-border bg-background pl-8 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {isFiltering && (
                  <button
                    type="button"
                    onClick={() => setFilterQuery("")}
                    aria-label="Filtreyi temizle"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>

              <nav aria-label="Makaleler" className="text-sm">
                <ul className="space-y-1">
                  {visibleCategories.map((cat) => {
                    const open = isFiltering || openCategories.has(cat.id);
                    const items = filteredArticles.filter((a) => a.category === cat.id);
                    return (
                      <li key={cat.id}>
                        <button
                          type="button"
                          onClick={() => toggleCategory(cat.id)}
                          aria-expanded={open}
                          className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left font-medium hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            category?.id === cat.id ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {open ? (
                            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                          )}
                          <span className="truncate">{cat.name}</span>
                          <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">{items.length}</span>
                        </button>
                        {open && (
                          <ul className="mt-0.5 mb-1 ml-3 space-y-0.5 border-l border-border pl-2">
                            {items.map((a) => {
                              const active = a.slug === slug;
                              return (
                                <li key={a.slug}>
                                  <Link
                                    href={`/kaynaklar/bilgi-merkezi/${a.slug}`}
                                    aria-current={active ? "page" : undefined}
                                    className={`block rounded-md px-2 py-1 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                      active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                                    }`}
                                  >
                                    <span className="line-clamp-1">{a.title}</span>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                  {visibleCategories.length === 0 && (
                    <li className="px-2 py-3 text-xs text-muted-foreground" role="status">
                      "<strong className="text-foreground">{filterQuery}</strong>" için eşleşen makale yok.
                    </li>
                  )}
                </ul>
              </nav>
            </aside>

            <main className="flex-1 min-w-0 max-w-3xl">
          <article className="space-y-10">
            {article.sections.map((section, i) => (
              <div key={i}>
                <h2 className="text-2xl font-display font-semibold mb-4">{section.heading}</h2>
                <div className="space-y-3 text-muted-foreground leading-relaxed">
                  {section.paragraphs.map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
                </div>
                {section.list && (
                  <ul className="mt-4 space-y-2 text-muted-foreground">
                    {section.list.map((item, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </article>

          {related.length > 0 && (
            <div className="mt-14">
              <h2 className="text-xl font-display font-semibold mb-4">İlgili makaleler</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {related.map((rel) => (
                  <Card key={rel.slug} className="p-4 hover:border-primary/40 hover:shadow transition-all">
                    <Link href={`/kaynaklar/bilgi-merkezi/${rel.slug}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                      <span className="font-medium group-hover:text-primary">{rel.title}</span>
                      <span className="mt-1 block text-sm text-muted-foreground line-clamp-2">{rel.description}</span>
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {popular.length > 0 && (
            <div className="mt-10 rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-display font-semibold mb-3">Diğer başlıklar</h2>
              <ul className="space-y-2">
                {popular.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/kaynaklar/bilgi-merkezi/${p.slug}`}
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      {p.title} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10">
            <Link
              href="/kaynaklar/bilgi-merkezi"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Tüm makalelere dön
            </Link>
          </div>
            </main>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
