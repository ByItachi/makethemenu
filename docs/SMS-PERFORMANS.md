# SMS Kuyruğu — Yük Testi Sonuçları

Bu ölçümler, gerçek yük test script'i (`.tmp/load-test-sms.mjs`, gitignore'da —
`demo@makethemenu.com` ile giriş yapıp `/api/ops/sms/bulk` üzerinden 500'lük
gruplar halinde gönderip `/api/ops/sms/status` ile kuyruğu izler) ile yerel
geliştirme ortamında (mock SMS sağlayıcısı, `MTM_SMS_UPSTREAM=mock`) çalıştırılmıştır.

İşleyici yapılandırması: `server/jobs.ts` + `server/sms/outbox.ts` — her 5 saniyede
bir tur, turda en fazla 200 mesaj, 10 eş zamanlı (parallel) gönderim.

## Ölçüm Sonuçları

| Mesaj Sayısı | Enqueue Süresi | Enqueue Hızı | Toplam Drenaj Süresi | Hata |
|---|---|---|---|---|
| 1.000 | ~1 sn | ~1000 msg/s | ~28 sn | 0 |
| 5.000 | ~5 sn | ~1000 msg/s | ~125 sn (~2 dk) | 0 |
| 10.000 | 9,86 sn | 1013,8 msg/s | **251,9 sn (~4 dk 12 sn)** | 0 |

Üçünde de hata oranı **0** — kuyruk, 10.000 mesaja kadar kayıpsız ve istikrarlı
şekilde işliyor.

## Yorumlama

- Enqueue (kuyruğa yazma) hızı mesaj sayısından bağımsız olarak sabit (~1000 msg/s)
  — veritabanı toplu insert'i darboğaz değil.
- İşleme (drenaj) hızı ortalama **~40 msg/sn** ile lineer şekilde ölçekleniyor
  (10.000 / 251,9 ≈ 39,7 msg/sn) — kuyruk tur başına sabit limitli olduğu için
  beklenen davranış.
- Gerçek sağlayıcıya bağlandığında (İletiMerkezi/NetGSM/Twilio) bu hız sağlayıcının
  API yanıt süresine ve varsa hız sınırına (rate limit) bağlı olarak değişebilir;
  yukarıdaki sayılar yalnızca uygulamanın kendi kuyruk/worker performansını yansıtır.
- Daha yüksek verim gerekirse `server/jobs.ts` içindeki tur limiti (200) ve
  `server/sms/outbox.ts` içindeki eş zamanlılık (10) parametreleri artırılabilir;
  ancak bu, gerçek sağlayıcının rate limit'ine takılma riskini de artırır.

## Test Tarihi

27 Ekim 2026, yerel Windows geliştirme ortamı, Node.js + tsx, MySQL veritabanı.
