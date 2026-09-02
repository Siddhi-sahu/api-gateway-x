import { createClient } from 'redis';
import { RedisClientType } from 'redis';

const redisClient: RedisClientType = createClient({
    url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Successfully connected to Redis.'));

// Connect to the container on initialization
await redisClient.connect();

export default redisClient;
