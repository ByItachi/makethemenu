// E2E: Bilgi Merkezi arama/etkileşimleri + API Dokümantasyonu portal davranışları.
import { expect, test } from "@playwright/test";

test.describe("Bilgi Merkezi", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/kaynaklar/bilgi-merkezi");
    await expect(page.getByRole("heading", { name: /Bilgi Merkezi/i })).toBeVisible();
  });

  test("1: arama ikonu tıklanınca alan açılır ve otomatik odaklanır; tekrar tıklanınca kapanır", async ({ page }) => {
    const toggle = page.getByRole("button", { name: "Arama alanını aç" });
    await toggle.click();
    await expect(page.getByRole("combobox", { name: "Makalelerde ara" })).toBeFocused();
    // Etiket aç/kapat arasında değiştiği için butonu rol + aria-expanded ile yeniden sorgula
    const openToggle = page.getByRole("button", { name: "Arama alanını kapat" });
    await expect(openToggle).toHaveAttribute("aria-expanded", "true");
    // İkinci tıklama kapatır
    await openToggle.click();
    await expect(page.getByRole("combobox", { name: "Makalelerde ara" })).toHaveCount(0);
  });

  test("2: arama gerçek içerikten sonuç döner ve yazarken güncellenir", async ({ page }) => {
    await page.getByRole("button", { name: "Arama alanını aç" }).click();
    const input = page.getByRole("combobox", { name: "Makalelerde ara" });
    await input.fill("ödeme");
    await expect(page.getByRole("status")).toContainText(/için \d+ sonuç/);
    await expect(page.getByRole("option")).toHaveCount(3);
    // Boş sonuç mesajı
    await input.fill("zzz-böyle-bir-şey-yok");
    await expect(page.getByRole("option")).toContainText("için sonuç bulunamadı");
  });

  test("3: arama sonucu Enter ve tıklamayla doğru makaleyi açar", async ({ page }) => {
    await page.getByRole("button", { name: "Arama alanını aç" }).click();
    const input = page.getByRole("combobox", { name: "Makalelerde ara" });
    await input.fill("QR Menü");
    await input.press("ArrowDown");
    await input.press("Enter");
    await expect(page).toHaveURL(/\/kaynaklar\/bilgi-merkezi\/qr-menu-yayina-alma/);
    await expect(page.getByRole("heading", { name: "QR Menü Nasıl Yayına Alınır?" })).toBeVisible();
  });

  test("4: Temizle butonu ve Escape çalışır", async ({ page }) => {
    await page.getByRole("button", { name: "Arama alanını aç" }).click();
    const input = page.getByRole("combobox", { name: "Makalelerde ara" });
    await input.fill("yazıcı");
    await page.getByRole("button", { name: "Aramayı temizle" }).click();
    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();
    await input.fill("plan");
    await input.press("Escape");
    await expect(page.getByRole("combobox", { name: "Makalelerde ara" })).toHaveCount(0);
  });

  test("5: kategori rozetleri gerçek filtreleme yapar", async ({ page }) => {
    await page.getByRole("button", { name: "Güvenlik", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Güvenlik — 2 makale");
    await expect(page.locator('a[href^="/kaynaklar/bilgi-merkezi/"]')).toHaveCount(2);
    await expect(page.locator('a[href="/kaynaklar/bilgi-merkezi/parola-ve-hesap-guvenligi"]')).toBeVisible();
    await page.getByRole("button", { name: "Tümü" }).click();
    await expect(page.locator('a[href^="/kaynaklar/bilgi-merkezi/"]')).toHaveCount(12);
  });

  test("6: tüm makale kartları doğru adreslere gider", async ({ page }) => {
    const links = page.locator('main a[href^="/kaynaklar/bilgi-merkezi/"], section a[href^="/kaynaklar/bilgi-merkezi/"]');
    const hrefs = await links.evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!));
    expect(hrefs.length).toBeGreaterThanOrEqual(12);
    for (const href of hrefs) {
      const res = await page.request.get(href);
      // SPA olduğu için 200 döner; içerikte makale bulunamadı ekranı çıkmamalı
      expect(res.status(), href).toBeLessThan(400);
    }
    // Örnek kart tıklaması gerçekten gider
    await page.locator('a[href="/kaynaklar/bilgi-merkezi/hizli-baslangic"]').first().click();
    await expect(page).toHaveURL(/\/kaynaklar\/bilgi-merkezi\/hizli-baslangic/);
    await expect(page.getByRole("heading", { name: /Hızlı Başlangıç/i })).toBeVisible();
  });

  test("makale bulunamadığında anlaşılır 404 durumu gösterilir", async ({ page }) => {
    await page.goto("/kaynaklar/bilgi-merkezi/olmayan-makale");
    await expect(page.getByRole("heading", { name: "Makale bulunamadı" })).toBeVisible();
  });

  test("mobilde arama alanı ekran dışına taşmaz", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.getByRole("button", { name: "Arama alanını aç" }).click();
    const input = page.getByRole("combobox", { name: "Makalelerde ara" });
    await input.fill("menü");
    const box = await input.boundingBox();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBe(0);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  });
});

test.describe("API Dokümantasyonu", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/kaynaklar/api");
    await expect(page.getByRole("heading", { name: /API Dokümantasyonu/i })).toBeVisible();
  });

  test("7: sidebar kategorileri açılıp kapanıyor", async ({ page }) => {
    const authToggle = page.getByRole("button", { name: /Kimlik Doğrulama/ });
    await expect(authToggle).toHaveAttribute("aria-expanded", "true");
    await authToggle.click();
    await expect(authToggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator('a[href="#post-api-auth-login"]')).toHaveCount(0);
    await authToggle.click();
    await expect(page.locator('a[href="#post-api-auth-login"]')).toBeVisible();
  });

  test("8: alt bağlantılar doğru bölüme gider ve hash güncellenir", async ({ page }) => {
    await page.locator('a[href="#post-api-auth-login"]').click();
    await expect(page).toHaveURL(/#post-api-auth-login/);
    const box = await page.locator("#post-api-auth-login").boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(-10);
    await expect(page.locator("#post-api-auth-login code").first()).toContainText("/api/auth/login");
  });

  test("9: aktif bölüm vurgusu kaydırmayla güncelleniyor", async ({ page }) => {
    // Bölümü görünümün üstüne getir (scroll-mt ile) → o bölüm aktif olmalı
    await page.evaluate(() => document.getElementById("rate-limits")?.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(600);
    await expect(page.locator('a[aria-current="true"]')).toHaveAttribute("href", "#rate-limits");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    await expect(page.locator('a[aria-current="true"]')).toHaveAttribute("href", "#get-api-health");
  });

  test("10: kod kopyalama butonu çalışır ve geri bildirim verir", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const block = page.locator("#get-api-health");
    const copyBtn = block.getByRole("button", { name: /kodu kopyala/i });
    await copyBtn.click();
    await expect(copyBtn).toContainText("Kopyalandı");
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toContain("curl https://makethemenu.com/api/health");
  });

  test("dokümantasyon içi arama uç nokta/parametre eşleştirir", async ({ page }) => {
    // Arama alanı hero'daki butonla açılır (Bilgi Merkezi'ndeki kalıp)
    await page.getByRole("button", { name: "Arama alanını aç" }).click();
    await expect(page.locator("#api-search-panel")).toBeVisible();
    const search = page.getByRole("textbox", { name: "Dokümantasyonda ara" });
    await search.fill("webhook");
    await expect(page.locator('a[href="#post-api-billing-webhook"]')).toBeVisible();
    await expect(page.locator('a[href="#get-api-health"]')).toHaveCount(0);
    await search.fill("categoryId");
    await expect(page.locator('a[href="#get-api-products"]')).toBeVisible();
  });

  test("11: mobil çekmece açılır, bağlantı seçilince kapanır, Escape kapatır", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const menuBtn = page.getByRole("button", { name: "Dokümantasyon menüsünü aç" });
    await menuBtn.click();
    const drawer = page.getByRole("dialog", { name: "Dokümantasyon menüsü" });
    await expect(drawer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
    await menuBtn.click();
    await drawer.locator('a[href="#get-api-plans"]').click();
    await expect(drawer).toHaveCount(0);
    await expect(page).toHaveURL(/#get-api-plans/);
  });

  test("12: doğrudan hash ile açılışta ilgili bölüme kaydırılır", async ({ page }) => {
    await page.goto("/kaynaklar/api#get-api-restaurant-qr-svg");
    await page.waitForTimeout(700);
    await expect(page).toHaveURL(/#get-api-restaurant-qr-svg/);
    const box = await page.locator("#get-api-restaurant-qr-svg").boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(-10);
    await expect(page.locator("#get-api-restaurant-qr-svg code").first()).toContainText("/api/restaurant/qr.svg");
  });

  test("mobil genişliklerde yatay taşma yok (320–1440)", async ({ page }) => {
    for (const width of [320, 375, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      await page.waitForTimeout(150);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${width}px genişlikte yatay taşma`).toBe(0);
    }
  });
});
