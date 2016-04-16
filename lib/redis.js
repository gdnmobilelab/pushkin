import redis from 'redis';
import Promise from 'bluebird';

export default Promise.promisifyAll(redis.createClient(process.env.REDIS_HOST));