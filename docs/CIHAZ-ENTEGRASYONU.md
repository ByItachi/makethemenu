# Cihaz Entegrasyonu — Yazar Kasa / Kiosk / Caller ID / Android Caller ID

Bu dört özellik fiziksel bir cihaz (ÖKC mali yazar kasa, tablet, çağrı santrali/USB
modem veya Android telefon) gerektirir. Cihaz henüz temin edilmemiş olsa da
**sunucu tarafı (eşleştirme, kimlik doğrulama, iş kuyruğu, veri sözleşmesi) tamamen
hazır ve gerçek bir test akışıyla doğrulanmıştır** (`server/ops-devices.ts`).

Cihaz geldiğinde yapılması gereken TEK şey: o cihaza özel küçük bir "bridge"
(yerel ajan/uygulama) yazıp aşağıdaki genel JSON API'sine bağlamak. Web sunucusunda
ek geliştirme gerekmez.

## 1) Eşleştirme akışı (tüm cihaz tipleri için ortak)

1. Restoran paneli → "Cihazlar" → **Cihaz Ekle** (tip: yazar-kasa/kiosk/caller-id/android-callerid)
   → sunucu 6 haneli, 10 dakika geçerli bir **eşleştirme kodu** üretir.
2. Cihaz/bridge, bu kodu kullanıcıdan alır ve:
   ```
   POST /api/device/pair
   { "pairingCode": "123456" }
   → { "deviceToken": "mtmdev_...", "deviceId": 1, "restaurantId": 97, "type": "yazar-kasa" }
   ```
3. Bridge bu `deviceToken`'ı kalıcı olarak saklar; tüm sonraki isteklerde
   `X-Device-Token: mtmdev_...` header'ı ile kimlik doğrular.
4. Opsiyonel canlılık sinyali: `POST /api/device/ping` (son görülme zamanını günceller).

## 2) Yazar Kasa (ÖKC) — fiş yazdırma kuyruğu

- Restoran paneli bir sipariş kapandığında `POST /api/ops/devices/fiscal/print`
  ile fiş bilgisini (kalemler, KDV, toplam) kuyruğa yazar.
- Bridge, cihaza bağlı yerel bilgisayarda/Raspberry Pi'de çalışır, periyodik olarak
  `GET /api/device/fiscal/jobs` ile bekleyen işleri çeker.
- Bridge, mali cihazın **kendi marka/modeline özel protokolünü** (çoğu ÖKC üreticisi
  USB/Seri port veya yerel TCP soket + XML/binary protokol kullanır — üreticiden
  üreticiye değişir) kullanarak fişi fiziksel olarak yazdırır.
- Sonucu bildirir: `POST /api/device/fiscal/jobs/:id/result` → `{ status: "printed", fiscalNo: "..." }`

Bu akış `curl` ile uçtan uca test edilmiştir: iş oluşturma → kuyruktan çekme →
sonuç bildirme → restoran panelinde görünme, hepsi gerçek veritabanı kayıtlarıyla
çalışıyor.

> Not: Türkiye'de ÖKC mali cihazları GİB onaylı olmalıdır; bridge yazılımı da
> genelde cihaz üreticisinin SDK/DLL'ini kullanır. Hangi marka/model ÖKC temin
> edileceği belirlenince (örn. Ingenico, Beko, Yazıcı vb.) o üreticinin SDK
> dokümantasyonuna göre bridge birkaç saatte yazılabilir — API sözleşmesi
> değişmeyecektir.

## 3) Kiosk — özel donanım GEREKMEZ

Kiosk modu, bir tablet/dokunmatik ekranın tarayıcısında **tam ekran self-servis
sipariş arayüzü** olarak çalışır. Herhangi bir Android tablet, iPad veya
dokunmatik ekranlı Windows PC yeterlidir — özel bir "kiosk cihazı" satın almaya
gerek yoktur. Cihaz eşleştirme, kiosk'u belirli bir restorana/şubeye bağlamak
içindir (örn. "Giriş Kiosku", "2. Kat Kiosku").

## 4) Caller ID / Android Caller ID — gelen çağrı eşleştirme

- Cihaz/bridge gelen çağrıyı algılayınca: `POST /api/device/caller-id/event`
  `{ "phone": "05551234567" }` gönderir.
- Sunucu, numarayı o restoranın **Cari Müşteri (CRM)** kayıtlarıyla anında eşleştirir
  ve eşleşme varsa müşteri adı/bakiye/puan bilgisini geri döner.
- Restoran paneli `GET /api/ops/devices/caller-events` ile son çağrıları çeker
  (anlık popup için kısa aralıklı yoklama/polling önerilir).

Bu akış da gerçek bir CRM kaydıyla uçtan uca test edilmiştir: gelen çağrı →
müşteri eşleşmesi → panelde görünme.

**Caller ID (masaüstü/santral):** Çoğu USB çağrı santrali veya telefon switch'i
"gelen arama" olayını seri port/TCP üzerinden yayınlar; bridge bunu dinleyip API'ye
iletir.

**Android Caller ID:** Android'de arka planda çalışan, `READ_PHONE_STATE` iznine
sahip küçük bir companion uygulama gelen aramayı yakalayıp aynı API'ye gönderir.
Bu companion uygulama ayrı bir geliştirme kalemidir (Android/Kotlin), cihaz temin
edilip bu yöne karar verilince yazılabilir.

## Özet Tablo

| Özellik | Sunucu altyapısı | Eksik olan |
|---|---|---|
| Eşleştirme (ortak) | ✅ Canlı, test edildi | — |
| Yazar Kasa iş kuyruğu | ✅ Canlı, test edildi | Cihaza özel bridge (marka belirlenince) |
| Kiosk | ✅ Eşleştirme hazır | Sadece tablet temini — ek kod gerekmez |
| Caller ID olay+CRM eşleşmesi | ✅ Canlı, test edildi | Santral/USB bridge |
| Android Caller ID | ✅ Aynı API | Android companion app (ayrı geliştirme) |
