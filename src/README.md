# UZQueue Citizen Appeals Bot

Fuqaro murojaatlarini qabul qiluvchi va Telegram guruhlarga yo'naltiradigan AI-asosli ko'p tilli Telegram bot.

## 🚀 Xususiyatlar

- ✅ Ko'p tilli qo'llab-quvvatlash (O'zbek, Rus, Ingliz)
- ✅ Viloyat/Tuman/Mahalla/Tashkilot bo'yicha murojaat yo'naltirish
- ✅ AI yordamida tashkilot tavsiyalari
- ✅ Telegram guruhlarga aniq yo'naltirish
- ✅ Murojaat holatini kuzatish
- ✅ Admin buyruqlari orqali holat boshqaruvi
- ✅ Fayl yuklash qo'llab-quvvatlash

## 📁 Struktura

```
src_new/
├── config/          # Database, Redis, i18n sozlashlari
├── handlers/        # Bot handlers (commands, messages, callbacks)
├── models/          # Sequelize modellar
├── services/        # Business logic servislar
├── utils/           # Yordamchi funksiyalar
├── locales/         # Tarjimalar (uz.json, ru.json, en.json)
├── migrations/      # Database migrationlar
└── index.js         # Asosiy fayl
```

## 🛠️ O'rnatish

1. **Dependencies o'rnatish:**
```bash
npm install
```

2. **Environment variables sozlash:**
```bash
cp .env.example .env
# .env faylini o'zgartiring
```

3. **Database migrationlar ishga tushirish:**
```bash
npm run migrate
```

4. **Botni ishga tushirish:**
```bash
npm start
# yoki development uchun:
npm run dev
```

## 📊 Database

Quyidagi jadvallar yaratiladi:
- `users` - Foydalanuvchilar
- `regions` - Viloyatlar
- `districts` - Tumanlar
- `neighborhoods` - Mahallalar
- `organizations` - Tashkilotlar
- `telegram_groups` - Telegram guruhlar mapping
- `appeals` - Murojaatlar
- `appeal_files` - Murojaat fayllari
- `appeal_status_logs` - Holat o'zgarishlari
- `ai_logs` - AI foydalanish loglari

## 🤖 Bot Buyruqlari

- `/start` - Botni boshlash va til tanlash
- `/status <appeal_id>` - Murojaat holatini ko'rish
- `/language` - Tilni o'zgartirish
- `/help` - Yordam
- `/admin_status <appeal_id> <status>` - Admin: holatni o'zgartirish

## 📝 Ishlash Jarayoni

1. Foydalanuvchi `/start` buyrug'ini yuboradi
2. Til tanlanadi
3. "Yangi murojaat" tugmasi bosiladi
4. Viloyat → Tuman → Mahalla → Tashkilot tanlanadi
5. Ma'lumotlar (ism, telefon, murojaat matni) kiritiladi
6. Murojaat tasdiqlanadi
7. Bot murojaatni mos Telegram guruhga yuboradi
8. Admin holatni o'zgartira oladi
9. Fuqaro holatni kuzatadi

## 🔐 Xavfsizlik

- Faqat ro'yxatdan o'tgan Telegram guruhlar adminlar holatni o'zgartira oladi
- Rate limiting (Redis orqali)
- Input validation

## 🌐 Til Qo'llab-Quvvatlash

Barcha matnlar `src_new/locales/` papkasida:
- `uz.json` - O'zbekcha
- `ru.json` - Ruscha
- `en.json` - Inglizcha

## 📌 Eslatma

- Telegram guruhlar `telegram_groups` jadvaliga qo'shilishi kerak
- Adminlar ro'yxati guruh `admin_ids` maydonida saqlanadi
- Murojaatlar faqat tanlangan hudud va tashkilot guruhiga yuboriladi

