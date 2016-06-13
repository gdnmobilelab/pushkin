import {withRedis} from '../lib/redis/client';
import should from 'should';
import env from './env.json';


global.should = should;

Object.assign(process.env, env);

afterEach(function() {
    return withRedis((redisClient) => redisClient.flushdb());
});

process.env.tests_bootstrapped = true;


console.info = () => {}