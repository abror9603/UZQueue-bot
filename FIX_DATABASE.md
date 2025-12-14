# Database Xatolikni Tuzatish

## Muammo
Sequelize model `telegramId` (camelCase) ishlatmoqda, lekin database `telegram_id` (snake_case) ishlatadi.

## Yechim

### Variant 1: Migrationlar hali ishga tushirilmagan
Agar migrationlar hali ishga tushirilmagan bo'lsa:
```bash
npm run migrate
```

### Variant 2: Eski migration allaqachon ishlatilgan

Agar eski migration allaqachon ishlatilgan bo'lsa, database strukturasini yangilash kerak:

**PostgreSQL da bajarish:**

```sql
-- 1. Eski jadvalni o'chirish (ehtiyot bo'ling - barcha ma'lumotlar o'chib ketadi!)
DROP TABLE IF EXISTS users CASCADE;

-- 2. Keyin migrationni qayta ishga tushiring
-- npm run migrate
```

**Yoki migrationni qayta ishga tushirish:**

```bash
# Migrationlarni rollback qilish (agar SequelizeMeta jadvalida saqlangan bo'lsa)
npx sequelize-cli db:migrate:undo

# Keyin qayta ishga tushirish
npm run migrate
```

### Variant 3: Manual tuzatish (ma'lumotlarni saqlab qolish)

Agar ma'lumotlarni saqlab qolish kerak bo'lsa:

```sql
-- 1. Ma'lumotlarni backup qilish
CREATE TABLE users_backup AS SELECT * FROM users;

-- 2. Jadval strukturasini o'zgartirish (agar kerak bo'lsa)
-- Migration allaqachon to'g'ri yaratilgan deb faraz qilamiz

-- 3. Agar xatolik bo'lsa, ma'lumotlarni qayta tiklash
-- INSERT INTO users SELECT * FROM users_backup;
```

## Tekshirish

Migrationdan keyin tekshiring:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
```

Kutilayotgan ustunlar:
- `id` (bigint)
- `telegram_id` (bigint)
- `username` (varchar)
- `first_name` (varchar)
- `last_name` (varchar)
- `language` (varchar)
- `phone` (varchar)
- `is_active` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

