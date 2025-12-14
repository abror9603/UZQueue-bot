# 🎯 UZQueue Citizen Appeals Bot - Yangi Loyiha

## ✅ Qilingan Ishlar

### 1. ✅ To'liq yangi struktura yaratildi
- Eski kodlar `src_old_backup` ga ko'chirildi
- Yangi toza struktura yaratildi
- Modular arxitektura

### 2. ✅ Database Modellar
- ✅ `users` - Foydalanuvchilar
- ✅ `regions` - Viloyatlar
- ✅ `districts` - Tumanlar  
- ✅ `neighborhoods` - Mahallalar
- ✅ `organizations` - Tashkilotlar
- ✅ `telegram_groups` - Telegram guruhlar mapping
- ✅ `appeals` - Murojaatlar
- ✅ `appeal_files` - Fayllar
- ✅ `appeal_status_logs` - Holat o'zgarishlari
- ✅ `ai_logs` - AI foydalanish loglari

### 3. ✅ Ko'p Tilli Qo'llab-Quvvatlash
- ✅ O'zbek (uz.json)
- ✅ Rus (ru.json)
- ✅ Ingliz (en.json)
- ✅ i18next integratsiyasi

### 4. ✅ AI Integratsiyasi
- ✅ OpenAI GPT-4o-mini integratsiyasi
- ✅ AI maslahat berish (tashkilot tanlash)
- ✅ AI murojaat tahlili
- ✅ AI holat javoblari
- ✅ AI loglari

### 5. ✅ Bot Funksiyalari
- ✅ `/start` - Til tanlash va boshlash
- ✅ Yangi murojaat yaratish (step-by-step)
  - Viloyat tanlash
  - Tuman tanlash
  - Mahalla tanlash (ixtiyoriy)
  - Tashkilot tanlash
  - Ism, telefon, murojaat matni kiritish
  - Fayl yuklash (ixtiyoriy)
  - Tasdiqlash
- ✅ Murojaat holatini kuzatish (`/status`)
- ✅ Admin buyruqlari (`/admin_status`)
- ✅ Til o'zgartirish
- ✅ Yordam

### 6. ✅ Murojaat Yo'naltirish Logikasi
- ✅ Viloyat + Tuman + Mahalla + Tashkilot → Telegram guruh
- ✅ Aniq mapping (neighborhood → district → region fallback)
- ✅ Murojaat faqat mos guruhga yuboriladi
- ✅ Xatoliklar yo'q qilingan

### 7. ✅ Holat Boshqaruvi
- ✅ `pending` (jarayonda) - default
- ✅ `completed` (bajarildi)
- ✅ `rejected` (rad etildi)
- ✅ Admin buyruqlari orqali holat o'zgarishi
- ✅ Fuqaroga avtomatik xabar yuborish
- ✅ Holat loglari

### 8. ✅ Services
- ✅ `userService` - Foydalanuvchi boshqaruvi
- ✅ `locationService` - Hududlar boshqaruvi
- ✅ `organizationService` - Tashkilotlar boshqaruvi
- ✅ `telegramGroupService` - Guruh routing
- ✅ `appealService` - Murojaat boshqaruvi
- ✅ `aiService` - AI xizmatlari
- ✅ `stateService` - Redis state management

### 9. ✅ Handlers
- ✅ `commandHandlers` - Bot buyruqlari
- ✅ `callbackHandlers` - Inline keyboard
- ✅ `messageHandlers` - Xabarlar
- ✅ `appealHandlers` - Murojaat jarayoni

### 10. ✅ Database Migrations
- ✅ Barcha jadvallar uchun migrationlar
- ✅ Foreign keys va relationships
- ✅ Indexlar

## 📁 Struktura

```
src/
├── config/
│   ├── database.js      # PostgreSQL connection
│   ├── i18n.js          # i18next config
│   └── redis.js         # Redis connection
├── handlers/
│   ├── appealHandlers.js    # Murojaat jarayoni
│   ├── callbackHandlers.js  # Callback queries
│   ├── commandHandlers.js   # Bot buyruqlari
│   └── messageHandlers.js   # Message handling
├── models/
│   ├── User.js
│   ├── Region.js
│   ├── District.js
│   ├── Neighborhood.js
│   ├── Organization.js
│   ├── TelegramGroup.js
│   ├── Appeal.js
│   ├── AppealFile.js
│   ├── AppealStatusLog.js
│   ├── AiLog.js
│   └── index.js         # Model relationships
├── services/
│   ├── userService.js
│   ├── locationService.js
│   ├── organizationService.js
│   ├── telegramGroupService.js
│   ├── appealService.js
│   ├── aiService.js
│   └── stateService.js
├── utils/
│   └── keyboard.js      # Keyboard layouts
├── locales/
│   ├── uz.json          # O'zbekcha tarjimalar
│   ├── ru.json          # Ruscha tarjimalar
│   └── en.json          # Inglizcha tarjimalar
├── migrations/
│   ├── 001-create-users.js
│   ├── 002-create-regions.js
│   ├── 003-create-districts.js
│   ├── 004-create-neighborhoods.js
│   ├── 005-create-organizations.js
│   ├── 006-create-telegram-groups.js
│   ├── 007-create-appeals.js
│   ├── 008-create-appeal-files.js
│   ├── 009-create-appeal-status-logs.js
│   └── 010-create-ai-logs.js
└── index.js             # Main entry point
```

## 🚀 Keyingi Qadamlar

### 1. Database Seeding
Viloyatlar, tumanlar, tashkilotlar ma'lumotlarini qo'shish kerak.

### 2. Telegram Groups Setup
Har bir hudud/tashkilot uchun Telegram guruhlar yaratish va bazaga qo'shish.

### 3. Testing
- Unit testlar
- Integration testlar
- End-to-end testlar

### 4. Error Handling
Xatoliklarni yanada yaxshilash.

### 5. Logging
Winston yoki boshqa logging library qo'shish.

## 📌 Muhim Eslatmalar

1. **Telegram Groups Mapping:**
   - Har bir guruh `telegram_groups` jadvaliga qo'shilishi kerak
   - `admin_ids` maydoni adminlarning Telegram ID larini saqlaydi
   - Bot guruhda admin bo'lishi kerak

2. **AI Integration:**
   - OpenAI API key talab qilinadi
   - Har bir AI so'rov `ai_logs` ga yoziladi
   - Tokenlar hisoblanadi

3. **State Management:**
   - Redis ishlatiladi
   - User state 1 soat TTL bilan saqlanadi

4. **Security:**
   - Admin tekshiruvi guruh admin_ids orqali
   - Rate limiting (kelajakda qo'shiladi)
   - Input validation

## 🎯 Asosiy Xususiyatlar

✅ **Toza kod** - Modular, o'qilishi oson
✅ **Kengaytiriladigan** - Yangi funksiyalar qo'shish oson
✅ **Ko'p tilli** - 3 til qo'llab-quvvatlanadi
✅ **AI-asosli** - OpenAI integratsiyasi
✅ **Aniq routing** - Murojaatlar faqat mos guruhga
✅ **Holat kuzatish** - Real-time holat o'zgarishlari
✅ **Admin boshqaruvi** - Guruh adminlari holatni o'zgartira oladi

## 📝 Botni Ishga Tushirish

```bash
# 1. Dependencies o'rnatish
npm install

# 2. Environment variables sozlash
cp .env.example .env
# .env faylini to'ldiring

# 3. Database migrationlar
npm run migrate

# 4. Botni ishga tushirish
npm start
```

## 🔗 Foydali Linklar

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Batafsil deployment guide
- [README.md](./src/README.md) - Bot README

