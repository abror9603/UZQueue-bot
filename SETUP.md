# UZQueue Bot Setup Guide

## Prerequisites

1. **Node.js** (v16 or higher)
2. **PostgreSQL** (v12 or higher)
3. **Redis** (v6 or higher)
4. **Telegram Bot Token** from [@BotFather](https://t.me/BotFather)

## Step-by-Step Setup

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory (see `ENV_TEMPLATE.md` for template):

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=uzqueue_bot
DB_USER=postgres
DB_PASSWORD=your_password
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
NODE_ENV=development
```

### 3. Setup PostgreSQL Database

Create the database:

```bash
# Using psql
createdb uzqueue_bot

# Or using SQL
psql -U postgres
CREATE DATABASE uzqueue_bot;
```

### 4. Setup Redis

Make sure Redis is running:

```bash
# On Windows (if using WSL)
sudo service redis-server start

# On Linux/Mac
redis-server

# Test connection
redis-cli ping
# Should return: PONG
```

### 5. Run Database Migrations

```bash
npm run migrate
```

This will create the following tables:
- `users` - User information
- `applications` - Application tracking
- `queues` - Queue bookings

### 6. Start the Bot

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

## Testing

1. Open Telegram and search for your bot using the username you set with BotFather
2. Send `/start` command
3. You should see the welcome message with main menu

## Features to Test

1. **Smart Routing** - Send a problem description
2. **Document Assistant** - Request document preparation
3. **Voice Assistant** - Send a voice message
4. **Queue Booking** - Book an appointment slot
5. **Document Recognition** - Send a photo of a document
6. **Application Tracking** - Track an application by number
7. **Settings** - Change language (Uzbek, Russian, English)

## Troubleshooting

### Bot not responding
- Check if `TELEGRAM_BOT_TOKEN` is correct
- Verify the bot is not stopped in BotFather
- Check console logs for errors

### Database connection error
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists

### Redis connection error
- Verify Redis is running (`redis-cli ping`)
- Check Redis host and port in `.env`
- For password-protected Redis, set `REDIS_PASSWORD` in `.env`

## Demo Mode

The bot currently runs in **demo mode**. All AI features use mock data:
- Smart routing uses keyword matching
- Document generation uses templates
- Voice transcription returns demo text
- Document recognition returns mock analysis
- Queue booking uses simulated slots

Third-party API integrations are commented out in the service files and can be connected later.

