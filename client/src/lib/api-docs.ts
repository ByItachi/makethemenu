/**
 * API dokümantasyonu veri kaynağı.
 * Tüm uç noktalar sunucu kodundan doğrulanmıştır:
 * server/routes.ts, server/auth/routes.ts, server/tenant-routes.ts,
 * server/payments/routes.ts, server/domains.ts, server/plugins.ts,
 * server/analytics.ts, server/ai/routes.ts, server/admin-templates.ts,
 * server/csv-export.ts, server/seo.ts, shared/routes.ts, shared/schema.ts.
 *
 * Kural: projede bulunmayan API varmış gibi gösterilmez.
 */

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface ApiParam {
  name: string;
  loc: "path" | "query" | "body" | "header";
  type: string;
  required?: boolean;
  desc: string;
}

export interface ApiResponseExample {
  status: number;
  label?: string;
  body: string;
}

export interface ApiError {
  status: number;
  when: string;
}

export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  summary: string;
  description?: string;
  /** Yetkilendirme etiketi */
  auth: "Gerekmiyor" | "Oturum çerezi" | "Oturum + işletme" | "Platform yöneticisi" | "HMAC imzası";
  params?: ApiParam[];
  curl?: string;
  js?: string;
  /** Parametre tablosunun altında gösterilen ek not (ör. Idempotency-Key). */
  headersNote?: string;
  responses: ApiResponseExample[];
  errors?: ApiError[];
}

export interface ApiSection {
  id: string;
  title: string;
  intro?: string;
  endpoints: ApiEndpoint[];
}

/** Yöntem + yol üzerinden benzersiz, kararlı anchor kimliği. */
export function endpointId(ep: Pick<ApiEndpoint, "method" | "path">): string {
  const raw = `${ep.method} ${ep.path}`.toLowerCase();
  return raw.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const AUTH_401: ApiError = { status: 401, when: "Oturum yok veya süresi dolmuş (Giriş yapmanız gerekiyor.)" };
const TENANT_403: ApiError = { status: 403, when: "Hesaba bağlı işletme yok (Hesabınıza bağlı bir işletme yok.)" };

const JSON_HEADER = `-H "Content-Type: application/json" \\`;

export const apiSections: ApiSection[] = [
  {
    id: "baslangic",
    title: "Başlangıç",
    intro:
      "API, siteyle aynı alan adında (same-origin) çalışır. Tüm istekler JSON döner; kimlik doğrulama oturum çerezi (mtm.sid) ile yapılır — Bearer token kullanılmaz.",
    endpoints: [
      {
        method: "GET",
        path: "/api/health",
        summary: "Servis ve veritabanı durumunu döner (load balancer / uptime izleme için).",
        auth: "Gerekmiyor",
        curl: `curl https://makethemenu.com/api/health`,
        responses: [
          {
            status: 200,
            body: `{
  "status": "ok",
  "database": "ok",
  "time": "2026-04-20T10:15:00.000Z"
}`,
          },
          {
            status: 503,
            label: "Veritabanı erişilemiyor",
            body: `{
  "status": "degraded",
  "database": "error",
  "time": "2026-04-20T10:15:00.000Z"
}`,
          },
        ],
      },
      {
        method: "GET",
        path: "/api/plans",
        summary: "Yayımlanmış abonelik planlarını ve fiyatlarını listeler.",
        auth: "Gerekmiyor",
        curl: `curl https://makethemenu.com/api/plans`,
        responses: [
          {
            status: 200,
            body: `[
  {
    "code": "baslangic",
    "name": "Başlangıç",
    "priceMonthly": 149,
    "priceYearly": 1490,
    "maxProducts": 50,
    "maxTables": 10
  }
]`,
          },
        ],
      },
    ],
  },
  {
    id: "kimlik-dogrulama",
    title: "Kimlik Doğrulama",
    intro:
      "Kimlik doğrulama oturum çerezi üzerinden yapılır. Giriş başarısızlığında 401 yerine 200 + {ok:false, message} zarfı döner; kötüye kullanıma karşı oran limitleri ve denetim kaydı etkindir.",
    endpoints: [
      {
        method: "POST",
        path: "/api/auth/register",
        summary: "Yeni işletme sahibi kaydı açar; işletme + Owner rolü oluşturulur ve oturum başlatılır.",
        auth: "Gerekmiyor",
        params: [
          { name: "email", loc: "body", type: "string", required: true, desc: "Geçerli e-posta, en fazla 255 karakter." },
          { name: "password", loc: "body", type: "string", required: true, desc: "8–128 karakter." },
          { name: "fullName", loc: "body", type: "string", required: true, desc: "Ad soyad, en az 2 karakter." },
          { name: "businessName", loc: "body", type: "string", required: true, desc: "İşletme adı; menü adresi (slug) bundan üretilir." },
        ],
        curl: `curl -X POST https://makethemenu.com/api/auth/register \\
  ${JSON_HEADER} \\
  -c cookies.txt \\
  -d '{"email":"sahip@isletme.com","password":"parola1234","fullName":"Ayşe Yılmaz","businessName":"Kahve Durağı"}'`,
        responses: [
          {
            status: 201,
            body: `{
  "id": 42,
  "username": "sahip-a1b2c3",
  "email": "sahip@isletme.com",
  "fullName": "Ayşe Yılmaz",
  "restaurantId": 17,
  "isPlatformAdmin": false,
  "isActive": true,
  "emailVerified": false,
  "restaurantSlug": "kahve-duragi"
}`,
          },
        ],
        errors: [
          { status: 400, when: "Alanlar doğrulamadan geçmiyor (ör. parola 8 karakterden kısa)." },
          { status: 409, when: "Bu e-posta ile bir hesap zaten var." },
          { status: 429, when: "Saatlik kayıt denemesi limiti aşıldı (varsayılan 10/saat)." },
        ],
      },
      {
        method: "POST",
        path: "/api/auth/login",
        summary: "E-posta veya kullanıcı adı ile giriş yapar; oturum çerezi verir.",
        auth: "Gerekmiyor",
        description:
          "Hatalı bilgide 401 değil, 200 + {ok:false, message} döner. Mesaj UI'da gösterilir; brute-force koruması oran limiti (429) ve denetim kaydıyla sağlanır.",
        params: [
          { name: "identifier", loc: "body", type: "string", required: true, desc: "E-posta veya kullanıcı adı." },
          { name: "password", loc: "body", type: "string", required: true, desc: "Parola." },
        ],
        curl: `curl -X POST https://makethemenu.com/api/auth/login \\
  ${JSON_HEADER} \\
  -c cookies.txt \\
  -d '{"identifier":"sahip@isletme.com","password":"parola1234"}'`,
        js: `const res = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ identifier, password }),
});
const data = await res.json();
if (data.ok === false) {
  // Hatalı parola: data.message UI'da gösterilir
  showError(data.message);
} else {
  // Oturum açıldı: data bir kullanıcı nesnesidir
}`,
        responses: [
          {
            status: 200,
            label: "Başarılı giriş",
            body: `{
  "id": 42,
  "username": "sahip-a1b2c3",
  "email": "sahip@isletme.com",
  "fullName": "Ayşe Yılmaz",
  "restaurantId": 17,
  "isPlatformAdmin": false,
  "isActive": true,
  "emailVerified": false
}`,
          },
          {
            status: 200,
            label: "Hatalı e-posta/parola",
            body: `{
  "ok": false,
  "message": "E-posta veya parola hatalı."
}`,
          },
        ],
        errors: [
          { status: 400, when: "E-posta ve parola alanları eksik." },
          { status: 429, when: "15 dakikalık pencerede deneme limiti aşıldı (varsayılan 20)." },
        ],
      },
      {
        method: "GET",
        path: "/api/auth/user",
        summary: "Oturumdaki kullanıcıyı döner. Oturum yoksa 401 değil 200 + null döner.",
        auth: "Gerekmiyor",
        js: `const res = await fetch("/api/auth/user");
const user = await res.json(); // null ise misafir oturum`,
        responses: [
          {
            status: 200,
            label: "Oturum açık",
            body: `{
  "id": 42,
  "username": "sahip-a1b2c3",
  "email": "sahip@isletme.com",
  "fullName": "Ayşe Yılmaz",
  "restaurantId": 17,
  "isPlatformAdmin": false,
  "isActive": true,
  "emailVerified": true,
  "impersonatedBy": null
}`,
          },
          { status: 200, label: "Misafir", body: `null` },
        ],
      },
      {
        method: "POST",
        path: "/api/auth/logout",
        summary: "Oturumu kapatır ve çereyi temizler.",
        auth: "Oturum çerezi",
        curl: `curl -X POST https://makethemenu.com/api/auth/logout \\
  -b cookies.txt -c cookies.txt`,
        responses: [{ status: 200, body: `{ "ok": true }` }],
        errors: [AUTH_401],
      },
      {
        method: "POST",
        path: "/api/auth/verify-email",
        summary: "Kayıt sonrası gönderilen bağlantıdaki token ile e-postayı doğrular.",
        auth: "Gerekmiyor",
        params: [{ name: "token", loc: "body", type: "string", required: true, desc: "20–128 karakter doğrulama token'ı; 24 saat geçerli." }],
        responses: [{ status: 200, body: `{ "ok": true }` }],
        errors: [
          { status: 400, when: "Token geçersiz veya süresi dolmuş." },
          { status: 429, when: "Saatlik doğrulama denemesi limiti aşıldı (varsayılan 5)." },
        ],
      },
      {
        method: "POST",
        path: "/api/auth/resend-verification",
        summary: "Doğrulama e-postasını yeniden gönderir.",
        auth: "Oturum çerezi",
        responses: [
          { status: 200, label: "E-posta gönderildi", body: `{ "ok": true }` },
          { status: 200, label: "Zaten doğrulanmış", body: `{ "ok": true, "alreadyVerified": true }` },
        ],
        errors: [AUTH_401],
      },
      {
        method: "POST",
        path: "/api/auth/forgot-password",
        summary: "Parola sıfırlama bağlantısı gönderir. Hesap var/yok ayrımı yapılmaz.",
        auth: "Gerekmiyor",
        params: [{ name: "email", loc: "body", type: "string", required: true, desc: "Kayıtlı e-posta." }],
        curl: `curl -X POST https://makethemenu.com/api/auth/forgot-password \\
  ${JSON_HEADER} \\
  -d '{"email":"sahip@isletme.com"}'`,
        responses: [
          {
            status: 200,
            body: `{ "message": "Bu e-posta kayıtlıysa parola sıfırlama bağlantısı gönderildi." }`,
          },
        ],
        errors: [{ status: 429, when: "Saatlik istek limiti aşıldı (varsayılan 5)." }],
      },
      {
        method: "POST",
        path: "/api/auth/reset-password",
        summary: "Sıfırlama token'ı ile parolayı değiştirir; tüm sıfırlama token'larını geçersiz kılar.",
        auth: "Gerekmiyor",
        params: [
          { name: "token", loc: "body", type: "string", required: true, desc: "E-postayla gelen token; 1 saat geçerli." },
          { name: "password", loc: "body", type: "string", required: true, desc: "Yeni parola, 8–128 karakter." },
        ],
        responses: [{ status: 200, body: `{ "ok": true }` }],
        errors: [{ status: 400, when: "Bağlantı geçersiz veya süresi dolmuş." }],
      },
      {
        method: "GET",
        path: "/api/auth/security-events",
        summary: "Oturumdaki kullanıcının son 50 kimlik doğrulama olayını (güvenlik zaman çizelgesi) döner.",
        auth: "Oturum çerezi",
        responses: [
          {
            status: 200,
            body: `[
  {
    "id": 918,
    "action": "auth.login",
    "ip": "203.0.113.7",
    "createdAt": "2026-04-20T09:03:11.000Z"
  }
]`,
          },
        ],
        errors: [AUTH_401],
      },
    ],
  },
  {
    id: "hesap-ve-profil",
    title: "Hesap ve Profil",
    endpoints: [
      {
        method: "GET",
        path: "/api/restaurant",
        summary: "Oturumdaki kullanıcının işletme ayarlarını döner.",
        auth: "Oturum + işletme",
        responses: [
          {
            status: 200,
            body: `{
  "id": 17,
  "name": "Kahve Durağı",
  "slug": "kahve-duragi",
  "type": "Restoran",
  "currency": "TRY",
  "isPublished": true,
  "paymentTypes": null,
  "publicUrl": "https://makethemenu.com/p/kahve-duragi"
}`,
          },
        ],
        errors: [AUTH_401, TENANT_403, { status: 404, when: "İşletme kaydı bulunamadı." }],
      },
      {
        method: "PATCH",
        path: "/api/restaurant",
        summary: "İşletme ayarlarını günceller (ad, adres, para birimi, menü adresi, yayınlama vb.).",
        auth: "Oturum + işletme",
        params: [
          { name: "name", loc: "body", type: "string", desc: "İşletme adı." },
          { name: "slug", loc: "body", type: "string", desc: "Menü adresi; değişirse eski adres otomatik yönlendirilir." },
          { name: "isPublished", loc: "body", type: "boolean", desc: "Menüyü yayımla/kaldır. Yayımlama için e-posta doğrulanmış olmalı." },
          { name: "currency", loc: "body", type: "string", desc: "Para birimi kodu, ör. TRY." },
        ],
        curl: `curl -X PATCH https://makethemenu.com/api/restaurant \\
  ${JSON_HEADER} \\
  -b cookies.txt \\
  -d '{"isPublished": true}'`,
        responses: [{ status: 200, label: "Güncellenmiş ayarlar", body: `{ "id": 17, "name": "Kahve Durağı", "isPublished": true }` }],
        errors: [
          AUTH_401,
          TENANT_403,
          { status: 400, when: "Alan doğrulaması veya adres (slug) biçimi geçersiz." },
          { status: 403, when: "E-posta doğrulanmadan yayınlama istendi (code: EMAIL_NOT_VERIFIED)." },
          { status: 409, when: "Menü adresi başka işletmede kullanılıyor." },
        ],
      },
      {
        method: "GET",
        path: "/api/restaurant/usage",
        summary: "Plan, limitler ve anlık kullanım değerlerini döner.",
        auth: "Oturum + işletme",
        responses: [
          {
            status: 200,
            body: `{
  "plan": { "code": "baslangic", "name": "Başlangıç", "customDomain": false },
  "limits": { "products": 50, "tables": 10, "model3d": 0 },
  "usage": { "products": 23, "tables": 4 }
}`,
          },
        ],
        errors: [AUTH_401, TENANT_403, { status: 404, when: "Abonelik planı bulunamadı." }],
      },
      {
        method: "POST",
        path: "/api/contact",
        summary: "İletişim / bayilik formu mesajı oluşturur; yönetim paneline bildirim düşer.",
        auth: "Gerekmiyor",
        params: [
          { name: "name", loc: "body", type: "string", required: true, desc: "En az 2 karakter." },
          { name: "email", loc: "body", type: "string", required: true, desc: "Geçerli e-posta." },
          { name: "subject", loc: "body", type: "string", required: true, desc: "En az 2 karakter." },
          { name: "message", loc: "body", type: "string", required: true, desc: "En az 10 karakter." },
        ],
        curl: `curl -X POST https://makethemenu.com/api/contact \\
  ${JSON_HEADER} \\
  -d '{"name":"Ayşe Yılmaz","email":"ayse@ornek.com","subject":"Demo talebi","message":"İşletmemiz için demo almak istiyoruz."}'`,
        responses: [{ status: 201, body: `{ "ok": true, "id": 128 }` }],
        errors: [{ status: 400, when: "Alanlar doğrulamadan geçmiyor." }],
      },
    ],
  },
  {
    id: "restoranlar-ve-menuler",
    title: "Restoranlar / Menüler",
    intro:
      "Halka açık menü uç noktaları oturum gerektirmez; yalnızca yayımlanmış menüler ve yayımlanabilir alanlar döner. Fiyat ve stok her istekte sunucuda yeniden hesaplanır.",
    endpoints: [
      {
        method: "GET",
        path: "/api/public/menu/:slug",
        summary: "Yayımlanmış dijital menüyü kategorileri ve ürünleriyle döner (QR menü bu uç noktayı kullanır).",
        auth: "Gerekmiyor",
        params: [{ name: "slug", loc: "path", type: "string", required: true, desc: "İşletmenin menü adresi, ör. kahve-duragi." }],
        curl: `curl https://makethemenu.com/api/public/menu/kahve-duragi`,
        responses: [
          { status: 200, label: "Menü verisi", body: `{
  "restaurant": { "name": "Kahve Durağı", "slug": "kahve-duragi", "currency": "TRY" },
  "categories": [
    { "id": 3, "name": "Tatlılar", "slug": "tatlilar", "sortOrder": 0 }
  ],
  "products": [
    { "id": 12, "categoryId": 3, "name": "Cheesecake", "price": "120.00", "isAvailable": true }
  ]
}` },
          { status: 301, label: "Adres değişmiş", body: `{ "redirectTo": "/p/yeni-adres" }` },
          { status: 404, label: "Yayımlanmamış veya yok", body: `{ "message": "Menü bulunamadı." }` },
        ],
      },
      {
        method: "POST",
        path: "/api/public/menu/:slug/orders",
        summary: "QR menüden misafir siparişi oluşturur. Tutar sunucuda yeniden hesaplanır.",
        auth: "Gerekmiyor",
        params: [
          { name: "items", loc: "body", type: "array", required: true, desc: "En az 1, en fazla 50 kalem: [{ productId, quantity }]." },
          { name: "customerName", loc: "body", type: "string", desc: "Misafir adı (opsiyonel)." },
          { name: "phone", loc: "body", type: "string", desc: "Telefon (opsiyonel)." },
          { name: "note", loc: "body", type: "string", desc: "Sipariş notu (opsiyonel)." },
        ],
        curl: `curl -X POST https://makethemenu.com/api/public/menu/kahve-duragi/orders \\
  ${JSON_HEADER} \\
  -d '{"items":[{"productId":12,"quantity":2}],"customerName":"Masa 5"}'`,
        responses: [{ status: 201, label: "Sipariş oluştu", body: `{ "id": 884, "status": "pending", "totalAmount": "240.00" }` }],
        errors: [
          { status: 400, when: "Geçersiz istek (code: VALIDATION); ürün yok veya satışta değil." },
          { status: 403, when: "İşletme online sipariş kabul etmiyor (code: ORDERS_DISABLED)." },
          { status: 404, when: "Menü bulunamadı." },
        ],
      },
    ],
  },
  {
    id: "masalar",
    title: "Masalar",
    intro: "Masa uç noktaları oturum gerektirir ve yalnızca hesaptaki işletmenin verisine erişir.",
    endpoints: [
      {
        method: "GET",
        path: "/api/tables",
        summary: "İşletmenin masalarını listeler.",
        auth: "Oturum + işletme",
        responses: [{ status: 200, body: `[ { "id": 1, "name": "Masa 1", "restaurantId": 17 } ]` }],
        errors: [AUTH_401, TENANT_403],
      },
      {
        method: "POST",
        path: "/api/tables",
        summary: "Yeni masa oluşturur. Planın masa limiti kontrol edilir.",
        auth: "Oturum + işletme",
        params: [{ name: "name", loc: "body", type: "string", required: true, desc: "Masa adı." }],
        curl: `curl -X POST https://makethemenu.com/api/tables \\
  ${JSON_HEADER} \\
  -b cookies.txt \\
  -d '{"name":"Masa 5"}'`,
        responses: [{ status: 201, body: `{ "id": 6, "name": "Masa 5", "restaurantId": 17 }` }],
        errors: [AUTH_401, TENANT_403, { status: 400, when: "Alan doğrulaması hatalı." }, { status: 403, when: "Plan masa limitine ulaşıldı." }],
      },
      {
        method: "PATCH",
        path: "/api/tables/:id",
        summary: "Masa adını günceller.",
        auth: "Oturum + işletme",
        params: [
          { name: "id", loc: "path", type: "number", required: true, desc: "Masa kimliği." },
          { name: "name", loc: "body", type: "string", desc: "Yeni masa adı." },
        ],
        responses: [{ status: 200, body: `{ "id": 6, "name": "Masa 5A", "restaurantId": 17 }` }],
        errors: [AUTH_401, TENANT_403, { status: 404, when: "Masa bulunamadı." }],
      },
      {
        method: "DELETE",
        path: "/api/tables/:id",
        summary: "Masayı siler.",
        auth: "Oturum + işletme",
        params: [{ name: "id", loc: "path", type: "number", required: true, desc: "Masa kimliği." }],
        responses: [{ status: 204, label: "Gövde yok", body: `` }],
        errors: [AUTH_401, TENANT_403, { status: 404, when: "Masa bulunamadı." }],
      },
    ],
  },
  {
    id: "kategoriler",
    title: "Kategoriler",
    endpoints: [
      {
        method: "GET",
        path: "/api/categories",
        summary: "İşletmenin menü kategorilerini listeler.",
        auth: "Oturum + işletme",
        responses: [
          { status: 200, body: `[ { "id": 3, "name": "Tatlılar", "slug": "tatlilar", "sortOrder": 0, "imageUrl": null, "icon": null } ]` },
        ],
        errors: [AUTH_401, TENANT_403],
      },
      {
        method: "POST",
        path: "/api/categories",
        summary: "Yeni kategori oluşturur.",
        auth: "Oturum + işletme",
        params: [
          { name: "name", loc: "body", type: "string", required: true, desc: "Kategori adı." },
          { name: "slug", loc: "body", type: "string", required: true, desc: "Benzersiz adres parçası, ör. tatlilar." },
          { name: "imageUrl", loc: "body", type: "string", desc: "Kategori görseli (opsiyonel)." },
          { name: "icon", loc: "body", type: "string", desc: "İkon (opsiyonel)." },
          { name: "sortOrder", loc: "body", type: "number", desc: "Sıra; varsayılan 0." },
        ],
        curl: `curl -X POST https://makethemenu.com/api/categories \\
  ${JSON_HEADER} \\
  -b cookies.txt \\
  -d '{"name":"Tatlılar","slug":"tatlilar"}'`,
        responses: [{ status: 201, body: `{ "id": 4, "name": "Tatlılar", "slug": "tatlilar", "sortOrder": 0 }` }],
        errors: [AUTH_401, TENANT_403, { status: 400, when: "Alan doğrulaması hatalı." }],
      },
      {
        method: "POST",
        path: "/api/categories/reorder",
        summary: "Sürükle-bırak sıralamasını toplu kaydeder.",
        auth: "Oturum + işletme",
        params: [{ name: "ids", loc: "body", type: "number[]", required: true, desc: "Yeni sıraya göre kategori kimlikleri (1–200)." }],
        curl: `curl -X POST https://makethemenu.com/api/categories/reorder \\
  ${JSON_HEADER} \\
  -b cookies.txt \\
  -d '{"ids":[4,3]}'`,
        responses: [{ status: 200, body: `{ "ok": true }` }],
        errors: [AUTH_401, TENANT_403, { status: 400, when: "Geçersiz sıralama listesi." }],
      },
      {
        method: "DELETE",
        path: "/api/categories/:id",
        summary: "Kategoriyi siler.",
        auth: "Oturum + işletme",
        params: [{ name: "id", loc: "path", type: "number", required: true, desc: "Kategori kimliği." }],
        responses: [{ status: 204, label: "Gövde yok", body: `` }],
        errors: [AUTH_401, TENANT_403, { status: 404, when: "Kategori bulunamadı." }],
      },
    ],
  },
  {
    id: "urunler",
    title: "Ürünler",
    endpoints: [
      {
        method: "GET",
        path: "/api/products",
        summary: "Ürünleri listeler; categoryId sorgusuyla tek kategoriye indirilebilir.",
        auth: "Oturum + işletme",
        params: [{ name: "categoryId", loc: "query", type: "number", desc: "Yalnızca bu kategorideki ürünler." }],
        curl: `curl -b cookies.txt \\
  "https://makethemenu.com/api/products?categoryId=3"`,
        responses: [
          {
            status: 200,
            body: `[
  {
    "id": 12,
    "categoryId": 3,
    "name": "Cheesecake",
    "description": "Günün taze dilimi",
    "price": "120.00",
    "isAvailable": true,
    "model3dUrl": null,
    "translations": null,
    "sortOrder": 0
  }
]`,
          },
        ],
        errors: [AUTH_401, TENANT_403],
      },
      {
        method: "POST",
        path: "/api/products",
        summary: "Ürün oluşturur. Planın ürün limiti ve 3D model kotası kontrol edilir.",
        auth: "Oturum + işletme",
        params: [
          { name: "name", loc: "body", type: "string", required: true, desc: "Ürün adı." },
          { name: "price", loc: "body", type: "string|number", required: true, desc: "Fiyat, ör. 120.00." },
          { name: "categoryId", loc: "body", type: "number", desc: "Bağlanacak kategori." },
          { name: "description", loc: "body", type: "string", desc: "Açıklama." },
          { name: "imageUrl", loc: "body", type: "string", desc: "Ürün görseli." },
          { name: "model3dUrl", loc: "body", type: "string", desc: "http(s) üzerinden .glb/.gltf bağlantısı." },
          { name: "isAvailable", loc: "body", type: "boolean", desc: "Satışta mı; varsayılan true." },
        ],
        curl: `curl -X POST https://makethemenu.com/api/products \\
  ${JSON_HEADER} \\
  -b cookies.txt \\
  -d '{"name":"Cheesecake","price":"120.00","categoryId":3}'`,
        responses: [{ status: 201, label: "Ürün oluştu", body: `{ "id": 13, "name": "Cheesecake", "price": "120.00", "categoryId": 3 }` }],
        errors: [
          AUTH_401,
          TENANT_403,
          { status: 400, when: "Alan doğrulaması hatalı veya kategori bulunamadı." },
          { status: 403, when: "Plan ürün limiti aşıldı veya 3D model kotası doldu." },
        ],
      },
      {
        method: "PATCH",
        path: "/api/products/:id",
        summary: "Ürünü günceller. Mevcut 3D modeli yeniden göndermek kota harcamaz.",
        auth: "Oturum + işletme",
        params: [
          { name: "id", loc: "path", type: "number", required: true, desc: "Ürün kimliği." },
          { name: "name", loc: "body", type: "string", desc: "Ürün adı." },
          { name: "price", loc: "body", type: "string|number", desc: "Fiyat." },
          { name: "isAvailable", loc: "body", type: "boolean", desc: "Satışta mı." },
          { name: "model3dUrl", loc: "body", type: "string|null", desc: "3D model bağlantısı." },
        ],
        responses: [{ status: 200, body: `{ "id": 13, "name": "Cheesecake", "price": "135.00" }` }],
        errors: [AUTH_401, TENANT_403, { status: 400, when: "Doğrulama hatası." }, { status: 404, when: "Ürün bulunamadı." }],
      },
      {
        method: "POST",
        path: "/api/products/reorder",
        summary: "Kategori içi ürün sıralamasını toplu kaydeder.",
        auth: "Oturum + işletme",
        params: [{ name: "ids", loc: "body", type: "number[]", required: true, desc: "Yeni sıraya göre ürün kimlikleri (1–500)." }],
        responses: [{ status: 200, body: `{ "ok": true }` }],
        errors: [AUTH_401, TENANT_403, { status: 400, when: "Geçersiz sıralama listesi." }],
      },
      {
        method: "DELETE",
        path: "/api/products/:id",
        summary: "Ürünü siler.",
        auth: "Oturum + işletme",
        params: [{ name: "id", loc: "path", type: "number", required: true, desc: "Ürün kimliği." }],
        responses: [{ status: 204, label: "Gövde yok", body: `` }],
        errors: [AUTH_401, TENANT_403, { status: 404, when: "Ürün bulunamadı." }],
      },
    ],
  },
  {
    id: "siparisler",
    title: "Siparişler",
    endpoints: [
      {
        method: "GET",
        path: "/api/orders",
        summary: "Sipariş listesini döner; status sorgusuyla filirlenebilir.",
        auth: "Oturum + işletme",
        params: [{ name: "status", loc: "query", type: "string", desc: "Ör. pending, completed." }],
        curl: `curl -b cookies.txt \\
  "https://makethemenu.com/api/orders?status=pending"`,
        responses: [{ status: 200, body: `[ { "id": 884, "tableId": 6, "status": "pending", "totalAmount": "240.00", "items": [ { "productId": 12, "quantity": 2, "price": "120.00" } ] } ]` }],
        errors: [AUTH_401, TENANT_403],
      },
      {
        method: "GET",
        path: "/api/orders/:id",
        summary: "Tek siparişi kalemleriyle döner.",
        auth: "Oturum + işletme",
        params: [{ name: "id", loc: "path", type: "number", required: true, desc: "Sipariş kimliği." }],
        responses: [{ status: 200, body: `{ "id": 884, "status": "pending", "totalAmount": "240.00", "items": [ { "productId": 12, "quantity": 2 } ] }` }],
        errors: [AUTH_401, TENANT_403, { status: 404, when: "Sipariş bulunamadı." }],
      },
      {
        method: "POST",
        path: "/api/orders",
        summary: "Kasa/POS üzerinden sipariş oluşturur. Fiyatlar veritabanından alınır, %10 vergiyle toplanır.",
        auth: "Oturum + işletme",
        params: [
          { name: "tableId", loc: "body", type: "number|null", required: true, desc: "Masa kimliği veya null." },
          { name: "items", loc: "body", type: "array", required: true, desc: "[{ productId, quantity, notes? }] — en az bir kalem." },
        ],
        curl: `curl -X POST https://makethemenu.com/api/orders \\
  ${JSON_HEADER} \\
  -b cookies.txt \\
  -d '{"tableId":6,"items":[{"productId":12,"quantity":2}]}'`,
        responses: [{ status: 201, body: `{ "id": 885, "status": "pending", "totalAmount": "264.00" }` }],
        errors: [
          AUTH_401,
          TENANT_403,
          { status: 400, when: "Kalemler geçersiz, ürün yok/satışta değil." },
        ],
      },
      {
        method: "PATCH",
        path: "/api/orders/:id/status",
        summary: "Sipariş durumunu günceller (mutfak/servis akışı).",
        auth: "Oturum + işletme",
        params: [
          { name: "id", loc: "path", type: "number", required: true, desc: "Sipariş kimliği." },
          { name: "status", loc: "body", type: "string", required: true, desc: "Yeni durum, ör. preparing, completed." },
        ],
        responses: [{ status: 200, body: `{ "id": 884, "status": "completed" }` }],
        errors: [AUTH_401, TENANT_403, { status: 404, when: "Sipariş bulunamadı." }],
      },
      {
        method: "GET",
        path: "/api/orders/export",
        summary: "Tüm sipariş geçmişini CSV olarak indirir (siparisler-YYYYGGAA.csv).",
        auth: "Oturum + işletme",
        responses: [
          { status: 200, label: "text/csv", body: `id,createdAt,tableName,customerName,phone,note,status,totalAmount
884,2026-04-20 10:32,Masa 5,,,"",pending,240.00` },
        ],
        errors: [AUTH_401, TENANT_403],
      },
    ],
  },
  {
    id: "qr-kodlari",
    title: "QR Kodları",
    intro: "QR kodlar yalnızca yayımlanmış ve menü adresi atanmış işletmeler için üretilir.",
    endpoints: [
      {
        method: "GET",
        path: "/api/restaurant/qr.svg",
        summary: "Halka açık menüye işaret eden QR kodu SVG olarak indirir.",
        auth: "Oturum + işletme",
        params: [
          { name: "table", loc: "query", type: "string", desc: "Masa adı; QR bağlantısına ?masa= paramı gömer, taramalar masa bazlı sayılır." },
          { name: "size", loc: "query", type: "number", desc: "PNG için; 128–2048 px (SVG'yi etkilemez)." },
        ],
        curl: `curl -b cookies.txt -o kahve-duragi-qr.svg \\
  "https://makethemenu.com/api/restaurant/qr.svg?table=Masa%205"`,
        responses: [{ status: 200, label: "image/svg+xml", body: `<svg xmlns="http://www.w3.org/2000/svg" ...>` }],
        errors: [
          AUTH_401,
          TENANT_403,
          { status: 409, when: "Menü adresi yok veya menü yayımlanmamış." },
        ],
      },
      {
        method: "GET",
        path: "/api/restaurant/qr.png",
        summary: "Aynı QR kodu PNG biçiminde indirir (hata düzeltme düzeyi H).",
        auth: "Oturum + işletme",
        params: [
          { name: "table", loc: "query", type: "string", desc: "Masa adı." },
          { name: "size", loc: "query", type: "number", desc: "Piksel genişliği, 128–2048; varsayılan 512." },
        ],
        responses: [{ status: 200, label: "image/png", body: `(ikili veri)` }],
        errors: [AUTH_401, TENANT_403, { status: 409, when: "Menü adresi yok veya menü yayımlanmamış." }],
      },
    ],
  },
  {
    id: "alan-adlari",
    title: "Alan Adları",
    intro: "Özel alan adı, plan desteği gerektirir. Doğrulama DNS TXT kaydı üzerinden yapılır.",
    endpoints: [
      {
        method: "GET",
        path: "/api/restaurant/domains",
        summary: "Bağlı alan adlarını ve plan desteğini listeler.",
        auth: "Oturum + işletme",
        responses: [
          {
            status: 200,
            body: `{
  "planSupportsCustomDomain": true,
  "planName": "Profesyonel",
  "domains": [
    { "id": 2, "domain": "menu.isletmeniz.com", "isVerified": false, "verificationToken": "mtm_..." }
  ]
}`,
          },
        ],
        errors: [AUTH_401, TENANT_403],
      },
      {
        method: "POST",
        path: "/api/restaurant/domains",
        summary: "Yeni alan adı ekler ve mtm_ ile başlayan doğrulama token'ı üretir.",
        auth: "Oturum + işletme",
        params: [{ name: "domain", loc: "body", type: "string", required: true, desc: "4–255 karakter geçerli alan adı." }],
        curl: `curl -X POST https://makethemenu.com/api/restaurant/domains \\
  ${JSON_HEADER} \\
  -b cookies.txt \\
  -d '{"domain":"menu.isletmeniz.com"}'`,
        responses: [{ status: 201, body: `{ "id": 3, "domain": "menu.isletmeniz.com", "isVerified": false, "verificationToken": "mtm_9f2c..." }` }],
        errors: [
          AUTH_401,
          TENANT_403,
          { status: 400, when: "Alan adı biçimi geçersiz." },
          { status: 403, when: "Plan özel alan adı desteklemiyor (code: PLAN_REQUIRED)." },
          { status: 409, when: "Alan adı zaten bağlı veya doğrulama bekliyor." },
        ],
      },
      {
        method: "POST",
        path: "/api/restaurant/domains/:id/verify",
        summary: "TXT kaydı yayınlanmışsa doğrulamayı gerçekleştirir.",
        auth: "Oturum + işletme",
        params: [{ name: "id", loc: "path", type: "number", required: true, desc: "Alan adı kaydı kimliği." }],
        responses: [{ status: 200, body: `{ "id": 3, "domain": "menu.isletmeniz.com", "isVerified": true }` }],
        errors: [AUTH_401, TENANT_403, { status: 400, when: "DNS kaydı henüz doğrulanamadı." }],
      },
      {
        method: "DELETE",
        path: "/api/restaurant/domains/:id",
        summary: "Alan adı bağlantısını kaldırır.",
        auth: "Oturum + işletme",
        params: [{ name: "id", loc: "path", type: "number", required: true, desc: "Alan adı kaydı kimliği." }],
        responses: [{ status: 204, label: "Gövde yok", body: `` }],
        errors: [AUTH_401, TENANT_403],
      },
    ],
  },
  {
    id: "abonelikler-ve-faturalama",
    title: "Abonelikler ve Faturalandırma",
    intro: "Faturalama uç noktaları oturum + işletme gerektirir. Tutarlar TRY olarak kuruş bazında hesaplanır, yanıtta TL döner.",
    endpoints: [
      {
        method: "GET",
        path: "/api/billing/config",
        summary: "Ödeme sağlayıcısı yapılandırmasını döner (bağlı mı, test modunda mı).",
        auth: "Gerekmiyor",
        responses: [{ status: 200, body: `{ "mode": "live", "provider": "iyzico", "testMode": false, "configured": true }` }],
      },
      {
        method: "GET",
        path: "/api/billing/overview",
        summary: "Mevcut abonelik özetini döner (plan, dönem, durum, iptal bilgisi).",
        auth: "Oturum + işletme",
        responses: [{ status: 200, body: `{ "planCode": "baslangic", "interval": "monthly", "status": "active", "cancelAtPeriodEnd": false }` }],
        errors: [AUTH_401, TENANT_403],
      },
      {
        method: "GET",
        path: "/api/billing/history",
        summary: "Ödeme geçmişini listeler.",
        auth: "Oturum + işletme",
        responses: [{ status: 200, body: `[ { "id": 55, "planCode": "baslangic", "amount": 149, "taxAmount": 0, "currency": "TRY", "status": "succeeded" } ]` }],
        errors: [AUTH_401, TENANT_403],
      },
      {
        method: "POST",
        path: "/api/billing/quote",
        summary: "Plan + dönem + kupon için indirimli fiyat teklifi hesaplar (ödemeye geçmeden).",
        auth: "Oturum + işletme",
        params: [
          { name: "planCode", loc: "body", type: "string", required: true, desc: "Plan kodu." },
          { name: "interval", loc: "body", type: "monthly|yearly", required: true, desc: "Abonelik dönemi." },
          { name: "couponCode", loc: "body", type: "string", desc: "İsteğe bağlı kupon kodu." },
        ],
        curl: `curl -X POST https://makethemenu.com/api/billing/quote \\
  ${JSON_HEADER} \\
  -b cookies.txt \\
  -d '{"planCode":"profesyonel","interval":"yearly","couponCode":"GIRIS20"}'`,
        responses: [
          {
            status: 200,
            body: `{
  "planCode": "profesyonel",
  "interval": "yearly",
  "subtotal": 3590,
  "discount": 718,
  "amount": 2872,
  "taxAmount": 0,
  "currency": "TRY"
}`,
          },
        ],
        errors: [AUTH_401, TENANT_403, { status: 400, when: "Geçersiz plan/kupon (code: BAD_INPUT)." }],
      },
      {
        method: "POST",
        path: "/api/billing/checkout",
        summary: "Ödeme sağlayıcısının ödeme oturumunu başlatır; yanıt ödeme sayfası oturumudur.",
        auth: "Oturum + işletme",
        params: [
          { name: "planCode", loc: "body", type: "string", required: true, desc: "Plan kodu." },
          { name: "interval", loc: "body", type: "monthly|yearly", required: true, desc: "Abonelik dönemi." },
          { name: "couponCode", loc: "body", type: "string", desc: "İsteğe bağlı kupon kodu." },
        ],
        headersNote: "Idempotency-Key başlığı önerilir: ağ tekrarında aynı oturum döner.",
        responses: [{ status: 200, body: `{ "ok": true, "session": { "ref": "mock_6f1a2b3c4d5e...", "url": "https://odeme-saglayici/oturum" } }` }],
        errors: [AUTH_401, TENANT_403, { status: 400, when: "Geçersiz istek (code: BAD_INPUT)." }, { status: 503, when: "Ödeme sağlayıcısı yapılandırılmamış." }],
      },
      {
        method: "POST",
        path: "/api/billing/change-plan",
        summary: "Mevcut aboneliği başka plana/döneme geçirir.",
        auth: "Oturum + işletme",
        params: [
          { name: "planCode", loc: "body", type: "string", required: true, desc: "Yeni plan kodu." },
          { name: "interval", loc: "body", type: "monthly|yearly", required: true, desc: "Yeni dönem." },
        ],
        responses: [{ status: 200, body: `{ "ok": true, "planCode": "profesyonel", "interval": "monthly" }` }],
        errors: [AUTH_401, TENANT_403, { status: 400, when: "Geçersiz plan (code: BAD_INPUT)." }],
      },
      {
        method: "POST",
        path: "/api/billing/cancel",
        summary: "Aboneliği dönem sonunda iptale alır; mevcut dönem sonuna kadar erişim sürer.",
        auth: "Oturum + işletme",
        responses: [{ status: 200, body: `{ "ok": true }` }],
        errors: [AUTH_401, TENANT_403],
      },
      {
        method: "POST",
        path: "/api/billing/resume",
        summary: "Dönem sonu iptalini geri alır.",
        auth: "Oturum + işletme",
        responses: [{ status: 200, body: `{ "ok": true }` }],
        errors: [AUTH_401, TENANT_403],
      },
      {
        method: "GET",
        path: "/api/billing/payment-methods",
        summary: "Kayıtlı ödeme yöntemlerini listeler.",
        auth: "Oturum + işletme",
        responses: [{ status: 200, body: `{ "ok": true, "data": [ { "id": 8, "brand": "visa", "last4": "4242", "isDefault": true } ] }` }],
        errors: [AUTH_401, TENANT_403],
      },
      {
        method: "POST",
        path: "/api/billing/payment-methods/:id/default",
        summary: "Ödeme yöntemini varsayılan yapar.",
        auth: "Oturum + işletme",
        params: [{ name: "id", loc: "path", type: "number", required: true, desc: "Ödeme yöntemi kimliği." }],
        responses: [{ status: 200, body: `{ "ok": true }` }],
        errors: [AUTH_401, TENANT_403, { status: 400, when: "Geçersiz ödeme yöntemi." }],
      },
      {
        method: "DELETE",
        path: "/api/billing/payment-methods/:id",
        summary: "Kayıtlı ödeme yöntemini siler.",
        auth: "Oturum + işletme",
        params: [{ name: "id", loc: "path", type: "number", required: true, desc: "Ödeme yöntemi kimliği." }],
        responses: [{ status: 200, body: `{ "ok": true }` }],
        errors: [AUTH_401, TENANT_403, { status: 400, when: "Geçersiz ödeme yöntemi." }],
      },
    ],
  },
  {
    id: "webhooklar",
    title: "Webhook'lar",
    endpoints: [
      {
        method: "POST",
        path: "/api/billing/webhook",
        summary: "Ödeme sağlayıcısının olay bildirimlerini alır (oturum yok, kimlik HMAC imzasıyla sağlanır).",
        auth: "HMAC imzası",
        description:
          "İmza, ham istek gövdesi (raw body) üzerinden hesaplanır ve x-payment-signature başlığıyla gönderilir. İmzasız veya bozuk gövdeli istekler işleme alınmaz. Tekrarlanan olaylar duplicate işaretlenir (idempotent).",
        params: [{ name: "x-payment-signature", loc: "header", type: "string", required: true, desc: "Webhook sırrıyla HMAC imzası." }],
        responses: [{ status: 200, body: `{ "ok": true, "received": true, "duplicate": false }` }],
        errors: [
          { status: 400, when: "Gövde okunamadı (code: BAD_BODY) veya imza doğrulanamadı." },
        ],
      },
    ],
  },
  {
    id: "eklentiler",
    title: "Eklentiler",
    intro: "Eklenti Merkezi: işletme, katalogdan modülleri açar/kapatır. Plan kısıtı olan eklentiler kilitli gelir.",
    endpoints: [
      {
        method: "GET",
        path: "/api/plugins",
        summary: "Eklenti kataloğunu ve işletmenin aç/kapat durumunu döner.",
        auth: "Oturum + işletme",
        responses: [
          {
            status: 200,
            body: `{
  "planCode": "baslangic",
  "plugins": [
    { "key": "reeditions", "name": "Riveliyonlar", "isEnabled": false, "settings": null, "planLocked": false }
  ]
}`,
          },
        ],
        errors: [AUTH_401, TENANT_403],
      },
      {
        method: "POST",
        path: "/api/plugins/:key/toggle",
        summary: "Eklentiyi açar/kapatır.",
        auth: "Oturum + işletme",
        params: [
          { name: "key", loc: "path", type: "string", required: true, desc: "Katalogdaki eklenti anahtarı." },
          { name: "enabled", loc: "body", type: "boolean", desc: "true/false; varsayılan false." },
        ],
        responses: [{ status: 200, body: `{ "key": "reeditions", "isEnabled": true }` }],
        errors: [AUTH_401, TENANT_403, { status: 403, when: "Eklenti mevcut planda yok." }, { status: 404, when: "Eklenti bulunamadı." }],
      },
      {
        method: "PUT",
        path: "/api/plugins/:key/settings",
        summary: "Eklenti ayarlarını kaydeder (anahtar/değer, en fazla 4 KB).",
        auth: "Oturum + işletme",
        params: [{ name: "settings", loc: "body", type: "object", required: true, desc: "Serbest biçimli ayar nesnesi." }],
        responses: [{ status: 200, body: `{ "key": "reeditions", "isEnabled": true }` }],
        errors: [AUTH_401, TENANT_403, { status: 400, when: "Ayarlar 4 KB sınırını aşıyor." }, { status: 404, when: "Eklenti bulunamadı." }],
      },
    ],
  },
  {
    id: "analitik",
    title: "Analitik",
    intro: "Anonim menü analitiği: olaylarda IP, kullanıcı bilgisi veya profil taşınamaz.",
    endpoints: [
      {
        method: "POST",
        path: "/api/track",
        summary: "QR menü kendi görüntüleme olaylarını bildirir. Geçersiz istekler sessizce 204 döner.",
        auth: "Gerekmiyor",
        params: [
          { name: "slug", loc: "body", type: "string", required: true, desc: "Menü adresi." },
          { name: "type", loc: "body", type: "string", required: true, desc: "menu_view | qr_scan | product_view." },
          { name: "productId", loc: "body", type: "number", desc: "product_view için zorunlu." },
        ],
        responses: [{ status: 204, label: "Gövde yok", body: `` }],
      },
      {
        method: "GET",
        path: "/api/analytics/summary",
        summary: "Menü görüntüleme, QR tarama ve ürün görüntüleme özetini döner.",
        auth: "Oturum + işletme",
        params: [{ name: "days", loc: "query", type: "number", desc: "1–90 gün; varsayılan 30." }],
        responses: [
          {
            status: 200,
            body: `{
  "totals": { "menuView": 1203, "qrScan": 642, "productView": 2874 },
  "series": [ { "date": "2026-04-19", "menuView": 41, "qrScan": 22, "productView": 96 } ],
  "topProducts": [ { "productId": 12, "name": "Cheesecake", "views": 210 } ]
}`,
          },
        ],
        errors: [AUTH_401, TENANT_403],
      },
      {
        method: "GET",
        path: "/api/analytics/export",
        summary: "Günlük analitik özetini CSV olarak indirir.",
        auth: "Oturum + işletme",
        params: [{ name: "days", loc: "query", type: "number", desc: "1–90 gün; varsayılan 30." }],
        responses: [{ status: 200, label: "text/csv", body: `tarih,tip,adet` }],
        errors: [AUTH_401, TENANT_403],
      },
    ],
  },
  {
    id: "sablonlar",
    title: "Şablonlar",
    endpoints: [
      {
        method: "GET",
        path: "/api/public/templates",
        summary: "Yayımlanmış menü şablonlarını listeler (giriş ekranındaki şablon vitrini).",
        auth: "Gerekmiyor",
        responses: [{ status: 200, body: `[ { "id": 1, "name": "Minimal Kahverengi", "slug": "minimal-kahverengi", "isActive": true } ]` }],
      },
      {
        method: "GET",
        path: "/api/public/demos/:slug",
        summary: "Şablonun canlı demo verisini döner.",
        auth: "Gerekmiyor",
        params: [{ name: "slug", loc: "path", type: "string", required: true, desc: "Demo adresi." }],
        responses: [{ status: 200, body: `{ "id": 4, "slug": "minimal-kahverengi", "settings": { "primaryColor": "#998bcc" } }` }],
        errors: [{ status: 404, when: "Demo bulunamadı." }],
      },
    ],
  },
  {
    id: "yapay-zeka",
    title: "Menü Asistanı (Yapay Zekâ)",
    intro: "Şablon oluşturucunun yapay zekâ uç noktaları oturum + işletme gerektirir.",
    endpoints: [
      {
        method: "POST",
        path: "/api/restaurant/ai/suggest-theme",
        summary: "İşletme açıklamasından ve/veya logodan renk paleti önerir.",
        auth: "Oturum + işletme",
        responses: [{ status: 200, body: `{ "primaryColor": "#998bcc", "fontFamily": "Playfair Display" }` }],
        errors: [AUTH_401, TENANT_403, { status: 400, when: "Geçersiz istek." }],
      },
      {
        method: "POST",
        path: "/api/restaurant/ai/generate-menu",
        summary: "Menü taslağı üretir. Yapay zekâ sağlayıcısı yapılandırılmamışsa yerleşik Türkçe şablonlar kullanılır.",
        auth: "Oturum + işletme",
        responses: [{ status: 200, body: `{ "sections": [ { "name": "Tatlılar", "products": [ { "name": "Cheesecake", "description": "..." } ] } ] }` }],
        errors: [AUTH_401, TENANT_403, { status: 400, when: "Geçersiz istek." }],
      },
      {
        method: "POST",
        path: "/api/restaurant/ai/apply-menu",
        summary: "Taslağı uygular: kategori ve ürünleri oluşturur. Bölüm bazında tümüyle ya da hiç uygulanır.",
        auth: "Oturum + işletme",
        params: [{ name: "draft", loc: "body", type: "object", required: true, desc: "generate-menu çıktısı veya düzenlenmiş taslak." }],
        responses: [{ status: 200, body: `{ "createdCategories": 2, "createdProducts": 11, "skipped": [] }` }],
        errors: [
          AUTH_401,
          TENANT_403,
          { status: 400, when: "Taslak doğrulanamadı." },
          { status: 403, when: "Plan ürün limiti aşıldı (code: PLAN_LIMIT)." },
        ],
      },
    ],
  },
];

/** Hata kodları bölümü — sunucunun gerçek yanıt sözleşmesi. */
export interface ApiErrorCode {
  status: number;
  code?: string;
  meaning: string;
}

export const apiErrorCodes: ApiErrorCode[] = [
  { status: 400, code: "BAD_INPUT", meaning: "İstek gövdesi doğrulamadan geçmedi; message alanında Türkçe açıklama döner." },
  { status: 400, code: "VALIDATION", meaning: "Halka açık siparişlerde geçersiz kalem/alan." },
  { status: 400, code: "BAD_BODY", meaning: "Webhook gövdesi okunamadı (imza ham gövde üzerinden hesaplanır)." },
  { status: 401, meaning: "Oturum yok veya süresi dolmuş — 'Giriş yapmanız gerekiyor.' (Giriş uç noktaları hariç; orada 200 + {ok:false} zarfı döner.)" },
  { status: 403, meaning: "Yetki yok: hesaba işletme bağlı değil, platform yöneticisi gerekli veya plan kısıtı." },
  { status: 403, code: "PLAN_REQUIRED", meaning: "Özellik (ör. özel alan adı) mevcut planda yer almıyor." },
  { status: 403, code: "PLAN_LIMIT", meaning: "Plan limiti (ürün/masa/3D model) doldu." },
  { status: 403, code: "EMAIL_NOT_VERIFIED", meaning: "Menüyü yayımlamadan önce e-posta doğrulanmalı." },
  { status: 403, code: "ORDERS_DISABLED", meaning: "İşletme online sipariş kabul etmiyor." },
  { status: 404, meaning: "Kayıt bulunamadı." },
  { status: 409, meaning: "Çakışma: e-posta/menü adresi/alan adı zaten kullanılıyor." },
  { status: 429, meaning: "Oran limiti aşıldı; pencere resetlenene kadar bekleyin." },
  { status: 500, meaning: "Sunucu hatası — { message } döner, ayrıntı yalnızca sunucu günlüğüne yazılır." },
  { status: 503, meaning: "Bağımlılık (veritabanı/ödeme sağlayıcısı) kullanılamıyor." },
];

/** Gerçek oran limitleri — server/auth/routes.ts içindeki limiter'lardan. */
export const apiRateLimits: { scope: string; limit: string; env: string }[] = [
  { scope: "Giriş (POST /api/auth/login)", limit: "20 deneme / 15 dakika", env: "AUTH_LOGIN_MAX" },
  { scope: "Kayıt (POST /api/auth/register)", limit: "10 deneme / saat", env: "AUTH_REGISTER_MAX" },
  { scope: "E-posta doğrulama (verify + resend)", limit: "5 istek / saat", env: "AUTH_VERIFY_MAX" },
  { scope: "Parola sıfırlama (forgot + reset)", limit: "5 istek / saat", env: "AUTH_FORGOT_MAX" },
];

/** Bölüm + uç nokta başlıklarında dokümantasyon içi arama. */
export function searchApiDocs(query: string): ApiSection[] {
  const q = query.trim().toLowerCase();
  if (!q) return apiSections;
  const match = (s: string) => s.toLowerCase().includes(q);
  return apiSections
    .map((section) => {
      if (match(section.title)) return section;
      const endpoints = section.endpoints.filter(
        (ep) =>
          match(ep.path) ||
          match(ep.method) ||
          match(ep.summary) ||
          (ep.params ?? []).some((p) => match(p.name) || match(p.desc)),
      );
      return { ...section, endpoints };
    })
    .filter((section) => section.endpoints.length > 0);
}
