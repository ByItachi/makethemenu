@echo off
echo Restaurant POS Sistemi Baslatiliyor...
echo.

REM Node.js kontrolü
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo HATA: Node.js bulunamadi!
    echo Lutfen Node.js kurun: https://nodejs.org/
    pause
    exit /b 1
)

REM Port kontrolü
netstat -an | findstr ":3000" >nul
if %errorlevel% equ 0 (
    echo UYARI: 3000 portu zaten kullaniliyor!
    echo Lutfen mevcut uygulamayi kapatip tekrar deneyin.
    pause
    exit /b 1
)

echo Database kontrol ediliyor...
set DATABASE_URL=postgres://user:pass@127.0.0.1:5432/db

echo Sunucu baslatiliyor...
cd /d "%~dp0"

if exist "dist\index.cjs" (
    echo Production build bulundu. Production modda calistiriliyor...
    set NODE_ENV=production
    node dist/index.cjs
) else (
    echo Production build bulunamadi. Development modda calistiriliyor...
    set NODE_ENV=development
    npx tsx server/index.ts
)

if %errorlevel% neq 0 (
    echo.
    echo HATA: Sunucu baslatilamadi!
    echo Lutfen hata mesajini kontrol edin.
    pause
)