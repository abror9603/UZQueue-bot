# Quick Start - AI Integration

## 🚀 Setup in 3 Steps

### Step 1: Add API Keys to `.env`

```env
# OpenAI API Key
OPENAI_API_KEY=""

# Google API Key
GOOGLE_API_KEY=""

# Optional: Change OpenAI model
OPENAI_MODEL=gpt-4o-mini
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Start Bot

```bash
npm start
```

## ✅ Verify It Works

Send these commands to your Telegram bot:

1. `/start` - Should show welcome message
2. Select "🤖 Aqlli yo'naltirish" - Ask a question about government services
3. Select "🎤 Ovozli yordamchi" - Send a voice message
4. Select "📸 Hujjat tahlili" - Send a document photo

## 🔧 What Changed

### Before (Demo)
- Mock responses
- Template documents
- No real AI

### After (AI-Powered)
- ✅ Real OpenAI GPT responses
- ✅ Intelligent problem analysis
- ✅ Professional document generation
- ✅ Accurate voice transcription
- ✅ Advanced document recognition

## 📍 File Locations

- AI Services: `src/services/ai/`
- Configuration: `.env` file
- Documentation: `AI_INTEGRATION.md`

## 🐛 Troubleshooting

**"API key not configured"**
- Check `.env` file exists
- Verify API keys are correct
- Restart the bot after changing `.env`

**API errors**
- Check API keys are valid
- Verify API quotas/limits
- Check internet connection

## 📚 Full Documentation

See `AI_INTEGRATION.md` for complete guide.

---

🎉 Your bot is now AI-powered!

