# Docker Setup Guide for UZQueue Bot

Complete production-ready Docker architecture for UZQueue Telegram Bot.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

## 🚀 Quick Start

### 1. Clone and Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env  # or use your preferred editor
```

### 2. Build and Start Containers

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Verify Services

```bash
# Check all containers are running
docker-compose ps

# Should show:
# - uzqueue-postgres (healthy)
# - uzqueue-redis (healthy)
# - uzqueue-bot (running)
```

## 📦 Docker Services

### Services Overview

1. **app** - Node.js application (UZQueue Bot)
2. **postgres** - PostgreSQL 14 database
3. **redis** - Redis 7 cache/session store

### Service Dependencies

- `app` depends on `postgres` and `redis`
- All services wait for health checks before starting
- Migrations run automatically on app startup

## 🔧 Configuration

### Environment Variables

Create `.env` file from `.env.example`:

```env
TELEGRAM_BOT_TOKEN=your_token_here
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=uzqueue_bot
DB_HOST=postgres
DB_PORT=5432
REDIS_HOST=redis
REDIS_PORT=6379
PORT=3000
NODE_ENV=production
```

**Important Notes:**
- `DB_HOST=postgres` (service name in Docker network)
- `REDIS_HOST=redis` (service name in Docker network)
- Don't expose sensitive data in `.env` (use secrets in production)

### Database Configuration

The app uses environment variables that work in Docker:

```javascript
// src/config/database.js
host: process.env.DB_HOST || 'localhost'
port: process.env.DB_PORT || 5432
username: process.env.POSTGRES_USER || process.env.DB_USER
password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD
database: process.env.POSTGRES_DB || process.env.DB_NAME
```

### Redis Configuration

Redis uses URL format for Docker compatibility:

```javascript
// src/config/redis.js
url: `redis://${REDIS_HOST}:${REDIS_PORT}`
```

## 📝 Docker Commands

### Build Commands

```bash
# Build all containers
docker-compose build

# Build specific service
docker-compose build app

# Build without cache
docker-compose build --no-cache
```

### Start/Stop Commands

```bash
# Start all services (detached mode)
docker-compose up -d

# Start and view logs
docker-compose up

# Stop all services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop, remove containers and volumes (⚠️ deletes database data)
docker-compose down -v
```

### Logs Commands

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f redis

# View last 100 lines
docker-compose logs --tail=100 app

# View logs since timestamp
docker-compose logs --since 2024-01-01T00:00:00 app
```

### Restart Commands

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart app

# Restart with rebuild
docker-compose up -d --build app
```

### Status Commands

```bash
# List all containers
docker-compose ps

# Show resource usage
docker stats

# Inspect specific container
docker inspect uzqueue-bot

# Check container logs
docker logs uzqueue-bot
docker logs uzqueue-postgres
docker logs uzqueue-redis
```

## 🗄️ Database Operations

### Running Migrations

Migrations run automatically on container startup. To run manually:

```bash
# Run migrations inside app container
docker-compose exec app npm run migrate

# Run specific migration
docker-compose exec app npx sequelize-cli db:migrate
```

### Connect to PostgreSQL

#### Option 1: Using Docker Exec

```bash
# Connect to PostgreSQL container
docker-compose exec postgres psql -U postgres -d uzqueue_bot

# Or using environment variables
docker-compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB
```

#### Option 2: Using psql Client (from host)

```bash
# Connect from host machine
psql -h localhost -p 5432 -U postgres -d uzqueue_bot

# Password will be prompted (from POSTGRES_PASSWORD in .env)
```

#### Option 3: Using Database Client

- Host: `localhost`
- Port: `5432` (or value from `.env`)
- Database: `uzqueue_bot`
- Username: `postgres` (or value from `.env`)
- Password: (from `.env`)

### Database Backup

```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres uzqueue_bot > backup.sql

# Backup with timestamp
docker-compose exec postgres pg_dump -U postgres uzqueue_bot > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Database Restore

```bash
# Restore from backup
docker-compose exec -T postgres psql -U postgres uzqueue_bot < backup.sql
```

### Database Reset

```bash
# ⚠️ Warning: This deletes all data
docker-compose down -v
docker-compose up -d
docker-compose exec app npm run migrate
```

## 🔴 Redis Operations

### Connect to Redis

#### Option 1: Using Docker Exec

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# Run commands directly
docker-compose exec redis redis-cli PING
docker-compose exec redis redis-cli KEYS "*"
docker-compose exec redis redis-cli FLUSHALL  # ⚠️ Clears all data
```

#### Option 2: Using Redis Client (from host)

```bash
# Connect from host (if port is exposed)
redis-cli -h localhost -p 6379

# Or with password
redis-cli -h localhost -p 6379 -a your_password
```

### Redis Operations

```bash
# Check Redis info
docker-compose exec redis redis-cli INFO

# View all keys
docker-compose exec redis redis-cli KEYS "*"

# Get specific key value
docker-compose exec redis redis-cli GET "user:state:12345"

# Clear all data
docker-compose exec redis redis-cli FLUSHALL

# Monitor commands in real-time
docker-compose exec redis redis-cli MONITOR
```

## 📁 Data Persistence

### PostgreSQL Data

PostgreSQL data is persisted in Docker volume `postgres_data`:

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect uzqueue_bot_postgres_data

# Backup volume location
# Linux: /var/lib/docker/volumes/uzqueue_bot_postgres_data/_data
# Windows: \\wsl$\docker-desktop-data\data\docker\volumes\...
```

### Redis Data

Redis runs without persistence by default. To enable persistence, modify `docker-compose.yml`:

```yaml
redis:
  command: redis-server --appendonly yes
  volumes:
    - redis_data:/data
```

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

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Issues

```bash
# Test database connection from app container
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
```

### Redis Connection Issues

```bash
# Test Redis connection from app container
docker-compose exec app node -e "
  const redis = require('redis');
  const client = redis.createClient({ url: 'redis://redis:6379' });
  client.connect().then(() => {
    client.ping().then(r => console.log('Redis:', r));
    client.quit();
  });
"

# Check Redis status
docker-compose exec redis redis-cli PING
```

### Application Errors

```bash
# View application logs
docker-compose logs -f app

# Execute commands in app container
docker-compose exec app sh

# Check environment variables
docker-compose exec app env | grep -E "(DB_|REDIS_|POSTGRES_)"
```

### Clean Up Everything

```bash
# Stop and remove containers, networks, volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Prune unused Docker resources
docker system prune -a
```

## 🏗️ Production Deployment

### Security Recommendations

1. **Use Docker Secrets** (in Docker Swarm):
   ```yaml
   secrets:
     postgres_password:
       external: true
   ```

2. **Use Environment Files**:
   - Never commit `.env` file
   - Use separate `.env.production`
   - Rotate secrets regularly

3. **Network Security**:
   - Don't expose database/Redis ports in production
   - Use internal Docker network only
   - Add firewall rules

4. **Resource Limits**:
   ```yaml
   services:
     app:
       deploy:
         resources:
           limits:
             cpus: '1.0'
             memory: 512M
   ```

### Monitoring

```bash
# Monitor resource usage
docker stats

# Check health
docker-compose ps
curl http://localhost:3000/health
```

### Updates

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build

# Or rolling update
docker-compose up -d --no-deps --build app
```

## 📂 Recommended Folder Structure

```
uzqueue_bot/
├── .env                    # Environment variables (gitignored)
├── .env.example            # Environment template
├── .dockerignore           # Docker ignore file
├── docker-compose.yml      # Docker Compose configuration
├── Dockerfile              # Docker image definition
├── package.json
├── package-lock.json
├── config/                 # Configuration files
│   └── config.js          # Sequelize CLI config
├── src/                    # Application source
│   ├── index.js
│   ├── config/            # App configs
│   ├── handlers/
│   ├── services/
│   ├── models/
│   ├── migrations/
│   ├── locales/
│   └── utils/
├── logs/                   # Application logs (gitignored)
├── backups/                # Database backups (gitignored)
└── docs/                   # Documentation
    ├── README.md
    ├── DOCKER.md          # This file
    └── SETUP.md
```

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Start services | `docker-compose up -d` |
| Stop services | `docker-compose stop` |
| View logs | `docker-compose logs -f app` |
| Restart app | `docker-compose restart app` |
| Run migrations | `docker-compose exec app npm run migrate` |
| Connect to DB | `docker-compose exec postgres psql -U postgres -d uzqueue_bot` |
| Connect to Redis | `docker-compose exec redis redis-cli` |
| Remove everything | `docker-compose down -v` |

## 🆘 Need Help?

- Check container logs: `docker-compose logs -f`
- Verify environment: `docker-compose exec app env`
- Test connections from inside containers
- Review health checks: `docker-compose ps`

