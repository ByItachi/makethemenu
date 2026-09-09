# Restaurant POS Sistemi - EXE Versiyonu

## Kurulum

1. **Node.js Kurulumu**
   - Node.js 18+ sürümünü indirin ve kurun: https://nodejs.org/

2. **PostgreSQL Kurulumu**
   - PostgreSQL veritabanını kurun: https://www.postgresql.org/download/
   - Varsayılan ayarlarla kurulum yapın

3. **Dosyaların Kurulumu**
   - Tüm dosyaları bir klasöre çıkarın
   - `start-restaurant.bat` dosyasını çalıştırın

## Kullanım

### Başlangıç
1. `start-restaurant.bat` dosyasını çift tıklayın
2. Tarayıcınızda `http://localhost:3000` adresini açın

### Varsayılan Kullanıcılar
- **Admin**: 
  - Kullanıcı adı: `admin`
  - Şifre: `admin123`
  - E-posta: `admin@restoran.com`

- **Müdür**:
  - Kullanıcı adı: `mudur`
  - Şifre: `mudur123`
  - E-posta: `mudur@restoran.com`

- **Garson**:
  - Kullanıcı adı: `garson1`
  - Şifre: `garson123`
  - E-posta: `garson1@restoran.com`

### Özellikler
- Masa yönetimi
- Ürün ve kategori yönetimi
- Sipariş takibi
- Raporlama
- Kullanıcı ve yetki yönetimi
- Stok takibi
- Gelir-gider yönetimi

## Port ve Database Ayarları

Varsayılan ayarlar:
- Port: 3000
- Database: PostgreSQL (localhost:5432)
- Database adı: db
- Kullanıcı: user
- Şifre: pass

Database ayarlarını değiştirmek için:
1. `start-restaurant.bat` dosyasını düzenleyin
2. `DATABASE_URL` satırını güncelleyin

## Sorun Giderme

### Port 3000 Kullanımda
- Başka bir uygulama 3000 portunu kullanıyorsa kapatın
- Ya da `start-restaurant.bat` dosyasında port numarasını değiştirin

### Database Bağlantı Hatası
- PostgreSQL servisinin çalıştığından emin olun
- Database kullanıcı adı ve şifresini kontrol edin
- Database'in oluşturulduğundan emin olun

### Node.js Bulunamadı Hatası
- Node.js'nin kurulu olduğundan emin olun
- PATH ortam değişkeninin doğru ayarlandığından emin olun

## Destek

Herhangi bir sorun yaşarsanız:
1. Hata mesajlarını not alın
2. PostgreSQL ve Node.js loglarını kontrol edin
3. Sistem yöneticinizle iletişime geçin