import redis from 'redis';
import {promisifyAll} from 'bluebird';

console.info(`Attempting to connect to Redis server at ${process.env.REDIS_HOST}`)

promisifyAll(redis.RedisClient.prototype);
promisifyAll(redis.Multi.prototype);

const redisClient = redis.createClient(process.env.REDIS_HOST, {
    connect_timeout: 1000,
    socket_keepalive: false,
    retry_strategy: function (options) {
        // Try reconnecting every 1 second
        return 1000;
    }
});

redisClient.on('connect', () => {
    console.info("Connected to Redis server.");
});

redisClient.on('error', () => {
    console.error("Failed to connect to Redis. What now?")
})

redisClient.on('end', () => {
    console.error("Redis connection closed.")
})

redisClient.on('reconnecting', (delay, attempt) => {
    console.warn("Reconnection", delay, attempt);
})

export default redisClient;