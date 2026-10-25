// Global setup: test süitleri için oturum dosyalarını bir kez oluşturur.
// Tek amaç: her testin ayrı UI girişi yapıp login rate-limit'e takılmasını
// engellemek. 2 API girişi (işletme + yönetici) yapılır, çerezler diske yazılır.
import { request as pwRequest } from "@playwright/test";
import fs from "fs";

const base = process.env.BASE_URL ?? "http://localhost:3002";

const STATES: Array<{ file: string; identifier: string; password: string }> = [
  { file: ".auth/customer.json", identifier: "demo@makethemenu.com", password: "demo1234" },
  { file: ".auth/admin.json", identifier: "admin@makethemenu.com", password: "admin1234" },
];

export default async function globalSetup() {
  fs.mkdirSync(".auth", { recursive: true });
  for (const s of STATES) {
    const ctx = await pwRequest.newContext({ baseURL: base });
    try {
      const res = await ctx.post("/api/auth/login", {
        data: { identifier: s.identifier, password: s.password },
      });
      if (!res.ok()) {
        throw new Error(
          `globalSetup: giriş başarısız (${s.identifier}) HTTP ${res.status()}. ` +
            `Hesapları kurmak için: npx tsx script/ensure-test-accounts.ts`,
        );
      }
      await ctx.storageState({ path: s.file });
    } finally {
      await ctx.dispose();
    }
  }
  console.log(`globalSetup: oturum dosyaları hazır (${base})`);
}
