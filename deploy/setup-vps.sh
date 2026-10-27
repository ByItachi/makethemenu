#!/usr/bin/env bash
# MakeTheMenu - VPS ilk kurulum script'i (Ubuntu 22.04 / 24.04)
# Kullanım: VPS'e root olarak bağlanın, bu dosyayı kopyalayıp çalıştırın:
#   chmod +x setup-vps.sh && ./setup-vps.sh
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Bu script root olarak çalıştırılmalıdır (sudo ./setup-vps.sh)."
  exit 1
fi

echo "==> Sistem güncelleniyor..."
apt-get update -y
apt-get upgrade -y

echo "==> Temel paketler kuruluyor..."
apt-get install -y ca-certificates curl gnupg ufw fail2ban git nginx

echo "==> Docker kuruluyor..."
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
  echo "Docker zaten kurulu, atlanıyor."
fi

echo "==> Güvenlik duvarı (UFW) yapılandırılıyor..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> Fail2ban etkinleştiriliyor (SSH brute-force koruması)..."
systemctl enable --now fail2ban

echo "==> Uygulama dizini oluşturuluyor: /opt/makethemenu"
mkdir -p /opt/makethemenu
mkdir -p /opt/backups

echo ""
echo "============================================================"
echo "  Kurulum tamamlandı."
echo "  Sonraki adımlar:"
echo "   1. Proje dosyalarını /opt/makethemenu içine aktarın"
echo "      (git clone <repo-url> /opt/makethemenu   veya   scp ile kopyalama)"
echo "   2. /opt/makethemenu/.env dosyasını oluşturup doldurun"
echo "      (bkz. docs/VPS-KURULUM.md adım 4)"
echo "   3. cd /opt/makethemenu && docker compose up --build -d"
echo "   4. Nginx + SSL için docs/VPS-KURULUM.md adım 6'yı izleyin"
echo "============================================================"
