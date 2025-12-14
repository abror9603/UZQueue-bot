const redis = require('redis');
require('dotenv').config();

// Use URL format for Docker compatibility
const redisUrl = process.env.REDIS_URL || 
  `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

const redisClient = redis.createClient({
  url: redisUrl
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

// Connect to Redis
redisClient.connect().catch((err) => {
  console.error('Failed to connect to Redis:', err);
});

module.exports = redisClient;

