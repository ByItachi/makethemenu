# MakeTheMenu Kendi SMS Gateway'i

MakeTheMenu, SMS göndermek için aracı bir firmaya (İletiMerkezi, NetGSM, Twilio) **bağlı değildir**.
Kendi gateway motorumuz, SIM kartlı cihazları (Android telefon veya USB GSM modem) "gönderim düğümü" olarak kullanır.

```
Restoran / API / OTP ──► sms_outbox (kuyruk) ──► claim (kilitli dağıtım) ──► Bridge cihazı ──► SIM ──► Alıcı
                                    ▲                                            │
                                    └──────── sonuç (sent / failed / delivered) ◄┘
                         sms_inbound ◄──────── gelen SMS ◄──────────────────────┘
```

## Nasıl çalışır

- Her mesaj `sms_outbox` tablosuna eklenir (bakiye düşümü, zamanlama, API anahtarı vb. değişmedi).
- Sağlayıcı **"Kendi Gateway'imiz"** (`provider: gateway`) seçiliyken sunucu mesajı kendisi göndermez.
  Eşleştirilmiş cihazlar `POST /api/sms-gateway/jobs/claim` ile iş çeker.
- Dağıtım tek bir `UPDATE … ORDER BY id LIMIT n` ile benzersiz bir claim jetonuyla yapılır. İki cihaz aynı mesajı aynı anda alamaz.
- Her cihazın **günlük** ve **dakikalık** limiti vardır. Limit dolunca cihaz iş almaz, kalan iş diğer cihazlara gider. Bu, cihazlar arasında doğal bir yük dağıtımı sağlar.
- Cihaz 5 dakika içinde sonuç bildirmezse kilit düşer ve mesaj başka bir cihaza yeniden dağıtılır.
- Hatalı gönderimler artan bekleme süresiyle (deneme × 60 sn) en fazla 5 kez denenir. Geçersiz numara gibi kalıcı hatalar hemen `failed` olur.
- Gelen SMS'ler `sms_inbound` tablosuna yazılır.
- Sağlayıcı seçimi veritabanında şifreli olarak saklanır (`platform_settings`, AES-256-GCM). Sunucu yeniden başlasa da kaybolmaz.

## Kurulum (yönetici)

1. **Admin › SMS** sayfasında "Upstream Sağlayıcı" alanından **Kendi Gateway'imiz**'i seçip kaydedin.
   Alternatif: `.env` içinde `SMS_PROVIDER=makethemenu` ve `MTM_SMS_UPSTREAM=gateway`.
2. **SMS Gateway Cihazları** bölümünde bir cihaz ekleyin (ad, tür, günlük limit). Ekranda **6 haneli eşleştirme kodu** görünür; kod 15 dakika geçerlidir.
3. Cihazda bridge'i bu kodla başlatın (aşağıya bakın). Cihaz panelde "Çevrimiçi" olarak görünür; pil, sinyal ve operatör bilgisi de gelir.
4. "Test SMS" butonu, mesajı kuyruğa alır; çevrimiçi bir cihaz mesajı alıp gönderir.

## Bridge (cihaz tarafı)

Dosyalar `deploy/sms-gateway/` klasöründedir: `mtm-sms-bridge.mjs`, `pdu.mjs`, `package.json`. Node.js 18 veya üstü gerekir.

### A) USB GSM modem (SIM800/SIM7600, Huawei E3372 seri modu, Quectel vb.)

```bash
cd deploy/sms-gateway
npm install            # serialport
node mtm-sms-bridge.mjs --url https://www.makethemenu.com --pair 123456 --driver modem --port /dev/ttyUSB0
# Windows: --port COM3   |   SIM PIN varsa: --pin 1234
```

- Gönderim AT komutlarıyla **PDU modunda** yapılır. Türkçe karakterli mesajlar UCS2 ile gider. Uzun mesajlar otomatik olarak çok parçalı (concatenated) gönderilir.
- Gelen SMS'ler 15 saniyede bir SIM'den okunur, sunucuya iletilir ve SIM'den silinir. Çok parçalı gelen mesajlar birleştirilir.
- Sürekli çalışması için systemd, PM2 veya Windows Görev Zamanlayıcı kullanabilirsiniz.

### B) Android telefon (Termux)

1. F-Droid'den **Termux** ve **Termux:API** uygulamalarını kurun. Termux:API'ye SMS ve Telefon izni verin.
2. Termux içinde:
   ```bash
   pkg install nodejs termux-api
   node mtm-sms-bridge.mjs --url https://www.makethemenu.com --pair 123456 --driver termux
   ```
3. Pil optimizasyonunu Termux için kapatın ve `termux-wake-lock` çalıştırın; aksi halde Android arka planda uygulamayı uyutabilir.

### C) Test (gerçek SMS göndermez)

```bash
node mtm-sms-bridge.mjs --url http://127.0.0.1:3000 --pair 123456 --driver simulate --once
```

Eşleştirmeden sonra cihaz jetonu `~/.mtm-sms-bridge.json` dosyasına (izin 600) kaydedilir. Sonraki çalıştırmalarda `--pair` gerekmez.
Cihaz panelden iptal edilirse bridge durur ve yeniden eşleştirme ister.

## Cihaz API sözleşmesi

Kimlik doğrulama `X-Device-Token: mtmgw_…` başlığıyla yapılır. Eşleştirme dışındaki tüm uçlar bu başlığı ister.

| Uç | Gövde | Yanıt |
|---|---|---|
| `POST /api/sms-gateway/pair` | `{pairingCode, simNumber?, operator?, appVersion?, battery?, signal?}` | `{deviceToken, deviceId, dailyLimit, perMinuteLimit, pollIntervalMs}` |
| `POST /api/sms-gateway/heartbeat` | `{battery?, signal?, operator?, simNumber?, appVersion?}` | `{ok, enabled, usage}` |
| `POST /api/sms-gateway/jobs/claim` | `{max?: 1-50}` | `{jobs:[{id,to,text,attempt}], pollAfterMs}` |
| `POST /api/sms-gateway/jobs/:id/result` | `{status: sent\|delivered\|failed, error?, permanent?}` | `{ok}` |
| `POST /api/sms-gateway/inbound` | `{from, text, externalId?}` | `{id}` |

Admin uçları (platform yöneticisi):

- `GET /api/admin/sms/gateway`
- `POST /api/admin/sms/gateway/devices`
- `PATCH /api/admin/sms/gateway/devices/:id` (ad, etkin/durdur, limitler)
- `POST /api/admin/sms/gateway/devices/:id/pairing-code`
- `DELETE /api/admin/sms/gateway/devices/:id`

Kendi Android uygulamanızı (Kotlin) yazarsanız aynı sözleşmeyi kullanmanız yeterlidir.

## Önemli kısıtlar (dürüstlük notu)

- **Fiziksel cihaz gerekir.** Gateway motoru sunucuda hazırdır, ancak SMS'i operatöre fiilen SIM kartı iletir. Cihaz yoksa mesajlar kuyrukta bekler; "gönderildi" denmez.
- **Gönderici adı** SIM numarasıdır. "MAKETHEMENU" gibi alfanümerik başlık yalnızca operatörden lisanslı toplu SMS hizmetiyle mümkündür.
- **Operatör limitleri:** Bireysel ve kurumsal hat paketlerinin günlük SMS limitleri ve adil kullanım kuralları vardır. Kişisel hattan toplu gönderim hattın kapatılmasına yol açabilir. Cihaz başına günlük ve dakikalık limitleri buna göre ayarlayın. Hacim arttıkça cihaz/SIM sayısını artırın.
- **Mevzuat:** Ticari ileti (kampanya/pazarlama) gönderimi için İYS kaydı ve alıcı onayı zorunludur (6563 sayılı Kanun). Bilgilendirme amaçlı mesajlar (OTP, sipariş durumu) bu kapsamda değildir, ancak BTK ve operatör kuralları yine geçerlidir.
- **İletim raporu:** Modem sürücüsü şu an "gönderildi" (operatör kabul etti) bilgisini bildirir. `delivered` (teslim raporu) API'de desteklenir, fakat bridge tarafında henüz üretilmez.
