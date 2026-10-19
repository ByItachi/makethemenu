import { z } from "zod";

export const draftProductSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(""),
  price: z.coerce.number().min(0).max(100000),
});
export const draftSectionSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().max(80).optional(),
  products: z.array(draftProductSchema).min(1).max(30),
});
export const draftSchema = z.object({ sections: z.array(draftSectionSchema).min(1).max(12) });
export type MenuDraft = z.infer<typeof draftSchema>;

const generateInputSchema = z.object({
  businessType: z.string().trim().min(2).max(64),
  cuisineHint: z.string().trim().max(200).optional().default(""),
  sections: z.number().int().min(3).max(8).default(4),
  productsPerSection: z.number().int().min(3).max(10).default(5),
});

export interface GenerateResult {
  source: "ai" | "template";
  model?: string;
  draft: MenuDraft;
}

function aiConfig(): { baseUrl: string; key: string; model: string } | null {
  const key = (process.env.AI_API_KEY ?? process.env.ABACUS_API_KEY ?? "").trim();
  if (!key) return null;
  return {
    baseUrl: (process.env.AI_BASE_URL ?? "https://routellm.abacus.ai/v1").replace(/\/$/, ""),
    key,
    model: process.env.AI_MODEL ?? "gpt-4o-mini",
  };
}

function slugify(s: string): string {
  const map: Record<string, string> = { ı: "i", İ: "i", ş: "s", ğ: "g", ü: "u", ö: "o", ç: "c", Ş: "s", Ğ: "g", Ü: "u", Ö: "o", Ç: "c" };
  return s
    .toLowerCase()
    .replace(/[ıİşğüöçŞĞÜÖÇ]/g, (m) => map[m] ?? m)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || `bolum-${Math.random().toString(36).slice(2, 7)}`;
}

export function slugifySection(s: string): string {
  return slugify(s);
}

// ─── Template generator (works without any API key) ───────────────────────────
type Tpl = { name: string; products: [string, string, number][] };

const TEMPLATES: Record<string, Tpl[]> = {
  restoran: [
    { name: "Başlangıçlar", products: [["Mercimek Çorbası", "Limon ve tereyağı ile sıcak servis", 70], ["Humus Tabağı", "Zeytinyağı ve limon ile", 90], ["Sigara Böreği", "El açması, 6 adet", 85], ["Mevsim Salata", "Mevsim yeşillikleri ve nar ekşisi", 80]] },
    { name: "Ana Yemekler", products: [["Izgara Köfte", "Pilav ve mevsim sebzeleri ile", 220], ["Tavuk Şiş", "Yoğurt sosu ile", 195], ["Kuzu Pirzola", "Izgara sebzeler ile", 380], ["Mantı", "Yoğurt ve naneli tereyağı", 180]] },
    { name: "Tatlılar", products: [["Baklava", "Fıstıklı, 4 dilim", 140], ["Künefe", "Antep fıstığı ile sıcak", 130], ["Sütlaç", "Fırında, tarçınlı", 75]] },
    { name: "İçecekler", products: [["Ayran", "Ev yapımı", 35], ["Şalgam", "Acılı/acısız", 30], ["Türk Kahvesi", "Orta şekerli", 45], ["Limonata", "Taze sıkılmış", 50]] },
  ],
  kafe: [
    { name: "Kahvaltı", products: [["Serpme Kahvaltı", "2 kişilik, sınırsız çay", 320], ["Menemen", "Domates, biber, tereyağı", 110], ["Avokado Tost", "Ekşi maya ekmek, yumurta", 140], ["Granola Bowl", "Meyve ve yoğurt ile", 95]] },
    { name: "Kahveler", products: [["Espresso", "Çift çekim", 45], ["Latte", "Sıcak/buzlu", 65], ["Filtre Kahve", "Günün çekirdeği", 60], ["Mocha", "Belçika çikolatası ile", 75]] },
    { name: "Sandviç & Tost", products: [["Klub Sandviç", "Patates kızartması ile", 150], ["Tavuklu Wrap", "Ranch sos ile", 135], ["Karışık Tost", "Bol kaşar", 95]] },
    { name: "Tatlılar", products: [["Cheesecake", "Dutulmuş meyve sosu", 110], ["San Sebastian", "Kendi porsiyonunda", 130], ["Kek & Brownie", "Günün taze üretimi", 85]] },
  ],
  "fast food": [
    { name: "Burgerler", products: [["Classic Burger", "Dana köfte, cheddar, özel sos", 180], ["Double Cheese", "İki kat dana köfte", 240], ["Tavuk Burger", "Çıtır tavuk, mayonez", 160], ["Veggie Burger", "Falafel ve humus", 150]] },
    { name: "Yanında", products: [["Patates Kızartması", "Büyük boy", 60], ["Soğan Halkası", "8 adet", 70], ["Nugget", "9 adet, sos ile", 75]] },
    { name: "Menüler", products: [["Combo Menu", "Burger + patates + içecek", 250], ["Aile Menüsü", "4 burger, 4 patates, 4 içecek", 850], ["Çocuk Menüsü", "Mini burger + oyuncak", 120]] },
    { name: "İçecekler", products: [["Kola", "Kutu 330 ml", 40], ["Limonata", "Ev yapımı", 45], ["Milkshake", "Çikolata/vanilya/çilek", 70]] },
  ],
  "tatlı": [
    { name: "Pastalar", products: [["Çikolatalı Pasta", "Bitter çikolata, 1 dilim", 120], ["San Sebastian", "Kendi porsiyonunda", 130], ["Tiramisu", "İtalyan usulü", 115]] },
    { name: "Şerit Tatlılar", products: [["Fıstıklı Baklava", "1 kg", 650], ["Künefe", "Sıcak servis", 130], ["Şöbiyet", "1 kg", 700]] },
    { name: "Dondurmalı", products: [["Profiterol", "Sıcak çikolata sosu", 95], ["Dondurma Kase", "3 top, süsleme ile", 85], ["Waffle", "Meyve ve çikolata ile", 140]] },
  ],
  bar: [
    { name: "Kokteyller", products: [["Mojito", "Nane, lime, rom", 160], ["Margarita", "Tekila, lime, tuz", 170], ["Piña Colada", "Ananas, hindistan cevizi", 165]] },
    { name: "Bira & Şarap", products: [["Fıçı Bira", "Lokal, 400 ml", 90], ["Ev Şarabı", "Kırmızı/beyaz, kadeh", 110], ["Şişke Şarap", "Seçkili", 550]] },
    { name: "Atıştırmalıklar", products: [["Patates Tabağı", "Parmesan ve trüf yağı", 95], ["Peynir Tabağı", "4 çeşit, üzüm ile", 220], ["Cızlız", "Sucuklu kaşarlı", 130]] },
  ],
  otel: [
    { name: "Oda Servisi", products: [["Klasik Burger", "Odanızda servis", 220], ["Sezar Salat", "Tavuklu", 180], ["Makarna", "Domates soslu", 170]] },
    { name: "Kahvaltı Bufesi", products: [["Açık Büfe", "Kişi başı, sınırsız", 350], ["Çocuk Kahvaltısı", "0-6 yaş", 150]] },
    { name: "Restoran", products: [["Günün Menüsü", "3 servis, şefin seçimi", 450], ["Izgara Karışık", "Et ve deniz ürünleri", 520]] },
  ],
};

function templateDraft(businessType: string, cuisineHint: string, maxSections: number, perSection: number): MenuDraft {
  const key = Object.keys(TEMPLATES).find((k) => businessType.toLowerCase().includes(k) || (cuisineHint ?? "").toLowerCase().includes(k)) ?? "restoran";
  const picked = TEMPLATES[key].slice(0, maxSections);
  return {
    sections: picked.map((s) => ({
      name: s.name,
      slug: slugifySection(s.name),
      products: s.products.slice(0, perSection).map(([name, description, price]) => ({
        name,
        description,
        price: Number(price.toFixed(2)),
      })),
    })),
  };
}

// ─── AI generator (used when an API key is configured) ────────────────────────
async function aiDraft(input: z.infer<typeof generateInputSchema>, cfg: { baseUrl: string; key: string; model: string }): Promise<MenuDraft> {
  const system =
    "Sen bir restoran menü uzmanısın. Türkçe, iştah açıcı ama kısa ürün açıklamaları yazarsın. " +
    "Sadece geçerli JSON döndürürsün. Fiyatlar TRY cinsinden makul olmalı.";
  const user =
    `Şu işletme türü için menü taslağı oluştur: ${input.businessType}.` +
    (input.cuisineHint ? ` Mutfak/tema notu: ${input.cuisineHint}.` : "") +
    ` Tam olarak ${input.sections} bölüm ve her bölümde ${input.productsPerSection} ürün olsun.` +
    ` Yanıt biçimi: {"sections":[{"name":"...","products":[{"name":"...","description":"...","price":123}]}]}`;

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.key}` },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`AI sağlayıcısı hata döndürdü (HTTP ${res.status}).`);
  const data: any = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("AI yanıtı anlaşılamadı.");
  const parsed = draftSchema.safeParse(JSON.parse(content));
  if (!parsed.success) throw new Error("AI yanıtı beklenen biçimde değil.");
  return parsed.data;
}

/** Generates a menu draft: real AI when a key is configured, deterministic templates otherwise. */
export async function generateMenuDraft(body: unknown): Promise<GenerateResult> {
  const input = generateInputSchema.parse(body);
  const cfg = aiConfig();
  if (!cfg) return { source: "template", draft: templateDraft(input.businessType, input.cuisineHint ?? "", input.sections, input.productsPerSection) };
  try {
    return { source: "ai", model: cfg.model, draft: await aiDraft(input, cfg) };
  } catch {
    // Provider outages must never block menu work: fall back to templates.
    return { source: "template", draft: templateDraft(input.businessType, input.cuisineHint ?? "", input.sections, input.productsPerSection) };
  }
}
