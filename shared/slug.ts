// Shared slug rules for public menu URLs (/p/:slug). Used by server and client.

export const SLUG_MIN = 3;
export const SLUG_MAX = 63;
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/;

// Paths that the platform itself uses or may use later. A business can never take these.
export const RESERVED_SLUGS = new Set([
  "api", "p", "admin", "dashboard", "login", "register", "logout", "signup", "signin",
  "auth", "static", "assets", "public", "images", "uploads", "www", "mail", "email",
  "ftp", "app", "apps", "sitemap", "robots", "favicon", "not-found", "forgot-password",
  "reset-password", "verify-email", "pricing", "prices", "features", "contact", "about",
  "blog", "demo", "settings", "pos", "tables", "orders", "menu", "menus", "qr", "help",
  "support", "status", "health", "legal", "privacy", "terms", "kvkk", "system", "root",
  "null", "undefined", "undefined-slug", "makethemenu", "restopos", "_next", "well-known",
]);

const TR_MAP: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
  Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u",
};

/** Turns a free-form business name into a candidate slug (ascii, lowercase, hyphenated). */
export function slugify(input: string): string {
  const mapped = input
    .normalize("NFC")
    .replace(/[çğıİöşüÇĞİÖŞÜ]/g, (c) => TR_MAP[c] ?? c)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
  return mapped
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
}

/** Returns an error message (Turkish) if the slug is not allowed, otherwise null. */
export function validateSlug(slug: string): string | null {
  if (slug.length < SLUG_MIN) return `Adres en az ${SLUG_MIN} karakter olmalı.`;
  if (slug.length > SLUG_MAX) return `Adres en fazla ${SLUG_MAX} karakter olabilir.`;
  if (!SLUG_PATTERN.test(slug)) {
    return "Adres yalnızca küçük harf, rakam ve tire içerebilir; tire ile başlayıp bitemez.";
  }
  if (slug.includes("--")) return "Adreste art arda tire kullanılamaz.";
  if (RESERVED_SLUGS.has(slug)) return "Bu adres sistem tarafından ayrılmıştır.";
  return null;
}
