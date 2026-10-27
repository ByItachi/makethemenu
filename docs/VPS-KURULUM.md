# MakeTheMenu — VPS Kurulum Rehberi

Bu rehber, uygulamayı bir VPS üzerinde (Ubuntu 22.04/24.04) Docker ile canlıya almak için adım adım talimatlar içerir.

## 0) Önkoşullar

- Bir VPS (örnek sağlayıcılar: Hetzner, DigitalOcean, Contabo, Hostinger VPS). Önerilen minimum: **2 vCPU, 4 GB RAM, 40 GB disk**.
- VPS işletim sistemi: **Ubuntu 22.04 LTS** veya **24.04 LTS**.
- Bir alan adı (domain) — SSL sertifikası ve gerçek kullanım için gereklidir (opsiyonel ama önerilir).
- VPS'e SSH erişimi (sağlayıcı panelinden IP + root şifresi veya SSH anahtarı verilir).

## 1) VPS'e bağlanın

```bash
ssh root@<VPS_IP_ADRESINIZ>
```

## 2) Otomatik kurulum script'ini çalıştırın

Bu repodaki `deploy/setup-vps.sh` dosyasını VPS'e kopyalayıp çalıştırın:

```bash
curl -o setup-vps.sh https://raw.githubusercontent.com/<kullanici-adiniz>/<repo-adi>/main/deploy/setup-vps.sh
chmod +x setup-vps.sh
./setup-vps.sh
```

(Repo private ise, dosyayı `scp` ile VPS'e manuel kopyalayın.)

Script şunları yapar:
- Sistemi günceller
- Docker ve Docker Compose'u kurar
- UFW güvenlik duvarını yapılandırır (22, 80, 443 portları açık)
- Fail2ban kurar (SSH brute-force koruması)
- Uygulama için `/opt/makethemenu` dizini oluşturur

## 3) Projeyi VPS'e aktarın

Yerel makinenizden:

```bash
# Git kullanıyorsanız (önerilen):
ssh root@<VPS_IP> "cd /opt/makethemenu && git clone <repo-url> ."

# Veya doğrudan dosya kopyalama:
scp -r "C:/Users/root/Downloads/Site-Ic-Tasarim/Site-Ic-Tasarim"/* root@<VPS_IP>:/opt/makethemenu/
```

## 4) `.env` dosyasını VPS'te oluşturun

VPS üzerinde `/opt/makethemenu/.env` dosyasını oluşturun (yerelden **kopyalamayın** — secret'lar asla repo/transfer dosyasında taşınmamalı, VPS'te elle doldurun):

```bash
cd /opt/makethemenu
cp .env.example .env   # örnek yoksa aşağıdaki şablonu kullanın
nano .env
```

Doldurulması gereken temel alanlar:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://restopos:<GUCLU_SIFRE>@mysql:3306/makethemenu
SESSION_SECRET=<openssl rand -hex 32 ile üretin>
SMS_PROVIDER=makethemenu
MTM_SMS_UPSTREAM=mock        # gerçek sağlayıcı bağlandığında admin panelinden değiştirilir
MYSQL_ROOT_PASSWORD=<GUCLU_SIFRE>
MYSQL_DATABASE=makethemenu
MYSQL_USER=restopos
MYSQL_PASSWORD=<GUCLU_SIFRE>
```

`SESSION_SECRET` üretmek için:
```bash
openssl rand -hex 32
```

## 5) Uygulamayı başlatın

```bash
cd /opt/makethemenu
docker compose up --build -d
docker compose ps        # servislerin "healthy"/"running" olduğunu doğrulayın
docker compose logs -f app   # logları izleyin
```

## 6) Nginx reverse proxy + SSL (Let's Encrypt)

Uygulama VPS'te 3000 portunda çalışıyor; domain üzerinden 443 (HTTPS) ile erişim için Nginx + Certbot kurulumu:

```bash
apt install -y nginx certbot python3-certbot-nginx

cat > /etc/nginx/sites-available/makethemenu <<'EOF'
server {
    listen 80;
    server_name sizin-domaininiz.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/makethemenu /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

certbot --nginx -d sizin-domaininiz.com
```

Certbot otomatik olarak SSL sertifikasını kurar ve Nginx yapılandırmasını HTTPS'e yönlendirir. Sertifika 90 günde bir otomatik yenilenir (certbot systemd timer ile).

## 7) Domain'i VPS'e yönlendirin

Alan adı sağlayıcınızın DNS panelinden bir **A kaydı** oluşturun:

```
Tür: A
Host: @  (veya www)
Değer: <VPS_IP_ADRESINIZ>
TTL: 3600 (varsayılan)
```

DNS yayılması genelde 5 dakika - birkaç saat sürebilir.

## 8) Doğrulama

```bash
curl -I https://sizin-domaininiz.com
curl https://sizin-domaininiz.com/api/auth/user
```

### İlk hesabınızı oluşturun ve platform yöneticisi yapın

Güvenlik nedeniyle üretimde hiçbir demo/varsayılan hesap otomatik oluşturulmaz.
İlk hesabınızı normal kayıt ekranından (`/register` veya ana sayfadaki "Kayıt Ol")
oluşturun, ardından bu hesabı platform yöneticisi yapmak için VPS üzerinde:

```bash
cd /opt/makethemenu
docker compose exec app npx tsx script/promote-platform-admin.ts sizin@eposta.com
```

Bu komut yalnızca zaten var olan bir hesabı yükseltir; hardcoded şifre içermez.
Ardından `/admin/sms` sayfasından SMS sağlayıcı durumunu kontrol edin.

## 9) Gerçek SMS sağlayıcısı bağlama

VPS canlıya alındıktan sonra, gerçek telefonlara SMS göndermek için:

1. `/admin/sms` sayfasını açın
2. **MakeTheMenu SMS Sağlayıcısı** kartından İletiMerkezi/NetGSM/Twilio bilgilerinizi girin
3. **Test SMS** ile doğrulayın

> İletiMerkezi yeni üyeliklerde ücretsiz test kredisi verir — gerçek numaraya gönderim denemesi için en hızlı seçenektir.

## 10) Yedekleme (önerilir)

```bash
# MySQL yedek script'i (cron ile günlük çalıştırın)
docker exec makethemenu-mysql mysqldump -u root -p<SIFRE> makethemenu > /opt/backups/makethemenu-$(date +%F).sql
```

## 11) Güncelleme akışı

Kod güncellemesi geldiğinde:

```bash
cd /opt/makethemenu
git pull
docker compose up --build -d
```

## Sorun Giderme

| Belirti | Olası Neden | Çözüm |
|---|---|---|
| `docker compose up` MySQL bağlantı hatası verir | MySQL henüz hazır değil | `depends_on: condition: service_healthy` zaten var; birkaç saniye bekleyin |
| 502 Bad Gateway (Nginx) | App container çalışmıyor | `docker compose logs app` ile hatayı kontrol edin |
| SSL sertifikası alınamıyor | DNS henüz yayılmamış | `dig sizin-domaininiz.com` ile A kaydını doğrulayın, yayılmasını bekleyin |
| SMS gönderilmiyor | Upstream sağlayıcı yapılandırılmamış | `/admin/sms` → Sağlayıcı kartından API bilgilerini girin |
