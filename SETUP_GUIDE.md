# 🚀 UZQueue Bot v2.0 - Setup Guide

## 📋 Prerequisites

1. **Node.js 20+** installed
2. **MongoDB Atlas** account (or local MongoDB)
3. **Telegram Bot Token** from @BotFather
4. **Anthropic Claude API Key** from Anthropic Console

## 🔧 Step-by-Step Setup

### Step 1: Clone and Install

```bash
# Install dependencies
npm install
```

### Step 2: Get Telegram Bot Token

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` command
3. Follow instructions to create your bot
4. Copy the bot token (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Step 3: Get MongoDB Connection String

**Option A: MongoDB Atlas (Recommended)**

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a new cluster (free tier available)
4. Click "Connect" → "Connect your application"
5. Copy connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/...`)

**Option B: Local MongoDB**

1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/uzqueue`

### Step 4: Get OpenAI API Key

1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create new API key
5. Copy the key (starts with `sk-proj-...` or `sk-...`)

### Step 5: Get Your Telegram ID

1. Open Telegram and search for **@userinfobot**
2. Send `/start` command
3. Bot will reply with your Telegram ID (number like `123456789`)
4. Copy this ID

### Step 6: Configure .env File

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` file and fill in:

```env
# Telegram Bot Token (from Step 2)
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# MongoDB Connection String (from Step 3)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/uzqueue?retryWrites=true&w=majority

# OpenAI API Key (from Step 4)
OPENAI_API_KEY=sk-proj-...

# Your Telegram ID (from Step 5)
SUPER_ADMIN_IDS=123456789

# Optional settings
NODE_ENV=development
LOG_LEVEL=info
```

### Step 7: Build and Run

```bash
# Build TypeScript
npm run build

# Run in development mode (with auto-reload)
npm run dev

# Or run in production mode
npm start
```

### Step 8: Test the Bot

1. Open Telegram and find your bot (search by bot name)
2. Send `/start` command
3. Follow onboarding flow:
   - Select language
   - Enter phone (optional)
   - Select region
4. Send a test request (text message)
5. Check if request is created and classified

## ✅ Verification Checklist

- [ ] Bot responds to `/start` command
- [ ] User can complete onboarding
- [ ] User can create text request
- [ ] Request gets tracking ID
- [ ] AI classification works (check logs)
- [ ] Request status can be tracked with `/track`

## 🐛 Troubleshooting

### Bot doesn't respond

- Check if `BOT_TOKEN` is correct
- Verify bot is not stopped in @BotFather
- Check logs: `logs/combined.log`

### Database connection error

- Verify `MONGO_URI` is correct
- Check if MongoDB Atlas IP whitelist includes your IP (0.0.0.0/0 for all)
- Test connection string in MongoDB Compass

### AI classification fails

- Verify `OPENAI_API_KEY` is correct
- Check API key has credits/quota
- Check logs for detailed error: `logs/error.log`

### Environment variables not loading

- Make sure `.env` file is in root directory
- Check file name is exactly `.env` (not `.env.txt`)
- Restart the bot after changing `.env`

## 📚 Next Steps

After setup is complete:

1. **Create Test Organization**:
   - Use `/admin_register` as admin
   - Super admin verifies with `/admin_verify`

2. **Test Full Flow**:
   - User creates request
   - AI classifies
   - Request routes to organization
   - Admin responds
   - User gets notification

3. **Deploy to Production**:
   - See `README.md` for deployment instructions
   - Use Railway.app or VPS

## 🆘 Support

If you encounter issues:
- Check logs in `logs/` directory
- Review error messages
- Verify all environment variables are set correctly

---

**Happy coding! 🚀**

