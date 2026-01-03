# UZQueue Bot v2.0

Citizen-to-Government Communication Platform for Uzbekistan

## 🎯 Mission

Create a transparent bridge between citizens and government organizations, eliminating bureaucratic delays and ensuring accountability.

## 🚀 Phase 1 Goals

- Deploy in 1 region (Sirdaryo viloyat)
- Support 3-5 government organizations
- Handle 1000 test users
- Achieve 85%+ routing accuracy

## 🛠 Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5+
- **Framework**: Telegraf.js (latest)
- **Database**: MongoDB 7+ with Mongoose
- **Cache**: Redis (optional for Phase 1)
- **AI**: OpenAI API (GPT-4o-mini)
- **Validation**: Zod
- **Testing**: Jest + Supertest
- **Logging**: Winston

## 📋 Prerequisites

- Node.js 20+ installed
- MongoDB Atlas account (or local MongoDB)
- Telegram Bot Token from @BotFather
- OpenAI API key

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then edit `.env` file and fill in your values:

```env
# Required
BOT_TOKEN=your_telegram_bot_token          # From @BotFather
MONGO_URI=mongodb+srv://...                # MongoDB connection string
OPENAI_API_KEY=your_openai_api_key         # From OpenAI Platform
SUPER_ADMIN_IDS=123456789,987654321        # Your Telegram IDs

# Optional
NODE_ENV=development
LOG_LEVEL=info
```

**How to get values:**
- **BOT_TOKEN**: Message @BotFather on Telegram, create a bot, get token
- **MONGO_URI**: Create MongoDB Atlas account, create cluster, get connection string
- **CLAUDE_API_KEY**: Sign up at https://console.anthropic.com/, get API key
- **SUPER_ADMIN_IDS**: Message @userinfobot on Telegram to get your Telegram ID

### 3. Build TypeScript

```bash
npm run build
```

### 4. Run the Bot

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## 📁 Project Structure

```
src/
├── index.ts                 # Entry point
├── bot.ts                   # Bot initialization
├── config/
│   ├── database.ts          # MongoDB connection
│   ├── constants.ts        # App constants
│   └── env.ts              # Environment validation
├── models/                  # Mongoose models
├── services/                # Business logic
├── handlers/                # Bot handlers
├── middleware/              # Middleware functions
├── utils/                   # Utility functions
└── types/                   # TypeScript types
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# With coverage
npm run test:coverage
```

## 📝 Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type check
npm run type-check
```

## 🚢 Deployment

### Railway.app (Recommended)

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Set environment variables
5. Deploy: `railway up`

### VPS Deployment

1. Build: `npm run build`
2. Use PM2: `pm2 start dist/index.js`
3. Setup Nginx (optional)

## 📊 Monitoring

- **UptimeRobot**: Monitor bot health
- **Sentry**: Error tracking (optional)
- **Winston Logs**: Check `logs/` directory

## 🔐 Security

- All inputs validated with Zod
- Rate limiting implemented
- Environment variables for secrets
- No hardcoded credentials

## 📚 Features

### ✅ Completed

- Step 1-3: Project setup, Database models, Bot initialization
- Step 4: User Onboarding (/start, language, phone, region)
- Step 5: Request Creation (text, media, voice)

### ⏳ In Progress

- Step 6: AI Classification (Claude API)
- Step 7: Smart Routing
- Step 8: Organization Admin Panel

## 🤝 Contributing

1. Follow TypeScript best practices
2. Write tests for new features
3. Update documentation
4. Follow code style guidelines

## 📄 License

ISC

## 🆘 Support

For issues and questions:
- GitHub Issues
- Telegram: @uzqueue_support

---

**Built with ❤️ for Uzbekistan**
