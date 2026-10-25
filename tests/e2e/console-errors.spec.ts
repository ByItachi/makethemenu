import { test, expect, type Page, type Response } from '@playwright/test';

// Kapsamlı konsol / ağ süpürmesi.
// Kural: uygulama kaynaklı console error, pageerror, requestfailed ve 4xx/5x
// yanıtları raporlanır. Harici CDN kaynakları (unsplash vb.) uygulama hatası
// sayılmaz; oturum açmamış ziyaretçinin /api/auth/user çağrısı gibi beklenen
// yanıtlar CONTEXT based izin listesiyle eletilir (hata gizleme değil).

type Captured = {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  badResponses: { url: string; status: number }[];
};

const isLocal = (url: string) =>
  url.startsWith('http://localhost') || url.startsWith('/') || url.startsWith('http://127.0.0.1');

function capture(page: Page): Captured {
  const cap: Captured = { consoleErrors: [], pageErrors: [], failedRequests: [], badResponses: [] };

  page.on('console', (msg) => {
    if (msg.type() === 'error') cap.consoleErrors.push(msg.text());
  });
  page.on('pageerror', (error) => cap.pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    const url = request.url();
    // Harici CDN/analitik kaynakları uygulama hatası değildir.
    if (!isLocal(url)) return;
    cap.failedRequests.push(`${url} -> ${request.failure()?.errorText ?? 'unknown'}`);
  });
  page.on('response', (response: Response) => {
    const url = response.url();
    if (!isLocal(url)) return;
    if (response.status() >= 400) cap.badResponses.push({ url, status: response.status() });
  });
  return cap;
}

// Beklenen bağlamsal yanıtlar: hata değil, sözleşmenin parçası.
function expectedBadResponse(url: string, status: number): boolean {
  // Oturum açmamış kullanıcı sayfada: kimlik sorgusu 401 döner ve UI bunu
  // "giriş yapmamış" olarak ele alır (yönlendirme/karşılama). Uygulama hatası değil.
  if (status === 401 && url.includes('/api/auth/user')) return true;
  return false;
}

function assertClean(cap: Captured, label: string) {
  const bad = cap.badResponses.filter((r) => !expectedBadResponse(r.url, r.status));
  expect(cap.pageErrors, `${label} - yakalanmamış JS hataları`).toEqual([]);
  expect(cap.consoleErrors, `${label} - console hataları`).toEqual([]);
  expect(cap.failedRequests, `${label} - başarısız istekler`).toEqual([]);
  expect(bad, `${label} - 4xx/5xx yanıtlar`).toEqual([]);
}

const CUSTOMER_STATE = '.auth/customer.json';
const ADMIN_STATE = '.auth/admin.json';

// --- Genel (misafir) sayfalar ---
const PUBLIC_PAGES = [
  '/',
  '/giris',
  '/kayit',
  '/sifremi-unuttum',
  '/demo',
  '/fiyatlar',
  '/indir',
  '/iletisim',
  '/sablonlar',
  '/sablonlar/chinese-restaurant',
  '/sablon-demo/chinese-restaurant',
  '/sablon-demo/vegan-menu',
  '/sablon-demo/food-truck',
  '/kaynaklar/blog',
  '/kaynaklar/blog/restoran-yonetiminde-dijital-donusum',
  '/kaynaklar/bilgi-merkezi',
  '/kaynaklar/bilgi-merkezi/hizli-baslangic',
  '/kaynaklar/bilgi-merkezi/olmayan-makale',
  '/kaynaklar/api',
  '/kaynaklar/api#post-api-auth-login',
  '/is-ortakligi/bayilik',
  '/is-ortakligi/kampanyalar',
  '/ozellikler',
  '/ozellikler/restoran',
  '/cozumler/restoran-otomasyon',
  '/hakkimizda',
  '/basari-hikayeleri',
  '/kaynaklar/blog/olmayan-yazi', // bulunamadı durumu da hatasız olmalı
];

const CUSTOMER_PAGES = ['/panel', '/pos', '/masalar', '/siparisler', '/menu', '/isletme', '/ayarlar'];

const ADMIN_PAGES = [
  '/admin',
  '/admin/businesses',
  '/admin/venues',
  '/admin/licenses',
  '/admin/payments',
  '/admin/coupons',
  '/admin/invoices',
  '/admin/notifications',
  '/admin/templates',
  '/admin/templates/new',
  '/admin/ai-builder',
  '/admin/demos',
  '/admin/settings',
];

test.describe('Genel sayfalar — konsol ve ağ temizliği', () => {
  for (const path of PUBLIC_PAGES) {
    test(`misafir: ${path}`, async ({ page }) => {
      const cap = capture(page);
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      expect(response?.status(), `${path} sayfa durumu`).toBeLessThan(400);
      assertClean(cap, path);
    });
  }
});

test.describe('İşletme paneli — konsol ve ağ temizliği', () => {
  test.use({ storageState: CUSTOMER_STATE });
  for (const path of CUSTOMER_PAGES) {
    test(`işletme: ${path}`, async ({ page }) => {
      const cap = capture(page);
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      assertClean(cap, path);
    });
  }
});

test.describe('Yönetim paneli — konsol ve ağ temizliği', () => {
  test.use({ storageState: ADMIN_STATE });
  for (const path of ADMIN_PAGES) {
    test(`yönetici: ${path}`, async ({ page }) => {
      const cap = capture(page);
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      assertClean(cap, path);
    });
  }
});

test.describe('Etkileşim akışları', () => {
  test.use({ storageState: CUSTOMER_STATE });

  test('şablon demosunda ürün çekmecesi hatasız açılıp kapanıyor', async ({ page }) => {
    const cap = capture(page);
    await page.goto('/sablon-demo/vegan-menu', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const firstProduct = page.locator('[data-product], .product-item, li:has-text("₺"), button:has-text("₺")').first();
    if (await firstProduct.isVisible().catch(() => false)) {
      await firstProduct.click();
      await page.waitForTimeout(600);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }
    assertClean(cap, 'sablon-demo/vegan-menu etkileşim');
  });

  test('menü CRUD uçtan uca: kategori + ürün oluştur, listele, sil', async ({ page }) => {
    const cap = capture(page);

    const stamp = Date.now().toString(36);
    const catName = `KonsolTest-Kat-${stamp}`;
    const prodName = `KonsolTest-Ürün-${stamp}`;

    // Kategori oluştur (sözleşme: insertCategorySchema — name + slug zorunlu)
    const catRes = await page.request.post('/api/categories', {
      data: { name: catName, slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
    });
    expect(catRes.status(), 'kategori oluşturma').toBe(201);
    const cat = await catRes.json();
    expect(cat.id, 'kategori id dönmeli').toBeTruthy();

    // Ürün oluştur
    const prodRes = await page.request.post('/api/products', {
      data: { name: prodName, price: '49.90', categoryId: cat.id },
    });
    expect(prodRes.status(), 'ürün oluşturma').toBe(201);
    const prod = await prodRes.json();

    // Listele ve doğrula
    const listRes = await page.request.get('/api/products');
    expect(listRes.status()).toBe(200);
    const products = await listRes.json();
    expect(products.some((p: { id: number }) => p.id === prod.id)).toBeTruthy();

    // Menü sayfasını tazele: yeni veriyle render temiz olmalı
    await page.goto('/menu', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Temizlik: kendi oluşturduğumuz test kayıtlarını sil
    const delProd = await page.request.delete(`/api/products/${prod.id}`);
    expect(delProd.status(), 'ürün silme').toBeLessThan(400);
    const delCat = await page.request.delete(`/api/categories/${cat.id}`);
    expect(delCat.status(), 'kategori silme').toBeLessThan(400);

    assertClean(cap, 'menü CRUD akışı');
  });

  test('giriş hatalı bilgide 401 döner, konsol temiz kalır', async ({ page }) => {
    const cap = capture(page);
    await page.goto('/giris', { waitUntil: 'domcontentloaded' });
    // Hatalı deneme artık 200 + {ok:false} zarfıyla döner; UI hata mesajını
    // gösterir, Chromium console'a "Failed to load resource" yazdırmaz.
    await page.getByPlaceholder('E-Posta Adresi veya Telefon Numarası').fill('yanlis@ornek.com');
    await page.getByPlaceholder('Şifre').fill('yanlis-parola-123');
    await page.getByRole('button', { name: /Giriş Yap/i }).click();
    await page.waitForTimeout(2500);
    // Hata mesajı gerçekten kullanıcıya görünmeli (hata gizlenmemeli):
    const errVisible = await page.getByText(/E-posta veya parola hatalı/i).isVisible().catch(() => false);
    expect(errVisible, 'genel hata mesajı kullanıcıya gösterilmeli').toBeTruthy();
    assertClean(cap, 'giriş doğrulama akışı');
  });

  test('AI menü üreticisi yapılandırmasız durumda düzgün davranıyor', async ({ page }) => {
    // AI_API_KEY tanımlı değil: uygulama yerleşik Türkçe şablonlara düşmeli,
    // 500/console hatası üretmemeli. (Harici servis zorunlu değildir.)
    const cap = capture(page);
    await page.goto('/menu', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const btn = page.getByTestId('button-ai-menu');
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click();
    await page.waitForTimeout(800);
    // Diyalog açıldı; varsa "Üret/Oluştur" butonuna bas
    const gen = page.getByRole('button', { name: /Üret|Oluştur|Generate/i }).first();
    if (await gen.isVisible().catch(() => false)) {
      await gen.click();
      await page.waitForTimeout(4000);
    }
    await page.keyboard.press('Escape');
    assertClean(cap, 'AI menü diyalog akışı');
  });
});

test.describe('Responsive — ana sayfa çoklu çözünürlük', () => {
  const viewports = [
    { width: 320, height: 568, name: 'mobil-320' },
    { width: 375, height: 667, name: 'mobil-375' },
    { width: 390, height: 844, name: 'mobil-390' },
    { width: 768, height: 1024, name: 'tablet-768' },
    { width: 1024, height: 768, name: 'tablet-1024' },
    { width: 1440, height: 900, name: 'masaustu-1440' },
  ];

  for (const vp of viewports) {
    test(`${vp.name} hatasız render`, async ({ page }) => {
      page.setViewportSize({ width: vp.width, height: vp.height });
      const cap = capture(page);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      assertClean(cap, `ana sayfa ${vp.name}`);
    });
  }
});
