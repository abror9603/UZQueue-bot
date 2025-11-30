#!/bin/sh
set -e

echo "🚀 Starting UZQueue Bot..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until PGPASSWORD=$POSTGRES_PASSWORD pg_isready -h $DB_HOST -p $DB_PORT -U $POSTGRES_USER 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis..."
until redis-cli -h $REDIS_HOST -p $REDIS_PORT ping 2>/dev/null | grep -q PONG; do
  echo "Redis is unavailable - sleeping"
  sleep 2
done
echo "✅ Redis is ready!"

# Run migrations
echo "📦 Running database migrations..."
npm run migrate || echo "⚠️  Migration failed or already up to date"

# Start the application
echo "🎯 Starting application..."
exec npm start

