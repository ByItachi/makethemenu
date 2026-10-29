#!/usr/bin/env bash
# MakeTheMenu canlı dağıtım (CloudLinux + cPanel + LiteSpeed + PM2, SSH port 2222).
# Yerelde derler, HEAD commit'inden paket üretir, sunucuya yükler ve script/deploy-remote.sh'yi çalıştırır.
# Şifre bu dosyada TUTULMAZ: SSH anahtarı (önerilen) ya da etkileşimli şifre girişi kullanılır.
#
# Ayarlar (ortam değişkeni):
#   MTM_SSH_TARGET  (varsayılan root@185.17.139.100)
#   MTM_SSH_PORT    (varsayılan 2222)
#   MTM_APP_DIR     (varsayılan /home/makethemenu/restopos)
#   MTM_HEALTH_URL  (varsayılan https://www.makethemenu.com/api/health)
#   MTM_ALLOW_DIRTY=1  commit edilmemiş değişiklik varken de devam et (paket yine HEAD'den üretilir)
set -euo pipefail

cd "$(dirname "$0")/.."

SSH_TARGET="${MTM_SSH_TARGET:-root@185.17.139.100}"
SSH_PORT="${MTM_SSH_PORT:-2222}"
APP_DIR="${MTM_APP_DIR:-/home/makethemenu/restopos}"
HEALTH_URL="${MTM_HEALTH_URL:-https://www.makethemenu.com/api/health}"
SSH_OPTS=(-o ServerAliveInterval=30)
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*) ;;
  *)
    mkdir -p "$HOME/.ssh"
    SSH_OPTS+=(-o ControlMaster=auto -o ControlPath="$HOME/.ssh/mtm-deploy-%C" -o ControlPersist=300)
    ;;
esac

if [ -n "$(git status --porcelain)" ] && [ "${MTM_ALLOW_DIRTY:-0}" != "1" ]; then
  echo "!! Commit edilmemiş değişiklikler var. Paket HEAD'den üretilir; önce commit edin ya da MTM_ALLOW_DIRTY=1 verin." >&2
  exit 1
fi

echo "==> Derleniyor ($(git rev-parse --short HEAD))"
./node_modules/.bin/tsx script/build.ts

echo "==> Paketleniyor"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
git archive --format=tar -o "$WORK/src.tar" HEAD -- server shared script drizzle.config.ts package.json package-lock.json tsconfig.json .env.example docs deploy docker-entrypoint.sh
mkdir -p "$WORK/rel"
tar -xf "$WORK/src.tar" -C "$WORK/rel"
cp -r dist "$WORK/rel/"
tar -czf "$WORK/mtm-release.tar.gz" -C "$WORK/rel" .
du -h "$WORK/mtm-release.tar.gz" | cut -f1 | sed 's/^/    paket boyutu: /'

echo "==> Yükleniyor ($SSH_TARGET:$SSH_PORT)"
scp -P "$SSH_PORT" "${SSH_OPTS[@]}" "$WORK/mtm-release.tar.gz" "$SSH_TARGET:/root/mtm-release.tar.gz"
scp -P "$SSH_PORT" "${SSH_OPTS[@]}" script/deploy-remote.sh "$SSH_TARGET:/root/mtm-deploy-remote.sh"

echo "==> Sunucuda dağıtım"
ssh -p "$SSH_PORT" "${SSH_OPTS[@]}" "$SSH_TARGET" \
  "APP_DIR='$APP_DIR' HEALTH_URL='$HEALTH_URL' bash /root/mtm-deploy-remote.sh"

case " ${SSH_OPTS[*]} " in
  *ControlMaster*) ssh -p "$SSH_PORT" "${SSH_OPTS[@]}" -O exit "$SSH_TARGET" 2>/dev/null || true ;;
esac
echo "==> Bitti."
