import { useEffect } from "react";

/**
 * SPA sayfaları için SEO yönetimi: title, description, canonical, Open Graph,
 * Twitter kartları ve JSON-LD structured data'yı tek noktadan kurar.
 * react-helmet benzeri bağımlılık eklememek için doğrudan document.head'i yönetir.
 */

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export interface SeoInput {
  title: string;
  description: string;
  /** Sayfanın site içi yolu ("/kaynaklar/blog" gibi). Canonical bununla kurulur. */
  path?: string;
  /** Sosyal paylaşım görseli (mutlak URL). */
  image?: string;
  /** Arama motorlarında indexlenmesin (ör. kampanya / geçici sayfalar). */
  noindex?: boolean;
  /** BreadcrumbList structured data. */
  breadcrumbs?: BreadcrumbItem[];
  /** Article / Product / WebPage gibi ek JSON-LD blokları (zaten obje olarak). */
  jsonLd?: Record<string, unknown>[];
  /** Bu sayfa "article" mı? Article structured data ve og:type=article üretilir. */
  type?: "website" | "article";
  /** Article için yayın tarihi (ISO). */
  publishedTimeISO?: string;
}

/** Üretim kök adresi: localhost'ta canonical yanlışlıkla localhost'u işaret etmesin. */
export function seoBaseUrl(): string {
  if (typeof window === "undefined") return "https://www.makethemenu.com";
  const { origin } = window.location;
  return /(^https?:\/\/)(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(origin)
    ? "https://www.makethemenu.com"
    : origin;
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

const JSONLD_ID = "mtm-page-jsonld";

/** Aktif dili <html lang> üzerinden okur (index.html başlangıç script'i ve LanguageContext senkron tutar). */
function currentPageLang(): "tr" | "en" {
  if (typeof document === "undefined") return "tr";
  return document.documentElement.lang === "en" ? "en" : "tr";
}

/** Sayfa meta verilerini kurar. Hook mount'ta ve girdiler değiştiğinde çalışır;
 * unmount'ta sayfaya özel JSON-LD'yi temizler (varsayılan meta kalır).
 */
export function useSeo(input: SeoInput) {
  const { title, description, path, image, noindex, breadcrumbs, jsonLd, type = "website", publishedTimeISO } = input;

  useEffect(() => {
    const base = seoBaseUrl();
    const lang = currentPageLang();
    const locale = lang === "en" ? "en_US" : "tr_TR";
    const alternateLocale = lang === "en" ? "tr_TR" : "en_US";
    const htmlLang = lang === "en" ? "en-US" : "tr-TR";
    const canonical = `${base}${path ?? window.location.pathname}`;
    const fullTitle = title.includes("Makethemenu") ? title : `${title} | Makethemenu`;
    const ogImage = image ?? `${base}/makethemenu-header.png`;

    document.title = fullTitle;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonical;

    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:type", type === "article" ? "article" : "website");
    upsertMeta("property", "og:image", ogImage);
    upsertMeta("property", "og:locale", locale);
    upsertMeta("property", "og:locale:alternate", alternateLocale);
    if (type === "article" && publishedTimeISO) {
      upsertMeta("property", "article:published_time", publishedTimeISO);
    }
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", ogImage);

    // JSON-LD: her render'da eski bloğun yerine yenisi yazılır.
    const blocks: Record<string, unknown>[] = [];
    if (breadcrumbs?.length) {
      blocks.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((b, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: b.name,
          item: `${base}${b.path}`,
        })),
      });
    }
    if (type === "article") {
      blocks.push({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        image: ogImage,
        datePublished: publishedTimeISO,
        inLanguage: htmlLang,
        author: { "@type": "Organization", name: "Makethemenu" },
        publisher: { "@type": "Organization", name: "Makethemenu", url: base },
        mainEntityOfPage: canonical,
      });
    }
    if (jsonLd?.length) blocks.push(...jsonLd);

    document.getElementById(JSONLD_ID)?.remove();
    if (blocks.length) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = JSONLD_ID;
      script.textContent = JSON.stringify(blocks);
      document.head.appendChild(script);
    }

    return () => {
      document.getElementById(JSONLD_ID)?.remove();
    };
  }, [title, description, path, image, noindex, breadcrumbs, jsonLd, type, publishedTimeISO]);
}
