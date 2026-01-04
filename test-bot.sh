#!/bin/bash

# UZQueue Bot Test Script
# Bu skript botni tekshirish uchun yordam beradi

echo "🧪 UZQueue Bot Test Skripti"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env fayli topilmadi!${NC}"
    echo "Iltimos, .env faylini yarating va sozlang."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules topilmadi. Dependencies o'rnatilmoqda...${NC}"
    npm install
fi

# Check PostgreSQL connection
echo -e "${BLUE}📊 Database tekshiruvi...${NC}"
if command -v psql &> /dev/null; then
    DB_NAME=$(grep DB_NAME .env | cut -d '=' -f2)
    if [ -z "$DB_NAME" ]; then
        DB_NAME="uzqueue_bot"
    fi
    
    if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        echo -e "${GREEN}✅ Database mavjud: $DB_NAME${NC}"
    else
        echo -e "${YELLOW}⚠️  Database topilmadi: $DB_NAME${NC}"
        echo "Database yaratish kerak bo'lishi mumkin."
    fi
else
    echo -e "${YELLOW}⚠️  psql topilmadi. Database tekshiruvi o'tkazilmadi.${NC}"
fi

# Check Redis connection
echo -e "${BLUE}📊 Redis tekshiruvi...${NC}"
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✅ Redis ishlayapti${NC}"
    else
        echo -e "${RED}❌ Redis ishlamayapti${NC}"
        echo "Redis ni ishga tushiring: redis-server"
    fi
else
    echo -e "${YELLOW}⚠️  redis-cli topilmadi. Redis tekshiruvi o'tkazilmadi.${NC}"
fi

# Check if bot token is set
echo -e "${BLUE}📊 Bot token tekshiruvi...${NC}"
if grep -q "TELEGRAM_BOT_TOKEN=" .env && ! grep -q "TELEGRAM_BOT_TOKEN=your_bot_token" .env; then
    echo -e "${GREEN}✅ Bot token sozlangan${NC}"
else
    echo -e "${RED}❌ Bot token sozlanmagan!${NC}"
    echo "Iltimos, .env faylida TELEGRAM_BOT_TOKEN ni sozlang."
fi

echo ""
echo -e "${GREEN}✅ Asosiy tekshiruvlar yakunlandi!${NC}"
echo ""
echo "Botni ishga tushirish uchun:"
echo "  npm start        # Production"
echo "  npm run dev      # Development (auto-reload)"
echo ""
echo "Test qo'llanmasi uchun: TESTING_GUIDE.md faylini ko'ring"









