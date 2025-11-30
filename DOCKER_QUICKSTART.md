# Docker Quick Start Guide

## 🚀 Quick Commands

### Build and Start
```bash
# Build containers
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Stop Services
```bash
# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove everything including volumes (⚠️ deletes data)
docker-compose down -v
```

### Restart App
```bash
# Restart app container
docker-compose restart app

# Rebuild and restart
docker-compose up -d --build app
```

### Database Operations
```bash
# Run migrations
docker-compose exec app npm run migrate

# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d uzqueue_bot

# Backup database
docker-compose exec postgres pg_dump -U postgres uzqueue_bot > backup.sql
```

### Redis Operations
```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# Check Redis status
docker-compose exec redis redis-cli PING

# Clear all Redis data
docker-compose exec redis redis-cli FLUSHALL
```

### View Logs
```bash
# All services
docker-compose logs -f

# App only
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100 app
```

### Status Check
```bash
# Container status
docker-compose ps

# Resource usage
docker stats
```

## 📋 Setup Steps

1. **Create `.env` file:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Build and start:**
   ```bash
   docker-compose up -d
   ```

3. **Check status:**
   ```bash
   docker-compose ps
   ```

4. **View logs:**
   ```bash
   docker-compose logs -f app
   ```

## 🔧 Environment Variables

Minimum required in `.env`:
```env
TELEGRAM_BOT_TOKEN=your_token_here
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=uzqueue_bot
POSTGRES_USER=postgres
```

## 📖 Full Documentation

See `DOCKER.md` for complete documentation.

