# 💎 Premium To'lov Tizimi - Texnik Hujjat

## 📋 Umumiy Ma'lumot

Bu hujjat Premium tarif to'lov tizimining texnik tavsifini o'z ichiga oladi. Tizim Telegram Wallet (TON) va Payme orqali to'lovlarni qo'llab-quvvatlaydi.

## 🏗️ Arxitektura

### Database Strukturasi

#### 1. Users Jadvali (Yangilangan)
```sql
ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN premium_expires_at TIMESTAMP;
```

#### 2. Payments Jadvali (Yangi)
```sql
CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_method VARCHAR(50) NOT NULL, -- 'telegram_wallet' yoki 'payme'
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'TON',
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'success', 'failed', 'cancelled'
  transaction_id VARCHAR(255) UNIQUE,
  comment VARCHAR(255),
  premium_days INTEGER DEFAULT 30,
  telegram_invoice_payload VARCHAR(255),
  telegram_pre_checkout_query_id VARCHAR(255),
  payme_transaction_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔄 To'lov Oqimi (Flow)

### 1. Premium Menyu
```
Foydalanuvchi → "💎 Premium" tugmasi → Premium menyu ko'rsatiladi
```

### 2. To'lov Usulini Tanlash
```
Premium menyu → To'lov usullari:
  - 💳 Telegram Wallet (TON) ✅ Faol
  - 💵 Payme ⏳ Tez kunda
```

### 3. Telegram Wallet To'lovi
```
To'lov usuli tanlandi → Invoice yaratiladi → 
Pre-checkout query → To'lov tasdiqlash → 
Successful payment → Premium faollashtiriladi
```

### 4. Payme To'lovi (Kelajakda)
```
To'lov usuli tanlandi → "Tez kunda" xabari ko'rsatiladi
```

## 📁 Fayl Strukturasi

```
src/
├── migrations/
│   ├── 015-add-premium-to-users.js
│   └── 016-create-payments.js
├── models/
│   ├── Payment.js (yangi)
│   └── User.js (yangilangan)
├── services/
│   ├── premiumService.js (yangi)
│   └── paymentService.js (yangi)
├── handlers/
│   ├── premiumHandlers.js (yangi)
│   └── callbackHandlers.js (yangilangan)
├── utils/
│   └── keyboard.js (yangilangan)
└── locales/
    ├── uz.json (yangilangan)
    ├── ru.json (yangilangan)
    └── en.json (yangilangan)
```

## 🔧 Asosiy Funksiyalar

### PremiumService

#### `isPremium(userId)`
Foydalanuvchining Premium obunasining faol yoki faol emasligini tekshiradi.

#### `activatePremium(userId, days, paymentId)`
Foydalanuvchiga Premium obunasini faollashtiradi yoki muddatini uzaytiradi.

#### `getPremiumInfo(userId)`
Foydalanuvchining Premium holati haqida to'liq ma'lumot qaytaradi.

### PaymentService

#### `createPayment(userId, paymentMethod, amount, premiumDays)`
Yangi to'lov yozuvini yaratadi.

#### `processSuccessfulPayment(paymentId, transactionId)`
Muvaffaqiyatli to'lovni qayta ishlaydi va Premiumni faollashtiradi.

#### `generateInvoicePayload(paymentId)`
Telegram invoice uchun unique payload yaratadi.

## 🔐 Xavfsizlik

### 1. To'lov Tasdiqlash
- Har bir to'lov uchun unique `payload` yaratiladi
- `pre_checkout_query` da to'lov tekshiriladi
- Foydalanuvchi va to'lov o'rtasidagi bog'liqlik tekshiriladi

### 2. Transaction ID
- Har bir muvaffaqiyatli to'lov uchun `transaction_id` saqlanadi
- Takroriy to'lovlarni oldini olish uchun unique constraint

### 3. Premium Muddati
- Premium muddati avtomatik tekshiriladi
- Muddat tugagach, Premium avtomatik o'chiriladi

## 📱 UI/UX

### Asosiy Menyu
```
📝 Yangi murojaat
📊 Murojaat holati
💎 Premium | 🌐 Til
ℹ️ Yordam
```

### Premium Menyu
```
💎 Premium Tarif

Premium tarif bilan quyidagi imtiyozlarga ega bo'lasiz:

✨ Cheksiz murojaatlar
✨ Birinchi navbatda javob
✨ AI yordamchisi
✨ Batafsil statistikalar

💳 To'lov usulini tanlang:

[💳 Telegram Wallet (TON)]
[💵 Payme] [⏳ Tez kunda]
[◀️ Orqaga]
```

### Premium Holati
```
📊 Premium Holati

✅ Premium faol
📅 Premium muddati: 2025-02-15
⏰ Qolgan kunlar: 25

[✅ Premium faol]
[◀️ Orqaga]
```

## ⚙️ Sozlash

### Environment Variables

`.env` fayliga quyidagilarni qo'shing:

```env
# Telegram Payment Provider Token (TON uchun)
TELEGRAM_PAYMENT_PROVIDER_TOKEN=your_provider_token_here

# Payme API (kelajakda)
PAYME_MERCHANT_ID=your_merchant_id
PAYME_SECRET_KEY=your_secret_key
```

### Migrationlarni Ishga Tushirish

```bash
npm run migrate
```

Bu quyidagi migrationlarni ishga tushiradi:
- `015-add-premium-to-users.js` - Users jadvaliga premium maydonlarini qo'shadi
- `016-create-payments.js` - Payments jadvalini yaratadi

## 🧪 Test Qilish

### 1. Premium Menyuni Ko'rish
```
/start → 💎 Premium tugmasi
```

### 2. To'lov Usulini Tanlash
```
Premium menyu → 💳 Telegram Wallet
```

### 3. Invoice Yaratish
```
Telegram Wallet tanlandi → Invoice ko'rsatiladi
```

### 4. To'lovni Tasdiqlash
```
Pre-checkout query → ✅ Tasdiqlash → Successful payment
```

## 📝 Payme Integratsiyasi (Kelajakda)

Payme integratsiyasi uchun quyidagi qadamlar kerak:

1. **Payme API Sozlash**
   - Merchant ID olish
   - Secret key olish
   - Webhook URL sozlash

2. **PaymentService Yangilash**
   - `createPaymePayment()` funksiyasi
   - `verifyPaymePayment()` funksiyasi
   - Webhook handler

3. **PremiumHandlers Yangilash**
   - Payme to'lov oqimini qo'shish
   - Webhook endpoint yaratish

## 🔄 Premium Muddatini Avtomatik Tekshirish

Premium muddati avtomatik tekshiriladi:

1. `premiumService.isPremium()` chaqirilganda
2. Cron job orqali (kelajakda)

## 📊 To'lov Statistikasi

To'lovlar `payments` jadvalida saqlanadi va quyidagi ma'lumotlarni o'z ichiga oladi:
- To'lov usuli
- Summa va valyuta
- Holat (pending, success, failed, cancelled)
- Transaction ID
- Premium kunlar soni
- Metadata (qo'shimcha ma'lumotlar)

## 🐛 Xatolarni Boshqarish

### To'lov Topilmadi
```
❌ To'lov topilmadi
```

### To'lov Allaqachon Qayta Ishlangan
```
❌ To'lov allaqachon qayta ishlangan
```

### To'lov Muvaffaqiyatsiz
```
❌ To'lov amalga oshirilmadi.
Sabab: [sabab]
```

## 📞 Yordam

Muammo bo'lsa, administrator bilan bog'laning yoki GitHub Issues bo'limiga xabar bering.

