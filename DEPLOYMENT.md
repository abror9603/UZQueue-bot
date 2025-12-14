# UZQueue Bot - Deployment Guide

## 🚀 O'rnatish va Ishga Tushirish

### 1. Dependencies O'rnatish

```bash
npm install
```

Bu quyidagi paketlarni o'rnatadi:
- `node-telegram-bot-api` - Telegram Bot API
- `sequelize` - ORM
- `pg` - PostgreSQL driver
- `redis` - Redis client
- `openai` - OpenAI API
- `i18next` - Ko'p tilli qo'llab-quvvatlash
- va boshqalar...

### 2. Environment Variables

`.env` faylini yarating:

```bash
cp .env.example .env
```

Keyin `.env` faylini to'ldiring:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
OPENAI_API_KEY=your_openai_api_key
DB_HOST=localhost
DB_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=uzqueue_bot
REDIS_HOST=localhost
REDIS_PORT=6379
OPENAI_MODEL=gpt-4o-mini
NODE_ENV=development
```

### 3. Database Setup

PostgreSQL va Redis ishga tushirilgan bo'lishi kerak.

Database migrationlarni ishga tushiring:

```bash
npm run migrate
```

Bu quyidagi jadvallarni yaratadi:
- users
- regions
- districts
- neighborhoods
- organizations
- telegram_groups
- appeals
- appeal_files
- appeal_status_logs
- ai_logs

### 4. Dastlabki Ma'lumotlar (Seeds)

Dastlabki ma'lumotlarni qo'shish uchun seed fayllar yarating (ixtiyoriy):

- Viloyatlar ro'yxati
- Tumanlar ro'yxati
- Tashkilotlar ro'yxati

### 5. Botni Ishga Tushirish

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## 📊 Telegram Groups Setup

Botni ishlatish uchun quyidagilarni qilish kerak:

1. **Telegram guruhlar yaratish:**
   - Har bir hudud va tashkilot uchun alohida guruh
   - Botni guruhga admin sifatida qo'shish

2. **Guruh ma'lumotlarini bazaga qo'shish:**

```sql
INSERT INTO telegram_groups (
  region_id, district_id, neighborhood_id, organization_id, 
  chat_id, chat_title, admin_ids, is_active
) VALUES (
  1,  -- region_id (Andijon)
  1,  -- district_id (Asaka)
  NULL, -- neighborhood_id (ixtiyoriy)
  1,  -- organization_id (Hokimiyat)
  -1001234567890, -- chat_id (Guruh ID)
  'Andijon Asaka Hokimiyat', -- chat_title
  ARRAY[123456789], -- admin_ids (Telegram user IDs)
  true
);
```

## 🔧 Config

Sequelize migration config: `config/config.js`

## 📝 Test Qilish

1. Botga `/start` buyrug'ini yuboring
2. Tilni tanlang
3. "Yangi murojaat" tugmasini bosing
4. Viloyat → Tuman → Mahalla → Tashkilot tanlang
5. Ma'lumotlarni kiriting
6. Murojaatni tasdiqlang
7. Murojaat guruhga yuboriladi

## ⚠️ Eslatmalar

- Bot guruhda admin bo'lishi kerak
- `admin_ids` maydoni adminlarning Telegram ID larini saqlaydi
- Murojaatlar faqat tanlangan hudud/tashkilot guruhiga yuboriladi
- AI xizmati uchun OpenAI API key talab qilinadi

## 🐛 Xatoliklarni Tuzatish

- Database connection xatosi: PostgreSQL ishga tushirilganligini tekshiring
- Redis connection xatosi: Redis server ishga tushirilganligini tekshiring
- Bot ishlamayapti: Telegram token to'g'riligini tekshiring
- AI javob bermayapti: OpenAI API key va limitlarni tekshiring

