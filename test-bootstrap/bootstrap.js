import redisClient from '../lib/redis';

afterEach(function() {
    return redisClient.flushdbAsync()
})

