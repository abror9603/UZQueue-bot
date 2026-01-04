@echo off
REM UZQueue Bot Test Script (Windows)
REM Bu skript botni tekshirish uchun yordam beradi

echo.
echo ========================================
echo   UZQueue Bot Test Skripti (Windows)
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo [ERROR] .env fayli topilmadi!
    echo Iltimos, .env faylini yarating va sozlang.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist node_modules (
    echo [WARNING] node_modules topilmadi. Dependencies o'rnatilmoqda...
    call npm install
)

echo [INFO] Asosiy tekshiruvlar yakunlandi!
echo.
echo Botni ishga tushirish uchun:
echo   npm start        # Production
echo   npm run dev      # Development (auto-reload)
echo.
echo Test qo'llanmasi uchun: TESTING_GUIDE.md faylini ko'ring
echo.
pause









