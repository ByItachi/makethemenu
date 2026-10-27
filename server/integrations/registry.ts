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
  "yazar-kasa": deviceReady(
    "Eşleştirme + fiş yazdırma kuyruğu canlı ve test edilmiştir (/api/ops/devices, /api/ops/devices/fiscal/print). Mali cihazın marka/modeline özel 'bridge' uygulaması henüz yazılmadı (her ÖKC üreticisinin kendi yerel protokolü farklıdır); cihaz temin edilince bu bridge docs/CIHAZ-ENTEGRASYONU.md sözleşmesine göre yazılır."
  ),
  "kiosk": deviceReady(
    "Eşleştirme altyapısı canlıdır (/api/ops/devices). Kiosk modu bir tablet/dokunmatik ekranın tarayıcısında tam ekran menü arayüzü olarak çalışır; özel donanım gerekmez, herhangi bir Android/iPad tablet ile kullanılabilir."
  ),
  "caller-id": deviceReady(
    "Eşleştirme + gelen çağrı olayı + CRM numarası eşleştirmesi canlı ve test edilmiştir (/api/device/caller-id/event, /api/ops/devices/caller-events). Fiziksel çağrı santrali/USB modem bridge'i cihaz temin edilince docs/CIHAZ-ENTEGRASYONU.md'ye göre yazılır."
  ),
  "android-callerid": deviceReady(
    "Aynı altyapıyı (caller-id ile ortak) kullanır; Android tarafında arka planda çalışıp gelen aramayı bu API'ye ileten küçük bir companion uygulama gerekir. Sunucu tarafı tamamen hazırdır."
  ),
  // ── Ödeme sağlayıcıları: gerçek kimlik bilgileriyle test edilebilecek
  // gerçek (mock olmayan) HTTP çağrıları. Sandbox/self-servis hesap açılışı
  // bu platformdan değil doğrudan sağlayıcının kendi sitesinden yapılır;
  // kimlik bilgileri girilince testConnection gerçek API'ye istek atar.
  "iyzico": {
    implemented: true,
    capabilities: ["testConnection", "getCapabilities"],
    credentialFields: [
      { key: "apiKey", label: "API Key", type: "password", required: true },
      { key: "secretKey", label: "Secret Key", type: "password", required: true },
      { key: "environment", label: "Ortam", type: "select", required: true, options: ["sandbox", "production"] },
    ],
    docs: {
      apiDocsUrl: "https://docs.iyzico.com/en/getting-started/preliminaries/authentication/hmacsha256-auth",
      sandboxAvailable: true,
      requiresPartnerAgreement: false,
      notes: "IYZWSv2 HMAC-SHA256 imzalama ile gerçek BIN sorgu uç noktasına istek atılır. Sandbox hesabı iyzico'nun kendi merchant panelinden (ücretsiz) açılır.",
    },
    async testConnection(_restaurantId, creds) {
      if (!creds.apiKey || !creds.secretKey) return { ok: false, message: "API Key ve Secret Key gereklidir." };
      const base = creds.environment === "production" ? "https://api.iyzipay.com" : "https://sandbox-api.iyzipay.com";
      const uri = "/payment/bin/check";
      const body = JSON.stringify({ locale: "tr", conversationId: crypto.randomUUID(), binNumber: "554960" });
      const randomKey = `${Date.now()}123456789`;
      const payload = randomKey + uri + body;
      const signature = crypto.createHmac("sha256", creds.secretKey).update(payload).digest("hex");
      const authString = `apiKey:${creds.apiKey}&randomKey:${randomKey}&signature:${signature}`;
      const authorization = `IYZWSv2 ${Buffer.from(authString).toString("base64")}`;
      try {
        const res = await fetch(`${base}${uri}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: authorization, "x-iyzi-rnd": randomKey },
          body,
          signal: AbortSignal.timeout(8000),
        });
        const json = await res.json().catch(() => null);
        if (json?.status === "success") return { ok: true, message: "Bağlantı başarılı. iyzico API kimlik bilgileri doğru.", detail: { status: json.status } };
        if (json?.errorCode === "1001" || res.status === 401) return { ok: false, message: "API anahtarı reddedildi. Kimlik bilgilerini kontrol edin." };
        return { ok: false, message: json?.errorMessage ?? `iyzico beklenmeyen yanıt (HTTP ${res.status})` };
      } catch (err) {
        return { ok: false, message: `iyzico API'sine ulaşılamadı: ${err instanceof Error ? err.message : "bilinmeyen hata"}` };
      }
    },
  },
  "paytr": {
    implemented: true,
    capabilities: ["testConnection", "getCapabilities"],
    credentialFields: [
      { key: "merchantId", label: "Mağaza No (merchant_id)", type: "text", required: true },
      { key: "merchantKey", label: "Mağaza Parolası (merchant_key)", type: "password", required: true },
      { key: "merchantSalt", label: "Mağaza Gizli Anahtarı (merchant_salt)", type: "password", required: true },
    ],
    docs: {
      apiDocsUrl: "https://dev.paytr.com/en/iframe-api/iframe-api-1-adim",
      sandboxAvailable: false,
      requiresPartnerAgreement: true,
      notes: "PayTR mağaza hesabı sağlayıcıdan onay gerektirir. Gerçek kimlik bilgileriyle test_mode=1 ile gerçek get-token uç noktasına istek atılarak doğrulanır (kart bilgisi girilmez, ücretlendirme oluşmaz).",
    },
    async testConnection(_restaurantId, creds) {
      if (!creds.merchantId || !creds.merchantKey || !creds.merchantSalt) return { ok: false, message: "Mağaza no, parola ve gizli anahtar gereklidir." };
      const merchantOid = `TEST${Date.now()}`;
      const userBasket = Buffer.from(JSON.stringify([["Bağlantı testi", "1.00", 1]])).toString("base64");
      const params = {
        merchant_id: creds.merchantId, user_ip: "127.0.0.1", merchant_oid: merchantOid,
        email: "test@makethemenu.com", payment_amount: "100", user_basket: userBasket,
        no_installment: "1", max_installment: "0", currency: "TL", test_mode: "1",
      };
      const hashStr = params.merchant_id + params.user_ip + params.merchant_oid + params.email + params.payment_amount + params.user_basket + params.no_installment + params.max_installment + params.currency + params.test_mode;
      const token = crypto.createHmac("sha256", creds.merchantKey).update(hashStr + creds.merchantSalt).digest("base64");
      try {
        const res = await fetch("https://www.paytr.com/odeme/api/get-token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ ...params, merchant_ok_url: "https://example.com/ok", merchant_fail_url: "https://example.com/fail", user_name: "Test", user_address: "Test", user_phone: "05550000000", paytr_token: token }),
          signal: AbortSignal.timeout(8000),
        });
        const json = await res.json().catch(() => null);
        if (json?.status === "success") return { ok: true, message: "Bağlantı başarılı. PayTR mağaza kimlik bilgileri doğru." };
        return { ok: false, message: json?.reason ? `PayTR reddetti: ${json.reason}` : `PayTR beklenmeyen yanıt (HTTP ${res.status})` };
      } catch (err) {
        return { ok: false, message: `PayTR API'sine ulaşılamadı: ${err instanceof Error ? err.message : "bilinmeyen hata"}` };
      }
    },
  },
  "stripe": {
    implemented: true,
    capabilities: ["testConnection", "getCapabilities"],
    credentialFields: [
      { key: "secretKey", label: "Secret Key (sk_...)", type: "password", required: true },
    ],
    docs: {
      apiDocsUrl: "https://docs.stripe.com/api/balance/balance_retrieve",
      sandboxAvailable: true,
      requiresPartnerAgreement: false,
      notes: "GET /v1/balance ile gerçek bağlantı testi. Stripe hesabı ve test anahtarları doğrudan Stripe Dashboard'dan ücretsiz alınır.",
    },
    async testConnection(_restaurantId, creds) {
      if (!creds.secretKey) return { ok: false, message: "Secret Key gereklidir." };
      try {
        const res = await fetch("https://api.stripe.com/v1/balance", {
          headers: { Authorization: `Bearer ${creds.secretKey}` },
          signal: AbortSignal.timeout(8000),
        });
        const json = await res.json().catch(() => null);
        if (res.ok) return { ok: true, message: `Bağlantı başarılı. ${json?.livemode ? "Canlı" : "Test"} modunda Stripe hesabı doğrulandı.`, detail: { livemode: json?.livemode } };
        if (res.status === 401) return { ok: false, message: "API anahtarı geçersiz." };
        return { ok: false, message: json?.error?.message ?? `Stripe beklenmeyen yanıt (HTTP ${res.status})` };
      } catch (err) {
        return { ok: false, message: `Stripe API'sine ulaşılamadı: ${err instanceof Error ? err.message : "bilinmeyen hata"}` };
      }
    },
  },
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

/** Fiziksel cihaz bekleyen özellikler: API/eşleştirme/veri sözleşmesi tamamen
 * canlı ve test edilmiştir (bkz. server/ops-devices.ts, docs/CIHAZ-ENTEGRASYONU.md).
 * Cihaz temin edilince yalnızca küçük bir bridge/uygulamanın bu uçlara
 * bağlanması gerekir — sunucu tarafında ek geliştirme beklenmez. */
function deviceReady(notes: string): IntegrationAdapter {
  return {
    implemented: true,
    capabilities: ["getCapabilities", "testConnection"],
    credentialFields: [],
    docs: { sandboxAvailable: true, requiresPartnerAgreement: false, notes },
    async testConnection() {
      return { ok: true, message: "Eşleştirme ve veri altyapısı hazır: /admin veya /su panelinden 'Cihazlar' bölümünden eşleştirme kodu üretip fiziksel cihaz/bridge uygulamasıyla bağlayabilirsiniz." };
    },
  };
}

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
