#!/usr/bin/env bash
# Sunucuda (root olarak) çalışır; script/deploy.sh tarafından yüklenip tetiklenir.
# Akış: yedek → paketi aç → (gerekirse) npm install → şema eşitleme + migration'lar → PM2 restart → health.
set -euo pipefail

APP_DIR="${APP_DIR:-/home/makethemenu/restopos}"
PM2_NAME="${PM2_NAME:-makethemenu}"
RELEASE="${RELEASE:-/root/mtm-release.tar.gz}"
BACKUP_DIR="${BACKUP_DIR:-/root/mtm-backups}"
HEALTH_URL="${HEALTH_URL:-https://www.makethemenu.com/api/health}"
DB_NAME="${DB_NAME:-makethemenu_app}"
REF_DB="${DB_NAME}_schemaref"
STAMP="$(date +%Y%m%d-%H%M%S)"

export PATH=/opt/cpanel/ea-nodejs22/bin:$PATH
cd "$APP_DIR"

load_env() {
  eval "$(python3 -c "
import re,shlex
for l in open('.env'):
    m=re.match(r'^([A-Z_][A-Z0-9_]*)=(.*)$', l.rstrip('\n'))
    if m: print('export %s=%s' % (m.group(1), shlex.quote(m.group(2))))
")"
}

echo "==> [1/6] Yedek alınıyor ($STAMP)"
mkdir -p "$BACKUP_DIR"
mysqldump --single-transaction "$DB_NAME" | gzip > "$BACKUP_DIR/db-$STAMP.sql.gz"
tar --exclude=./node_modules -czf "$BACKUP_DIR/restopos-$STAMP.tar.gz" -C "$APP_DIR" .
cp .env "$BACKUP_DIR/env-$STAMP"
chmod 600 "$BACKUP_DIR/env-$STAMP"

echo "==> [2/6] Yeni sürüm açılıyor"
OLD_LOCK_SUM="$(sha256sum package-lock.json 2>/dev/null | cut -d' ' -f1 || true)"
rm -rf dist server shared script
tar -xzf "$RELEASE" -C "$APP_DIR"
NEW_LOCK_SUM="$(sha256sum package-lock.json | cut -d' ' -f1)"

if [ "$OLD_LOCK_SUM" != "$NEW_LOCK_SUM" ] || [ ! -d node_modules ]; then
  echo "==> [3/6] package-lock değişti: npm install"
  npm install --no-audit --no-fund
else
  echo "==> [3/6] Bağımlılıklar değişmedi (npm install atlandı)"
fi

echo "==> [4/6] Şema eşitleme + migration'lar"
load_env
DB_USER="$(python3 -c "import os,urllib.parse as u;print(u.urlparse(os.environ['DATABASE_URL']).username)")"
REF_URL="$(python3 -c "import os,urllib.parse as u;p=u.urlparse(os.environ['DATABASE_URL']);print(p._replace(path='/$REF_DB').geturl())")"
mysql -e "DROP DATABASE IF EXISTS \`$REF_DB\`; CREATE DATABASE \`$REF_DB\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL PRIVILEGES ON \`$REF_DB\`.* TO '$DB_USER'@'localhost'; FLUSH PRIVILEGES;"
DATABASE_URL="$REF_URL" ./node_modules/.bin/drizzle-kit push --force > /tmp/mtm-drizzle-ref.log 2>&1 || { tail -20 /tmp/mtm-drizzle-ref.log; exit 1; }
python3 script/schema-sync.py "$REF_DB" "$DB_NAME" --apply
mysql -e "DROP DATABASE IF EXISTS \`$REF_DB\`;"
MIGRATIONS="$(grep -oP '^for f in \K[^;]+' docker-entrypoint.sh 2>/dev/null || true)"
if [ -z "$MIGRATIONS" ]; then
  MIGRATIONS="$(ls server/migrations | sed -n 's/^\(tenancy\|auth-plans\|v[0-9]\+\)\.ts$/\1/p' | sort -V | tr '\n' ' ')"
fi
for f in $MIGRATIONS; do
  [ -f "server/migrations/$f.ts" ] || continue
  ./node_modules/.bin/tsx "server/migrations/$f.ts" > "/tmp/mtm-mig-$f.log" 2>&1 || { echo "migration $f başarısız:"; tail -20 "/tmp/mtm-mig-$f.log"; exit 1; }
done
echo "    migration'lar tamam: $MIGRATIONS"

echo "==> [5/6] PM2 yeniden başlatılıyor"
pm2 restart "$PM2_NAME" --update-env
pm2 save > /dev/null

echo "==> [6/6] Sağlık kontrolü"
for i in $(seq 1 20); do
  sleep 2
  body="$(curl -fsS "$HEALTH_URL" 2>/dev/null || true)"
  if echo "$body" | grep -q '"status":"ok"'; then
    echo "    $HEALTH_URL -> $body"
    rm -f "$RELEASE"
    echo "==> Dağıtım başarılı. Yedek: $BACKUP_DIR/*-$STAMP.*"
    exit 0
  fi
done
echo "!! Sağlık kontrolü başarısız. Son loglar:"
pm2 logs "$PM2_NAME" --lines 40 --nostream || true
echo "Geri dönüş: cd $APP_DIR && rm -rf dist server shared script && tar -xzf $BACKUP_DIR/restopos-$STAMP.tar.gz -C $APP_DIR && (gunzip -c $BACKUP_DIR/db-$STAMP.sql.gz | mysql $DB_NAME) && pm2 restart $PM2_NAME --update-env"
exit 1
