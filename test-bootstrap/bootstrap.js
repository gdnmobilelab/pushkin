import redisClient from '../lib/redis/client';
import should from 'should';
import env from './env.json';


GLOBAL.should = should;

Object.assign(process.env, env);

afterEach(function() {
    return redisClient.flushdbAsync()
});

process.env.tests_bootstrapped = true;


console.info = () => {}