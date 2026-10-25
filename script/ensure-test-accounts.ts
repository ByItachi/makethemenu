// DEV-ONLY: e2e ve manuel testler için geçerli hesapları garanti eder.
// Production'da çalışmaz (NODE_ENV guard). Idempotent: var olan hesabı günceller.
// Run: npx tsx script/ensure-test-accounts.ts
import "../server/env";
import { db } from "../server/db";
import { users, roles, restaurants } from "../shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../server/auth/password";

if (process.env.NODE_ENV === "production") {
  console.error("Bu script yalnızca geliştirme ortamında kullanılabilir.");
  process.exit(1);
}

const ACCOUNTS = [
  {
    email: "demo@makethemenu.com",
    password: "demo1234",
    fullName: "Demo İşletme Sahibi",
    isPlatformAdmin: false,
    needRestaurant: true,
  },
  {
    email: "admin@makethemenu.com",
    password: "admin1234",
    fullName: "Platform Yöneticisi",
    isPlatformAdmin: true,
    needRestaurant: false,
  },
];

async function main() {
  const [defaultRestaurant] = await db.select().from(restaurants).limit(1);
  if (!defaultRestaurant) {
    console.error("Hiç işletme yok; önce temel seed çalıştırılmalı.");
    process.exit(1);
  }

  for (const acc of ACCOUNTS) {
    const baseUsername = acc.email.split("@")[0];
    const passwordHash = await hashPassword(acc.password);
    const [existing] = await db.select().from(users).where(eq(users.email, acc.email));
    if (existing) {
      await db
        .update(users)
        .set({
          password: passwordHash,
          isActive: true,
          emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
          restaurantId: acc.needRestaurant ? (existing.restaurantId ?? defaultRestaurant.id) : existing.restaurantId,
          isPlatformAdmin: acc.isPlatformAdmin,
        })
        .where(eq(users.id, existing.id));
      console.log(`güncellendi: ${acc.email} (id=${existing.id})`);
      if (acc.needRestaurant) {
        await ensureOwnership(existing.id, defaultRestaurant.id);
      }
      continue;
    }
    await db.insert(users).values({
      username: `${baseUsername}-${Date.now().toString(36)}`,
      email: acc.email,
      password: passwordHash,
      fullName: acc.fullName,
      roleId: null,
      restaurantId: acc.needRestaurant ? defaultRestaurant.id : null,
      isPlatformAdmin: acc.isPlatformAdmin,
      emailVerifiedAt: new Date(),
      isActive: true,
    });
    if (acc.needRestaurant) {
      const [created] = await db.select().from(users).where(eq(users.email, acc.email));
      if (created) await ensureOwnership(created.id, defaultRestaurant.id);
    }
    console.log(`olusturuldu: ${acc.email} -> isletme=${acc.needRestaurant ? defaultRestaurant.id : "yok"}`);
  }
  process.exit(0);
}

// İşletme ayarları/faturalama sahiplik ister (ownerUserId). Test hesabı,
// sahipsiz kalmış bir işletmenin sahipliğini yalnızca dev ortamında devralır.
async function ensureOwnership(userId: number, restaurantId: number) {
  const [r] = await db.select().from(restaurants).where(eq(restaurants.id, restaurantId));
  if (!r) return;
  if (r.ownerUserId === null) {
    await db.update(restaurants).set({ ownerUserId: userId }).where(eq(restaurants.id, restaurantId));
    console.log(`sahiplik verildi: restoran=${restaurantId} -> user=${userId}`);
    return;
  }
  const [owner] = await db.select().from(users).where(eq(users.id, r.ownerUserId));
  if (!owner) {
    await db.update(restaurants).set({ ownerUserId: userId }).where(eq(restaurants.id, restaurantId));
    console.log(`sahiplik devralındı (eski sahip silinmiş): restoran=${restaurantId} -> user=${userId}`);
  }
}

main().catch((e) => {
  console.error("HATA:", e);
  process.exit(1);
});
