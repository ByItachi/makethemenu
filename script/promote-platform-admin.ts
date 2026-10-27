// Üretimde ilk platform yöneticisini belirlemek için: normal /api/auth/register ile
// önce bir hesap oluşturun, sonra bu script ile o hesabı platform admin yapın.
// Hardcoded şifre YOKTUR; yalnızca zaten var olan bir e-postayı yükseltir.
// Run: DATABASE_URL=... npx tsx script/promote-platform-admin.ts kullanici@eposta.com
import "../server/env";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Kullanım: npx tsx script/promote-platform-admin.ts kullanici@eposta.com");
    process.exit(1);
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) {
    console.error(`Hata: ${email} ile kayıtlı kullanıcı bulunamadı. Önce /api/auth/register ile kayıt olun.`);
    process.exit(1);
  }

  if (user.isPlatformAdmin) {
    console.log(`${email} zaten platform yöneticisi.`);
    process.exit(0);
  }

  await db.update(users).set({ isPlatformAdmin: true }).where(eq(users.id, user.id));
  console.log(`${email} artık platform yöneticisi.`);
  process.exit(0);
}

main().catch((e) => {
  console.error("HATA:", e);
  process.exit(1);
});
