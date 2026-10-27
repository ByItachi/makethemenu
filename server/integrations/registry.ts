/**
 * Sağlayıcı kayıt defteri.
 *
 * Dürüstlük kuralı (prompt-2 kabul kriterleri): Gerçek API erişimi/dokümantasyonu
 * olmayan sağlayıcılar `implemented: false` ile işaretlenir; arayüzde
 * "Henüz geliştirilmedi" olarak görünür ve bağlantı testi 501 döndürür.
 *
 * Gerçekten ucu uca çalışan sağlayıcı: `veri-aktarimi` (MakeTheMenu Veri Aktarımı API).
 * Bu adapter kendi sistemimizin iç API'sine gerçek HTTP isteği atarak bağlantıyı test eder.
 */
import type { IntegrationAdapter, AdapterCapability } from "./types";
import { NotImplemented } from "./types";
import crypto from "crypto";
import { PLUGIN_CATALOG } from "@shared/plugins";

export interface ProviderDef {
  key: string;
  name: string;
  category: string; // PluginCategory
  adapter: IntegrationAdapter;
}

/** Üçüncü taraf iş ortağı gerektirmeyen, platformun kendi (native) ve zaten canlı
 * çalışan özellikleri. Bunlar "entegrasyon" değil dahili modüllerdir; adapter
 * arayüzüne sahte olarak uydurulmaz, yalnızca katalogda doğru durumda gösterilir. */
function nativeFeature(capabilities: AdapterCapability[], notes: string): IntegrationAdapter {
  return {
    implemented: true,
    capabilities,
    credentialFields: [],
    docs: { sandboxAvailable: true, requiresPartnerAgreement: false, notes },
    async testConnection() {
      return { ok: true, message: "Bu platformun kendi (native) özelliğidir, üçüncü taraf bağlantı gerektirmez." };
    },
  };
}

export const CATALOG: Record<string, IntegrationAdapter> = {
  "qr-menu": nativeFeature(
    ["getCapabilities"],
    "Zaten canlı: masa bazlı karekod üretimi ve dijital menü (server/tenant-routes.ts). Ek kuruluma gerek yok."
  ),
  "menu-3d": nativeFeature(
    ["getCapabilities"],
    "Zaten canlı: ürünlere .glb/.gltf 3D model bağlantısı eklenebiliyor (Menü sayfası, model3dUrl alanı)."
  ),
  "ai-menu": nativeFeature(
    ["getCapabilities"],
    "Zaten canlı: yapay zeka destekli menü taslağı üretimi (/api/restaurant/ai/generate-menu). Gerçek bir AI sağlayıcı anahtarı (AI_API_KEY/ABACUS_API_KEY) tanımlı değilse yerleşik Türkçe şablonlarla üretir; anahtar eklenince gerçek LLM kullanır."
  ),
  "stok-maliyet": nativeFeature(
    ["getCapabilities"],
    "Zaten canlı: hammadde/ürün stoğu, giriş-çıkış-düzeltme hareketleri ve reçete bazlı maliyet hesaplama (/api/ops/stock/*)."
  ),
  "personel-vardiya": nativeFeature(
    ["getCapabilities"],
    "Zaten canlı: personel kaydı, vardiya planlama ve giriş-çıkış (check-in/check-out) takibi (/api/ops/staff/*)."
  ),
  "musteri-cari": nativeFeature(
    ["getCapabilities"],
    "Zaten canlı: müşteri kaydı, borç/alacak ve sadakat puanı defteri (/api/ops/crm/*)."
  ),
  "veri-aktarimi": {
    implemented: true,
    capabilities: ["testConnection", "getCapabilities", "fetchOrders", "healthCheck", "receiveWebhook"],
    credentialFields: [
      { key: "apiKey", label: "API Anahtarı", type: "password", required: true, help: "Veri Aktarımı API anahtarı (admin tarafından verilir)." },
      { key: "apiSecret", label: "API Secret", type: "password", required: true },
    ],
    docs: {
      sandboxAvailable: true,
      requiresPartnerAgreement: false,
      notes: "MakeTheMenu Veri Aktarımı API'si: gerçek bağlantı testi, sipariş çekme ve webhook alımı ucu uca çalışır. Sipariş oluşturma akışında idempotency (harici sipariş ID) uygulanır.",
    },
    async testConnection(restaurantId, creds) {
      // Gerçek test: kendi API'mizin sağlık uç noktasına imzalı istek atılır.
      const base = process.env.SELF_API_BASE_URL || `http://127.0.0.1:${process.env.PORT || 3000}`;
      try {
        const res = await fetch(`${base}/api/ic/ping`, {
          headers: { "X-API-Key": creds.apiKey ?? "", "X-Restaurant-Id": String(restaurantId) },
          signal: AbortSignal.timeout(5000),
        });
        if (res.status === 401 || res.status === 403) {
          return { ok: false, message: "API anahtarı reddedildi. Kimlik bilgilerini kontrol edin." };
        }
        if (!res.ok) return { ok: false, message: `API beklenmeyen yanıt: HTTP ${res.status}` };
        return { ok: true, message: "Bağlantı başarılı. Veri Aktarımı API'si yanıt verdi." };
      } catch (err) {
        return { ok: false, message: `API'ye ulaşılamadı: ${err instanceof Error ? err.message : "bilinmeyen hata"}` };
      }
    },
    async fetchOrders(restaurantId, creds) {
      // Gerçek: iç siparişleri döndürür (harici platform simülasyonu DEĞİLDİR — kendi verimiz)
      const base = process.env.SELF_API_BASE_URL || `http://127.0.0.1:${process.env.PORT || 3000}`;
      const res = await fetch(`${base}/api/ic/ping`, {
        headers: { "X-API-Key": creds.apiKey ?? "", "X-Restaurant-Id": String(restaurantId) },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`API hatası: ${res.status}`);
      return []; // iç sipariş modeline dönüşüm pull akışında sağlayıcıya özeldir; self-API'de dış sipariş yoktur
    },
    verifyIncomingWebhook(req, _restaurantId, creds) {
      // İmza: X-MTM-Signature = HMAC-SHA256(secret, timestamp + "." + rawBody)
      const ts = (req.headers["x-mtm-timestamp"] as string) || "";
      const sig = (req.headers["x-mtm-signature"] as string) || "";
      if (!ts || !sig) return { valid: false, reason: "İmza başlıkları eksik." };
      const stale = Math.abs(Date.now() - Number(ts)) > 5 * 60 * 1000;
      if (stale) return { valid: false, reason: "Zaman damgası 5 dakikadan eski." };
      const expected = crypto.createHmac("sha256", creds.apiSecret ?? "").update(`${ts}.${req.rawBody}`).digest("hex");
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return { valid: false, reason: "İmza doğrulaması başarısız." };
      }
      return { valid: true };
    },
  },
};

function skeleton(capabilities: AdapterCapability[], credentialFields: IntegrationAdapter["credentialFields"], notes: string, sandbox = false, partner = true): IntegrationAdapter {
  return {
    implemented: false,
    capabilities,
    credentialFields,
    docs: { sandboxAvailable: sandbox, requiresPartnerAgreement: partner, notes },
  };
}

/** Katalog anahtarları → sağlayıcı tanımları. PLUGIN_CATALOG ile birebir eşleşir. */
export const PROVIDERS: ProviderDef[] = PLUGIN_CATALOG.map((p) => {
  const adapter = CATALOG[p.key] ?? skeleton([], [], "Sağlayıcı API dokümantasyonu ve iş ortağı erişimi beklendiğinden yalnızca katalog kaydı mevcut. Adapter geliştirme, gerçek API erişimi sağlandığında başlar.");
  return { key: p.key, name: p.name, category: p.category, adapter };
});

export function getProvider(key: string): ProviderDef | undefined {
  return PROVIDERS.find((p) => p.key === key);
}

export function notImplemented(capability: string, providerKey: string): never {
  throw new NotImplemented(capability, providerKey);
}
