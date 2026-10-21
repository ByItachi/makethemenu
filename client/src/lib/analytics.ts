// Google Analytics (GA4), Google Tag Manager ve Meta (Facebook) Pixel entegrasyonu.
// Gerçek kimlik girilmeden hiçbir harici betik yüklenmez; tüm kimlikler ortam değişkeninden okunur.
// Kullanım: .env dosyasına VITE_GA_ID / VITE_GTM_ID / VITE_FB_PIXEL_ID değerlerini girin.

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;
const GTM_ID = import.meta.env.VITE_GTM_ID as string | undefined;
const FB_PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID as string | undefined;

let initialized = false;

function injectScript(src: string, attrs: Record<string, string> = {}) {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  Object.entries(attrs).forEach(([k, v]) => script.setAttribute(k, v));
  document.head.appendChild(script);
  return script;
}

function initGoogleAnalytics(id: string) {
  injectScript(`https://www.googletagmanager.com/gtag/js?id=${id}`);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", id, { send_page_view: true });
}

function initGoogleTagManager(id: string) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
  injectScript(`https://www.googletagmanager.com/gtm.js?id=${id}`);

  const noscript = document.createElement("noscript");
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${id}`;
  iframe.height = "0";
  iframe.width = "0";
  iframe.style.display = "none";
  iframe.style.visibility = "hidden";
  noscript.appendChild(iframe);
  document.body.prepend(noscript);
}

function initFacebookPixel(id: string) {
  (function (f: any, b: Document, e: string, v: string) {
    if (f.fbq) return;
    const n: any = (f.fbq = function (...args: unknown[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode?.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  window.fbq?.("init", id);
  window.fbq?.("track", "PageView");
}

/** Sayfa yüklendiğinde bir kez çağrılır (ortam değişkenleri yoksa hiçbir şey yapmaz). */
export function initAnalytics() {
  if (initialized) return;
  initialized = true;
  if (GA_ID) initGoogleAnalytics(GA_ID);
  if (GTM_ID) initGoogleTagManager(GTM_ID);
  if (FB_PIXEL_ID) initFacebookPixel(FB_PIXEL_ID);
}

/** Rota değişiminde sayfa görüntüleme olayını ilgili araçlara bildirir. */
export function trackPageView(path: string) {
  if (GA_ID && window.gtag) window.gtag("event", "page_view", { page_path: path });
  if (FB_PIXEL_ID && window.fbq) window.fbq("track", "PageView");
}
