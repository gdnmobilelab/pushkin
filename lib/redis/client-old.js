import redis from 'redis';
import {promisifyAll} from 'bluebird';
import {list} from 'redis-commands';

/* AWS Lambda does weird things with this Redis connection. When a Lambda is idle
 * it (seems to?!) sever the connection. But the Lambda is still usable, so we get
 * errors about closed connections. Instead, we're going to wrap our redis commands
 * in a Promise-based wrapper to ensure we always have an active connection
 */


const createNewClient = function() {
    console.info(`Attempting to connect to Redis server at ${process.env.REDIS_HOST}`)

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
    });

    redisClient.on('end', () => {
        console.error("Redis connection closed.");
        currentRedisClient = null;
    });

    redisClient.on('reconnecting', (delay, attempt) => {
        console.warn("Reconnection", delay, attempt);
    });
    
    return redisClient;
};

let currentRedisClient = null;

let redisObj = {
    __runCommand: function(commandName, args) {
        return new Promise((fulfill, reject) => {
            if (currentRedisClient === null) {
                currentRedisClient = createNewClient();
            }
            
            let argsArray = Array.prototype.slice.call(args);
            
            argsArray.push(function(err,result) {
                if (err) {
                    return reject(err);
                }
                fulfill(result)
            })
            
            
            currentRedisClient[commandName].apply(currentRedisClient, argsArray);
        })
    }
};

for (let commandName of list) {
    redisObj[commandName + 'Async'] = function() {
        return redisObj.__runCommand(commandName, arguments);
    }
}

redisObj.multi = function() {
    if (currentRedisClient === null) {
        currentRedisClient = createNewClient();
    }
    let multi = currentRedisClient.multi();
    multi.execAsync = function() {
        return new Promise((fulfill, reject) => {
           multi.exec(function(err, result) {
               if (err) return reject(err);
               fulfill(result);
           }) 
        });
    }
    return multi;
}

export default redisObj;