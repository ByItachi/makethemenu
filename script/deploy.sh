#!/usr/bin/env bash
# Builds the app locally and deploys dist/ to the production server (restopos-vps).
# Server-side npm install / drizzle-kit push are NOT run here — only needed when
# package.json or the DB schema changes; run those manually over SSH when relevant.
set -e

cd "$(dirname "$0")/.."

echo "==> Building..."
npm run build

echo "==> Packaging dist/..."
tar -czf dist-deploy.tar.gz dist

echo "==> Uploading..."
scp -o BatchMode=yes dist-deploy.tar.gz restopos-vps:~/dist-deploy.tar.gz

echo "==> Extracting on server and restarting..."
ssh -o BatchMode=yes restopos-vps '
  rm -rf ~/restopos/dist
  tar -xzf ~/dist-deploy.tar.gz -C ~/restopos
  rm ~/dist-deploy.tar.gz
  /usr/sbin/cloudlinux-selector restart --json --interpreter nodejs --domain makethemenu.com --app-root restopos
'

rm dist-deploy.tar.gz

echo "==> Verifying..."
sleep 3
code=$(curl -s -o /dev/null -w '%{http_code}' https://makethemenu.com/)
echo "https://makethemenu.com/ -> HTTP $code"
