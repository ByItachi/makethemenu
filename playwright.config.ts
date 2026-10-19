import { defineConfig } from "@playwright/test";
import { randomBytes } from "crypto";

const PORT = Number(process.env.PORT ?? 3002);
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

// Permanent E2E suite (Playwright). Runs against the running dev server
// (reuseExistingServer) or boots one itself. Unit/integration tests stay in tests/*.test.ts
// and are NOT picked up here: this config matches only tests/e2e/**/*.spec.ts.
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: BASE_URL,
    locale: "tr-TR",
    colorScheme: "light",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      `npx tsx server/index.ts`,
    port: PORT,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      PORT: String(PORT),
      NODE_ENV: "development",
      PUBLIC_BASE_URL: BASE_URL,
      AUTH_REGISTER_MAX: "1000",
      AUTH_FORGOT_MAX: "1000",
      AUTH_VERIFY_MAX: "1000",
      AUTH_LOGIN_MAX: "1000",
      PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER ?? "mock",
      PAYMENT_MODE: process.env.PAYMENT_MODE ?? "test",
      PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET ?? randomBytes(32).toString("hex"),
    },
  },
});
