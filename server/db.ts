import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// MySQL sunucusunun sistem saat dilimi UTC olmayabilir (ör. Europe/Istanbul). Bağlantı düzeyinde
// oturumu UTC'ye sabitlemezsek, uygulama tarafında hesaplanan Date değerleri (ör. OTP son kullanma
// zamanı) sunucunun yerel saatine göre yanlış yorumlanıp birkaç saat kayar. timezone:"Z" sürücünün
// Date<->string dönüşümünü UTC varsayımıyla yapmasını, SET time_zone ise MySQL oturumunun NOW()/
// CURRENT_TIMESTAMP gibi sunucu taraflı değerleri de UTC döndürmesini sağlar.
export const pool = mysql.createPool({ uri: process.env.DATABASE_URL!, timezone: "Z" });
pool.on("connection", (conn) => {
  // pool.on("connection") verdiği bağlantı nesnesi mysql2'nin callback tabanlı (promise'siz) API'sidir;
  // TypeScript tipleri bunu promise tabanlı PoolConnection sanıyor, bu yüzden any ile çağırıyoruz.
  (conn as any).query("SET time_zone = '+00:00'", (err: Error | null) => {
    if (err) console.error("[db] time_zone ayarlanamadı:", err.message);
  });
});
export const db = drizzle(pool, { schema, mode: "default" });
