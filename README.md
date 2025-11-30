# UZQueue Telegram Bot

Telegram bot for UZQueue AI Platform - helping citizens navigate government services, queue management, and document processing in Uzbekistan and CIS countries.

## Features

- 🤖 AI Smart Routing - Automatic identification of required organizations and departments
- 📄 AI Document Assistant - Document preparation and guidance
- 🎤 Voice Assistant - Voice message processing
- 📋 Queue Management - Finding and booking queues (simulation)
- 📸 Document Image Recognition - Analyze document photos
- 📊 Application Tracking - Track application status
- 🌍 Multi-language Support - Uzbek, Russian, English
- 👤 User State Tracking - Track user navigation steps

## Technologies

- Node.js
- Express.js
- Redis (session management)
- PostgreSQL (database)
- Sequelize (ORM)
- node-telegram-bot-api

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Setup database:
```bash
npm run migrate
```

4. Run the bot:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Configuration

### Required Environment Variables

- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token from @BotFather
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL configuration
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` - Redis configuration
- `PORT` - Express server port (default: 3000)

## Project Structure

```
src/
├── index.js                        # Main entry point
├── handlers/                       # Command and message handlers
│   ├── commandHandlers.js         # /start, /help, /settings
│   ├── messageHandlers.js         # Text, voice, photo messages
│   └── callbackHandlers.js        # Callback query handlers
├── services/                       # Business logic services
│   ├── smartRoutingService.js     # AI Smart Routing (demo)
│   ├── documentService.js         # Document preparation (demo)
│   ├── queueService.js            # Queue management (demo)
│   ├── voiceService.js            # Voice transcription (demo)
│   ├── documentRecognitionService.js # Document analysis (demo)
│   ├── applicationTrackingService.js # Application tracking
│   ├── userService.js             # User management
│   └── stateService.js            # Redis state management
├── models/                         # Sequelize database models
│   ├── User.js                    # User model
│   ├── Application.js             # Application model
│   ├── Queue.js                   # Queue model
│   └── index.js                   # Model associations
├── config/                         # Configuration files
│   ├── database.js                # Sequelize config
│   ├── redis.js                   # Redis client
│   └── i18n.js                    # i18next config
├── locales/                        # Translation files
│   ├── uz.json                    # Uzbek translations
│   ├── ru.json                    # Russian translations
│   └── en.json                    # English translations
├── migrations/                     # Database migrations
└── utils/                          # Utility functions
    └── keyboard.js                # Keyboard builders
```

## Environment Variables

Create a `.env` file in the root directory:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=uzqueue_bot
DB_USER=postgres
DB_PASSWORD=your_password_here
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
PORT=3000
NODE_ENV=development
```

## Demo Mode

Currently running in demo mode. Third-party API integrations are commented out and will be connected later:
- AI Routing API (for smart routing)
- Document Generation API (for document assistant)
- Voice-to-Text API (for voice assistant)
- Document Recognition API (for image analysis)
- Government Services API (for application tracking)
- Queue Management API (for queue booking)

## System Prompt

The bot uses the following system prompt internally:

```
Siz — UZQueue AI Platform uchun mo'ljallangan rasmiy AI yordamchi tizimisiz. 
Sizning vazifangiz O'zbekiston va MDH davlatlaridagi davlat idoralari, banklar, 
klinikalar va xizmat ko'rsatish tashkilotlaridagi fuqarolar murojaatlarini, 
navbatlarni va hujjat jarayonlarini sun'iy intellekt yordamida avtomatlashtirishdir.
```

## License

ISC

# UZQueue-bot
