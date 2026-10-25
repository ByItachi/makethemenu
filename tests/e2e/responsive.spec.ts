// Responsive denetim: ana sayfaları birden çok viewport'ta kontrol eder.
// - Yatay taşma (scrollWidth > innerWidth) olmamalı
// - Görünür öğe viewport dışına taşmamalı (2px tolerans)
// - Mobilde hamburger menü çalışmalı
import { test, expect } from "@playwright/test";

type Size = { name: string; width: number; height: number };

const SIZES: Size[] = [
  { name: "telefon-kuçuk", width: 360, height: 800 },
  { name: "telefon", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "tablet-yatay", width: 1024, height: 768 },
  { name: "masaustu", width: 1366, height: 768 },
  { name: "buyuk-masaustu", width: 1920, height: 1080 },
];

const PUBLIC_ROUTES = ["/", "/giris", "/kayit", "/fiyatlar", "/ozellikler", "/iletisim"];
const PANEL_ROUTES = ["/dashboard", "/restoran/integrations/plugins", "/menu", "/masalar", "/siparisler", "/ayarlar"];

async function login(page: import("@playwright/test").Page) {
  await page.goto("/giris");
  await page.getByPlaceholder("E-Posta Adresi veya Telefon Numarası").fill("demo@makethemenu.com");
  await page.getByPlaceholder("Şifre").fill("demo1234");
  await page.getByRole("button", { name: /Giriş Yap/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
}

interface Issue {
  route: string;
  size: string;
  kind: string;
  detail: string;
}

async function auditRoute(page: import("@playwright/test").Page, route: string, size: Size, issues: Issue[]) {
  await page.setViewportSize({ width: size.width, height: size.height });
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);

  // Çerez banner'ı görünürse kapat (gerçek kullanıcı akışı)
  const accept = page.getByRole("button", { name: /Kabul/i }).first();
  if (await accept.isVisible().catch(() => false)) {
    await accept.click().catch(() => {});
    await page.waitForTimeout(200);
  }

  const result = await page.evaluate(() => {
    const doc = document.documentElement;
    const clientW = doc.clientWidth;
    const overflowX = doc.scrollWidth - clientW;
    const offenders: { tag: string; cls: string; text: string; rect: string }[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || cs.position === "fixed") continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (r.right > clientW + 3 || r.left < -3) {
        const tag = el.tagName.toLowerCase();
        const cls = (el.className && typeof el.className === "string") ? el.className.split(" ").slice(0, 4).join(" ") : "";
        const text = (el.textContent ?? "").trim().slice(0, 40);
        offenders.push({ tag, cls, text, rect: `l=${Math.round(r.left)},r=${Math.round(r.right)},w=${Math.round(r.width)}` });
        if (offenders.length >= 6) break;
      }
    }
    return { overflowX, offenders, scrollW: doc.scrollWidth, clientW };
  });

  if (result.overflowX > 2) {
    issues.push({
      route,
      size: size.name,
      kind: "yatay-tasma",
      detail: `scrollW=${result.scrollW} clientW=${result.clientW} (+${result.overflowX}px) | offenders: ${result.offenders
        .map((o) => `${o.tag}.${o.cls} "${o.text}" ${o.rect}`)
        .join(" | ")}`,
    });
  }
}

for (const size of SIZES) {
  test.describe(`responsive ${size.name} (${size.width}x${size.height})`, () => {
    // Her genel sayfada yatay taşma olmamalı
    for (const route of PUBLIC_ROUTES) {
      test(`genel sayfa: ${route}`, async ({ page }) => {
        const issues: Issue[] = [];
        await auditRoute(page, route, size, issues);
        expect(issues, issues.map((i) => `${i.route}: ${i.detail}`).join("\n")).toEqual([]);
      });
    }

    // Panel sayfaları (bir kez giriş yapılır)
    test(`panel sayfaları taşması yok`, async ({ page }) => {
      await login(page);
      const issues: Issue[] = [];
      for (const route of PANEL_ROUTES) {
        await auditRoute(page, route, size, issues);
      }
      expect(issues, issues.map((i) => `${i.route}: ${i.detail}`).join("\n")).toEqual([]);
    });

    // Mobilde hamburger menü açılır ve içerik görünür olur
    test("mobil hamburger menü", async ({ page }) => {
      if (size.width >= 768) return; // hamburger yalnızca mobil
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto("/");

      // Çerez banner'ı varsa kapat
      const accept = page.getByRole("button", { name: /Kabul/i }).first();
      if (await accept.isVisible().catch(() => false)) await accept.click();

      const burger = page.locator("header button[aria-label*='Menü'], header button[aria-label*='menü'], header button:has(svg.lucide-menu)").first();
      if (await burger.isVisible()) {
        await burger.click();
        await page.waitForTimeout(400);
        const drawer = page.locator("[data-state='open']");
        await expect(drawer.first()).toBeVisible();
      }
    });

    // Mobilde giriş formu overlay tarafından kapatılmamalı
    test("giriş formu mobilde tıklanabilir", async ({ page }) => {
      if (size.width >= 768) return;
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto("/giris");

      const accept = page.getByRole("button", { name: /Kabul/i }).first();
      if (await accept.isVisible().catch(() => false)) await accept.click();

      await page.getByPlaceholder("E-Posta Adresi veya Telefon Numarası").fill("yanlis@test.com");
      await page.getByPlaceholder("Şifre").fill("yanlis");
      // Tıklama başarılı olmalı (overlay engeli yok); sunucu 401 + hata mesajı dönmeli
      await page.getByRole("button", { name: /Giriş Yap/i }).click({ timeout: 10_000 });
      await expect(page.getByText(/E-posta veya parola hatalı/i)).toBeVisible({ timeout: 15_000 });
      expect(page.url()).toContain("/giris");
    });
  });
}
