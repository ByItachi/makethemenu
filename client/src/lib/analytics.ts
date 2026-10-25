/**
 * Ölçümleme altyapısı: GTM / GA4 / Meta Pixel yükleyicileri, rıza (consent) yönetimi
 * ve ortak olay izleme. Hiçbir gerçek API anahtarı burada tutulmaz; ID'ler admin
 * panelinden (analytics_settings tablosu) yönetilir ve public API'den okunur.
 *
 * Çift tetiklenme kuralı: GA4 etiketi GTM üzerinden geliyorsa ayrıca gtag.js yüklenmez.
 * trackEvent -> dataLayer + gtag (yalnızca doğrudan gtag.js varken) + fbq.
 */

export interface ConsentState {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  ts: number;
}

/** CookieConsent component'i ile paylaşılan anahtar: tek kaynak. */
export const CONSENT_KEY = "cookieConsent";

/** Varsayılan: yalnızca zorunlu çerezler. Rıza verilene dek ölçüm etiketleri yüklenmez. */
export function readConsent(): ConsentState {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ConsentState>;
      return {
        necessary: true,
        analytics: !!parsed.analytics,
        marketing: !!parsed.marketing,
        preferences: !!parsed.preferences,
        ts: typeof parsed.ts === "number" ? parsed.ts : Date.now(),
      };
    }
  } catch {
    // bozuk kayıt: varsayılana dön
  }
  return { necessary: true, analytics: false, marketing: false, preferences: false, ts: Date.now() };
}

export function hasUserDecided(): boolean {
  try {
    return !!localStorage.getItem(CONSENT_KEY);
  } catch {
    return false;
  }
}

export function writeConsent(state: Omit<ConsentState, "necessary" | "ts">) {
  const full: ConsentState = { necessary: true, ...state, ts: Date.now() };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ ...full, decidedAt: new Date().toISOString() }));
  } catch {
    // localStorage kapalı olabilir: tercih bu oturumda uygulanır, kalıcı olmaz
  }
  window.dispatchEvent(new CustomEvent("mtm:consent", { detail: full }));
  return full;
}

interface AnalyticsSettingsPublic {
  consentRequired: boolean;
  enableInDev: boolean;
  gtm: { id: string } | null;
  ga4: { id: string; viaGtm: boolean } | null;
  pixel: { id: string } | null;
}

let settings: AnalyticsSettingsPublic | { consentRequired: true; enableInDev: false; gtm: null; ga4: null; pixel: null } = {
  consentRequired: true,
  enableInDev: false,
  gtm: null,
  ga4: null,
  pixel: null,
};
let initialized = false;
const loaded = { gtm: false, ga4: false, pixel: false };

function isDev(): boolean {
  return import.meta.env.DEV === true;
}

function injectScript(src: string, id: string, async = true) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.src = src;
  s.async = async;
  s.id = id;
  document.head.appendChild(s);
}

function injectInline(id: string, code: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.type = "text/javascript";
  s.id = id;
  s.textContent = code;
  document.head.appendChild(s);
}

/** Google Consent Mode v2: rızaya göre gtag davranışını ayarlar (etiket yüklü değilken de çalışır). */
function updateConsentMode(consent: ConsentState) {
  window.dataLayer = window.dataLayer || [];
  const gtag = function (...args: unknown[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).dataLayer.push(args);
  };
  gtag("consent", "update", {
    ad_storage: consent.marketing ? "granted" : "denied",
    ad_user_data: consent.marketing ? "granted" : "denied",
    ad_personalization: consent.marketing ? "granted" : "denied",
    analytics_storage: consent.analytics ? "granted" : "denied",
    functionality_storage: "granted",
    security_storage: "granted",
  });
}

function loadGtm(id: string) {
  if (loaded.gtm) return;
  loaded.gtm = true;
  injectInline("mtm-gtm-init", `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`);
}

function loadGa4Direct(id: string) {
  if (loaded.ga4) return;
  loaded.ga4 = true;
  injectInline("mtm-ga4-init", `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=window.gtag||gtag;gtag('js',new Date());gtag('config','${id}',{send_page_view:true});`);
  injectScript(`https://www.googletagmanager.com/gtag/js?id=${id}`, "mtm-ga4-js");
}

function loadMetaPixel(id: string) {
  if (loaded.pixel) return;
  loaded.pixel = true;
  injectInline("mtm-fbq-init", `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');`);
}

/** Ayarları çeker ve rızaya göre etiketleri yükler. Uygulama açılışında bir kez çağrılır. */
export async function initAnalytics() {
  if (initialized) return;
  initialized = true;
  try {
    const res = await fetch("/api/analytics/settings", { credentials: "omit" });
    if (res.ok) settings = await res.json();
  } catch {
    return; // ayarlar alınamadı: hiçbir etiket yüklenmez
  }
  applyTagsForConsent(readConsent());
}

/** Rızaya göre etiket yükleme/çıkarma davranışı. Banner ve tercih değişikliğinde çağrılır. */
export function applyTagsForConsent(consent: ConsentState) {
  updateConsentMode(consent);
  if (isDev() && !settings.enableInDev) return; // dev ortamında etiket yükleme (ayar açıksa test amaçlı yüklenir)

  if (settings.gtm && consent.analytics) loadGtm(settings.gtm.id);
  if (settings.ga4 && !settings.ga4.viaGtm && consent.analytics) loadGa4Direct(settings.ga4.id);
  if (settings.pixel && consent.marketing) loadMetaPixel(settings.pixel.id);
}

export function isConsentRequired(): boolean {
  return settings.consentRequired !== false;
}

/** GA4 standart olay adı -> Meta Pixel standart olayı eşlemesi. */
const META_EVENT_MAP: Record<string, string> = {
  view_item: "ViewContent",
  search: "Search",
  generate_lead: "Lead",
  sign_up: "CompleteRegistration",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
};

export type TrackParams = Record<string, string | number | boolean | undefined | null>;

/**
 * Ortak olay gönderimi. GA4 doğrudan gtag.js ile yüklenmişse gtag('event', ...) çağrılır;
 * GA4 GTM üzerinden geliyorsa yalnızca dataLayer'a push edilir (GTM tetikleyicileri ölçer)
 * — aynı olay hem dataLayer hem gtag'e gitmez, böylece çift ölçüm olmaz.
 */
export function trackEvent(name: string, params: TrackParams = {}) {
  const consent = readConsent();
  // Rıza verilmeden ölçüm olayı gönderilmez (zorunlu çerezler hariç işlev yok).
  if (isDev() && !settings.enableInDev) {
    // dev: konsoldan doğrulanabilir, ağa gitmez
    console.debug(`[analytics] ${name}`, params);
    return;
  }
  const analyticsAllowed = consent.analytics;
  const marketingAllowed = consent.marketing;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...params });

  const ga4Direct = settings.ga4 && !settings.ga4.viaGtm && loaded.ga4;
  if (analyticsAllowed && ga4Direct && typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }

  const metaName = META_EVENT_MAP[name] ?? null;
  if (marketingAllowed && metaName && loaded.pixel && typeof window.fbq === "function") {
    window.fbq("track", metaName, params);
  }
}

/** SPA route değişiminde sayfa gösterimi. Çift tetiklenmez: yalnızca çağrıldığı yerde ateşlenir. */
export function trackPageView(path: string, title?: string) {
  trackEvent("page_view", { page_path: path, page_title: title ?? document.title });
}

  // window globals declaration
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

/** Rıza değişikliğini dinleyip etiket davranışını güncelleyen köprü (App'te bir kez kurulur). */
export function watchConsentChanges() {
  window.addEventListener("mtm:consent", (e) => {
    const detail = (e as CustomEvent<ConsentState>).detail;
    if (detail) applyTagsForConsent(detail);
  });
}
