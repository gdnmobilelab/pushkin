import {withRedis} from './redis/client';
import namespaces from './redis/namespaces';
import webPush from 'web-push';
import PromiseTools from 'promise-tools';

webPush.setGCMAPIKey(process.env.GCM_API_KEY);

export default {
    send: function(topic, [rangeStart, rangeEnd], message, broadcastIndex) {
        let namespacedTopic = namespaces.topic(topic);
        
        return withRedis((redisClient) => {
            return redisClient.zrangebyscore(namespacedTopic, rangeStart, rangeEnd)
            .then((results) => {
                return PromiseTools.map(results, (result) => {
                    let parsed = JSON.parse(result);
                    return webPush.sendNotification(parsed.endpoint, {
                        payload: message.Message,
                        userPublicKey: parsed.keys.p256dh,
                        userAuth: parsed.keys.auth
                    })
                    .then(() => {
                        return true;
                    })
                    .catch((err) => {
                        console.error(err);
                        return false;
                    })
                }, 50);
            })
            .then((responses) => {
                let successful = responses.filter((r) => r === true);
                console.info(`Successfully sent ${successful.length} of ${responses.length} requests.`);
                return redisClient.hgetall(namespaces.performanceLogging(message.MessageId));
            })
            .then((performanceData) => {

                // Because we've spread our publishes across lambdas, we need to store
                // performance data back somewhere central, then examine it when we know we're
                // the last labmda to run.

                let latestTime = Date.now();
                let startTime = null;
            
                for (let key in performanceData) {

                    if (key === 'start_time') {
                        startTime = parseInt(performanceData[key],10);
                    }

                    if (key === `end_time_${broadcastIndex}`) {
                        // is the entry for this lambda, so ignore for now.
                        continue;
                    }

                    if (performanceData[key] === '-1') {

                        // If one hasn't been filled out yet then it means this
                        // is not the last one to run, so we'll just log our own
                        // data and continue;

                        return redisClient.hset(namespaces.performanceLogging(message.MessageId), `end_time_${broadcastIndex}`, Date.now())
                    }

                    latestTime = Math.max(latestTime, parseInt(performanceData[key]));
                }

                let timeTaken = latestTime - startTime;
                console.info(`BROADCAST: Sent all requests in ${timeTaken}ms`, latestTime, startTime);
                return redisClient.del(namespaces.performanceLogging(topic))
            })
        })
        
        
    }
}