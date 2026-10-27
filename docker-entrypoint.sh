#!/bin/sh
# Konteyner başlangıcında şema migrasyonlarını uygular, ardından sunucuyu başlatır.
# Tüm migrasyon betikleri idempotenttir (zaten uygulanmışsa atlar), bu yüzden her
# başlangıçta tekrar çalıştırmak güvenlidir.
set -e

echo "==> Veritabanı şeması uygulanıyor (drizzle-kit push)..."
npx drizzle-kit push --force || npx drizzle-kit push

echo "==> Sıralı migrasyonlar uygulanıyor..."
for f in tenancy v3 auth-plans v4 v5 v6 v7 v8 v9 v10 v11 v12 v13 v14 v15 v16 v17 v18 v19 v20 v21 v22 v23 v24 v25 v26 v27 v28; do
  if [ -f "server/migrations/${f}.ts" ]; then
    echo "  -> ${f}"
    npx tsx "server/migrations/${f}.ts"
  fi
done

echo "==> Sunucu başlatılıyor..."
exec node dist/index.cjs
