# Environment Variables Template

Copy these variables to your `.env` file:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=uzqueue_bot
DB_USER=postgres
DB_PASSWORD=your_password_here

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Server Configuration
PORT=3000
NODE_ENV=development

# AI API Keys (for future integration - commented out)
# OPENAI_API_KEY=your_openai_api_key
# GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key

# Third-party API Endpoints (for future integration - commented out)
# AI_ROUTING_API_ENDPOINT=https://api.example.com/routing
# DOCUMENT_API_ENDPOINT=https://api.example.com/documents
# QUEUE_API_ENDPOINT=https://api.example.com/queues
# GOVERNMENT_API_ENDPOINT=https://api.example.com/government
```

## Getting Your Telegram Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Copy the token you receive
5. Paste it in `.env` file as `TELEGRAM_BOT_TOKEN`

