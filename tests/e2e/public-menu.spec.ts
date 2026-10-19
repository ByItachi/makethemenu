// E2E: public menu browsing + ordering on the free /p/<slug> structure.
import { expect, test } from "@playwright/test";

const DEMO_SLUG = "demo-restoran";

test.describe("Halka açık menü (/p/slug)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/p/${DEMO_SLUG}`);
    // Çerez banner'ı sayfanın altını kapatır; gerçek kullanıcı gibi kabul edilir.
    const accept = page.getByRole("button", { name: "Kabul Et" });
    if (await accept.isVisible().catch(() => false)) await accept.click();
    await accept.waitFor({ state: "hidden", timeout: 10_000 }).catch(() => {});
  });

  test("menü yüklenir, kategori ve ürünler görünür", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("main")).toContainText("₺");
  });

  test("ürün detay paneli açılır ve sepete ekleme çalışır", async ({ page }) => {
    await expect(page.locator("main")).toBeVisible();

    // Open the first product row
    const firstProduct = page.locator("main section li button").first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.click();

    // Product sheet appears with add-to-cart
    const addBtn = page.getByRole("button", { name: "+ Sepete ekle" }).first();
    await expect(addBtn).toBeVisible({ timeout: 15_000 });
    await addBtn.click();

    // Floating cart button appears with count
    await expect(page.getByTestId("button-open-cart")).toContainText("Sepet (1)", { timeout: 15_000 });
  });

  test("sipariş akışı: sepet → form → sipariş onayı", async ({ page }) => {
    const firstProduct = page.locator("main section li button").first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.click();
    await page.getByRole("button", { name: "+ Sepete ekle" }).first().click();

    // "Eklendi" toast'u butonun üstünü kapatarak tıklamayı engeller; kaybolmasını bekle.
    await page.locator('[role="status"][data-state="open"]').first().waitFor({ state: "hidden", timeout: 15_000 }).catch(() => {});

    await page.getByTestId("button-open-cart").click();
    await page.getByLabel("Adınız").fill("E2E Test Müşteri");
    await page.getByLabel("Telefon").fill("05550000000");
    await page.getByTestId("button-place-order").click();

    await expect(page.getByText("Siparişiniz alındı")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Sipariş numarası: #\d+/)).toBeVisible();
  });
});
