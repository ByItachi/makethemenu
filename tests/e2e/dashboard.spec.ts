// E2E: login flow and the business dashboard (CSV export, AI menu dialog, settings).
import { expect, test } from "@playwright/test";

const DEMO_EMAIL = process.env.MTM_DEMO_EMAIL ?? "demo@makethemenu.com";
const DEMO_PASSWORD = process.env.MTM_DEMO_PASSWORD ?? "demo1234";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/giris");
  await page.getByPlaceholder("E-Posta Adresi veya Telefon Numarası").fill(DEMO_EMAIL);
  await page.getByPlaceholder("Şifre").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: /Giriş Yap/i }).click();
  await expect(page).toHaveURL(/\/panel/, { timeout: 20_000 });
}

test.describe("İşletme paneli", () => {
  test("demo hesabıyla giriş yapılabiliyor ve panele yönleniyor", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("heading", { name: /Yönetim Paneli/i })).toBeVisible({ timeout: 20_000 });
  });

  test("dashboard'da CSV dışa aktarma butonları görünür ve CSV döner", async ({ page }) => {
    await login(page);

    await expect(page.getByTestId("button-export-orders")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("button-export-analytics")).toBeVisible();

    // Direct CSV check: endpoint returns a text/csv attachment.
    const csv = await page.request.get("/api/orders/export");
    expect(csv.status()).toBe(200);
    expect(csv.headers()["content-type"]).toContain("text/csv");
    const body = await csv.text();
    expect(body).toContain("SiparisID");
  });

  test("menü sayfasında AI üretici ve 3D butonları mevcut", async ({ page }) => {
    await login(page);

    await page.goto("/menu");
    await expect(page.getByTestId("button-ai-menu")).toBeVisible({ timeout: 20_000 });

    await page.getByTestId("button-ai-menu").click();
    await expect(page.getByTestId("button-ai-generate")).toBeVisible();
    await page.keyboard.press("Escape");

    await expect(page.getByLabel(/3D model/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test("işletme ayarlarında özel alan adı kartı görünür", async ({ page }) => {
    await login(page);

    await page.goto("/isletme");
    await expect(page.getByText("Özel alan adı (ek özellik)")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/makethemenu\.com\/p\//i).first()).toBeVisible();
  });
});
