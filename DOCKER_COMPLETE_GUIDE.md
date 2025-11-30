# Complete Docker Setup Guide

This document provides a complete overview of the Docker architecture setup for UZQueue Bot.

## 📦 What Was Created

### Core Docker Files

1. **`docker-compose.yml`** - Multi-service orchestration
   - 3 services: app, postgres, redis
   - Health checks configured
   - Volume persistence for PostgreSQL
   - Network isolation
   - Dependency management

2. **`Dockerfile`** - Production-ready Node.js image
   - Node.js 20 Alpine base
   - Optimized layer caching
   - Health check configured
   - All dependencies included

3. **`docker-entrypoint.sh`** - Startup orchestration
   - Waits for database/Redis to be ready
   - Runs migrations automatically
   - Starts application

4. **`.dockerignore`** - Build optimization
   - Excludes unnecessary files
   - Reduces image size

5. **`.env.example`** - Environment template
   - All required variables
   - Docker-optimized defaults

### Helper Scripts

6. **`docker-commands.sh`** - Interactive helper
   - Menu-driven interface
   - Common operations
   - User-friendly commands

### Documentation

7. **`DOCKER.md`** - Complete reference guide
8. **`DOCKER_QUICKSTART.md`** - Quick command reference
9. **`DOCKER_SETUP_SUMMARY.md`** - Setup overview
10. **`DOCKER_COMPLETE_GUIDE.md`** - This file

### Updated Configurations

- `src/config/database.js` - Docker-compatible database config
- `src/config/redis.js` - URL-based Redis config
- `config/config.js` - Sequelize CLI config updated

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│              Docker Network (bridge)                 │
│                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   App       │  │  PostgreSQL  │  │   Redis    │ │
│  │  (Node.js)  │──│   (14)       │  │   (7)      │ │
│  │             │  │              │  │            │ │
│  │ Port: 3000  │  │ Port: 5432   │  │ Port: 6379 │ │
│  └─────────────┘  └──────────────┘  └────────────┘ │
│        │                  │                  │        │
└────────┼──────────────────┼──────────────────┼────────┘
         │                  │                  │
         └──────────────────┴──────────────────┘
              Exposed to Host (configurable)
```

---

## 🔧 Configuration Details

### 1. Docker Compose Services

#### App Service
- **Builds from**: Dockerfile
- **Depends on**: postgres (healthy), redis (healthy)
- **Ports**: 3000:3000
- **Volumes**: 
  - `./logs:/app/logs` (logs persistence)
- **Environment**: All app config vars
- **Restart**: unless-stopped

#### PostgreSQL Service
- **Image**: postgres:14-alpine
- **Volumes**: `postgres_data:/var/lib/postgresql/data`
- **Health Check**: `pg_isready`
- **Ports**: 5432:5432 (exposed for host access)
- **Environment**: User, password, database

#### Redis Service
- **Image**: redis:7-alpine
- **Health Check**: `redis-cli ping`
- **Ports**: 6379:6379 (exposed for host access)
- **Command**: `redis-server --appendonly no`

### 2. Database Configuration

**File**: `src/config/database.js`

```javascript
const sequelize = new Sequelize(
  process.env.POSTGRES_DB || process.env.DB_NAME,
  process.env.POSTGRES_USER || process.env.DB_USER,
  process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    // ... pool config
  }
);
```

**Docker Environment**:
- `DB_HOST=postgres` (service name)
- `DB_PORT=5432` (internal port)
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`

### 3. Redis Configuration

**File**: `src/config/redis.js`

```javascript
const redisUrl = process.env.REDIS_URL || 
  `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

const redisClient = redis.createClient({
  url: redisUrl
});
```

**Docker Environment**:
- `REDIS_HOST=redis` (service name)
- `REDIS_PORT=6379` (internal port)

---

## 📋 Step-by-Step Setup

### Step 1: Prerequisites

```bash
# Verify Docker is installed
docker --version
docker-compose --version

# Should show versions, e.g.:
# Docker version 20.10.x
# docker-compose version 1.29.x or 2.x
```

### Step 2: Environment Configuration

```bash
# Copy template
cp .env.example .env

# Edit with your values
nano .env  # or use your editor
```

**Minimum required**:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
POSTGRES_PASSWORD=secure_password_here
```

### Step 3: Build Images

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build app

# Build without cache (clean build)
docker-compose build --no-cache
```

### Step 4: Start Services

```bash
# Start in detached mode
docker-compose up -d

# Start with logs visible
docker-compose up

# Start specific service
docker-compose up -d postgres redis
docker-compose up -d app
```

### Step 5: Verify

```bash
# Check all containers are running
docker-compose ps

# Should show:
# uzqueue-postgres    healthy
# uzqueue-redis       healthy
# uzqueue-bot         running

# Check logs
docker-compose logs -f app
```

---

## 🚀 Complete Command Reference

### Build Operations

```bash
# Build all
docker-compose build

# Rebuild specific service
docker-compose build app

# Force rebuild without cache
docker-compose build --no-cache app
```

### Start/Stop Operations

```bash
# Start all services
docker-compose up -d

# Stop all services (keeps containers)
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop, remove containers and volumes (⚠️ deletes data)
docker-compose down -v

# Restart specific service
docker-compose restart app

# Restart all
docker-compose restart
```

### Log Operations

```bash
# Follow all logs
docker-compose logs -f

# Follow app logs
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100 app

# Since timestamp
docker-compose logs --since 2024-01-01T00:00:00 app

# Specific service
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Database Operations

```bash
# Run migrations
docker-compose exec app npm run migrate

# Connect to PostgreSQL (interactive)
docker-compose exec postgres psql -U postgres -d uzqueue_bot

# Execute SQL command
docker-compose exec postgres psql -U postgres -d uzqueue_bot -c "SELECT version();"

# Backup database
docker-compose exec postgres pg_dump -U postgres uzqueue_bot > backup_$(date +%Y%m%d).sql

# Restore database
docker-compose exec -T postgres psql -U postgres uzqueue_bot < backup.sql

# List databases
docker-compose exec postgres psql -U postgres -c "\l"

# List tables
docker-compose exec postgres psql -U postgres -d uzqueue_bot -c "\dt"
```

### Redis Operations

```bash
# Connect to Redis CLI (interactive)
docker-compose exec redis redis-cli

# Ping Redis
docker-compose exec redis redis-cli PING

# Get all keys
docker-compose exec redis redis-cli KEYS "*"

# Get specific key
docker-compose exec redis redis-cli GET "user:state:12345"

# Get Redis info
docker-compose exec redis redis-cli INFO

# Clear all data
docker-compose exec redis redis-cli FLUSHALL

# Monitor commands
docker-compose exec redis redis-cli MONITOR

# Get memory usage
docker-compose exec redis redis-cli INFO memory
```

### Status & Monitoring

```bash
# Container status
docker-compose ps

# Resource usage
docker stats

# Inspect container
docker inspect uzqueue-bot

# Container logs
docker logs uzqueue-bot
docker logs uzqueue-postgres
docker logs uzqueue-redis

# Follow logs
docker logs -f uzqueue-bot
```

### Executing Commands

```bash
# Execute command in app container
docker-compose exec app sh

# Execute Node.js command
docker-compose exec app node -e "console.log('Hello')"

# Check environment variables
docker-compose exec app env | grep -E "(DB_|REDIS_|POSTGRES_)"

# Test database connection
docker-compose exec app node -e "
  const db = require('./src/config/database');
  db.authenticate().then(() => console.log('DB OK')).catch(console.error);
"

# Test Redis connection
docker-compose exec app node -e "
  const redis = require('redis');
  const client = redis.createClient({url:'redis://redis:6379'});
  client.connect().then(() => {
    client.ping().then(r => console.log('Redis:', r));
    client.quit();
  });
"
```

---

## 🔍 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs app

# Check if ports are in use
netstat -an | grep 5432  # PostgreSQL
netstat -an | grep 6379  # Redis  
netstat -an | grep 3000  # App

# Check container status
docker-compose ps

# Inspect container
docker inspect uzqueue-bot
```

### Database Connection Issues

```bash
# Test connection from app
docker-compose exec app node -e "
  const { Sequelize } = require('sequelize');
  const sequelize = new Sequelize(
    process.env.POSTGRES_DB,
    process.env.POSTGRES_USER,
    process.env.POSTGRES_PASSWORD,
    { host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'postgres' }
  );
  sequelize.authenticate().then(() => console.log('OK')).catch(console.error);
"

# Check if database is ready
docker-compose exec postgres pg_isready -U postgres

# Check database logs
docker-compose logs postgres
```

### Redis Connection Issues

```bash
# Test Redis from app
docker-compose exec app node -e "
  const redis = require('redis');
  const client = redis.createClient({url:'redis://redis:6379'});
  client.connect().then(() => {
    client.ping().then(r => console.log('Redis:', r));
    client.quit();
  }).catch(console.error);
"

# Check Redis status
docker-compose exec redis redis-cli PING

# Check Redis logs
docker-compose logs redis
```

### Migration Issues

```bash
# Check migration status
docker-compose exec app npx sequelize-cli db:migrate:status

# Run migrations manually
docker-compose exec app npm run migrate

# Undo last migration
docker-compose exec app npx sequelize-cli db:migrate:undo

# Reset all migrations (⚠️ destructive)
docker-compose exec app npx sequelize-cli db:migrate:undo:all
```

### Permission Issues

```bash
# Fix entrypoint script permissions
chmod +x docker-entrypoint.sh

# Fix helper script permissions
chmod +x docker-commands.sh
```

### Clean Rebuild

```bash
# Stop everything
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Clean Docker system
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

---

## 📊 Production Considerations

### Security

1. **Don't expose database/Redis ports** (remove port mappings)
2. **Use Docker secrets** for sensitive data
3. **Set resource limits** in docker-compose.yml
4. **Enable Redis persistence** if needed
5. **Use reverse proxy** (nginx/traefik)
6. **Enable SSL/TLS**

### Performance

1. **Set resource limits**:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '1.0'
         memory: 512M
   ```

2. **Enable Redis persistence** (if data loss is critical)
3. **Configure connection pooling** (already done)
4. **Set up log rotation**
5. **Use production Node.js settings**

### Monitoring

1. **Health checks** (already configured)
2. **Log aggregation** (ELK, Loki, etc.)
3. **Metrics collection** (Prometheus, etc.)
4. **Alerting** (Grafana, etc.)

### Backups

1. **Database backups** (cron job):
   ```bash
   # Daily backup script
   0 2 * * * docker-compose exec -T postgres pg_dump -U postgres uzqueue_bot > /backups/backup_$(date +\%Y\%m\%d).sql
   ```

2. **Volume backups** (Docker volume backup tools)
3. **Redis persistence** (if enabled)

---

## 📁 File Structure

```
uzqueue_bot/
├── .env                      # Environment (gitignored)
├── .env.example              # Environment template
├── .dockerignore             # Docker ignore
├── docker-compose.yml        # Compose config
├── Dockerfile                # App image
├── docker-entrypoint.sh      # Entrypoint script
├── docker-commands.sh        # Helper script
├── package.json
├── package-lock.json
├── config/
│   └── config.js            # Sequelize CLI config
├── src/
│   ├── config/
│   │   ├── database.js      # DB config (Docker-ready)
│   │   └── redis.js         # Redis config (Docker-ready)
│   └── ...
└── docs/
    ├── DOCKER.md            # Full reference
    ├── DOCKER_QUICKSTART.md # Quick commands
    └── DOCKER_COMPLETE_GUIDE.md # This file
```

---

## ✅ Verification Checklist

- [ ] Docker and Docker Compose installed
- [ ] `.env` file created with all variables
- [ ] Containers build successfully (`docker-compose build`)
- [ ] All services start (`docker-compose up -d`)
- [ ] Health checks pass (`docker-compose ps`)
- [ ] App logs show successful DB connection
- [ ] App logs show successful Redis connection
- [ ] Migrations run automatically on startup
- [ ] Bot responds to `/start` command
- [ ] Database persists after container restart
- [ ] Can connect to PostgreSQL from host
- [ ] Can connect to Redis from host
- [ ] Logs are accessible

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Start | `docker-compose up -d` |
| Stop | `docker-compose stop` |
| Restart app | `docker-compose restart app` |
| View logs | `docker-compose logs -f app` |
| Run migrations | `docker-compose exec app npm run migrate` |
| Connect to DB | `docker-compose exec postgres psql -U postgres -d uzqueue_bot` |
| Connect to Redis | `docker-compose exec redis redis-cli` |
| Status | `docker-compose ps` |
| Cleanup | `docker-compose down -v` |

---

## 📚 Additional Resources

- **DOCKER.md** - Complete detailed documentation
- **DOCKER_QUICKSTART.md** - Quick command reference
- **DOCKER_SETUP_SUMMARY.md** - Setup overview

For questions or issues, check the troubleshooting section or review container logs.

