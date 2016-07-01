import {withRedis} from './redis/client';
import namespaces from './redis/namespaces';
import webPush from './web-push';
import PromiseTools from 'promise-tools';
import sendToSlack from './util/send-to-slack';
import removeSubscription from './subscription/remove';

export default {
    send: function(topic, [rangeStart, rangeEnd], message, broadcastIndex) {
        let namespacedTopic = namespaces.topic(topic);
        if (!message.MessageId) {
            throw new Error("Message needs ID")
        }

        let {ttl, payload} = JSON.parse(message.Message);

        if (!ttl || !payload) {
            console.error("Messages must now be sent as an object with ttl and payload keys.");
            return false;
        }

        return withRedis((redisClient) => {
            return redisClient.zrangebyscore(namespacedTopic, rangeStart, rangeEnd, 'WITHSCORES')
            .then((results) => {
                let resultObjs = [];
                
                for (let i = 0; i < results.length; i = i + 2) {
                    resultObjs.push({
                        clientEndpoint: JSON.parse(results[i]),
                        score: results[i+1]
                    })
                }
                
                let sendResults = {
                    success: [],
                    failure: []
                };
              
                return PromiseTools.map(resultObjs, ({clientEndpoint, score}) => {
                    return webPush.sendNotification(clientEndpoint.endpoint, {
                        payload: JSON.stringify(payload),
                        TTL: ttl,
                        userPublicKey: clientEndpoint.keys.p256dh,
                        userAuth: clientEndpoint.keys.auth
                    })
                    .then(() => {
                        sendResults.success.push({id: score});
                        return true;
                    })
                    .catch((err) => {
                        console.error(err);

                        sendResults.failure.push({
                            id: score,
                            subscription: {
                                endpoint: clientEndpoint.endpoint,
                                keys: clientEndpoint.keys
                            },
                            error: err
                        })
                        return false;
                    })
                }, 50)
                .then(() => {
                    return sendResults;
                })
            })
            .then(({success, failure}) => {
                let total = success.length + failure.length;
                console.info(`Successfully sent ${success.length} of ${total} requests for message ${message.MessageId}.`);

                let promiseArray = [
                    redisClient.incrby(namespaces.successfulCount(topic, message.MessageId), success.length)
                ];
                
                if (failure.length !== 0) {
                    let failedToSave = failure.map((f) => JSON.stringify({
                        id: f.id,
                        error: f.error.toString()
                    }));

                    promiseArray.push(redisClient.lpush([namespaces.failedSendList(topic,message.MessageId)].concat(failedToSave)));
                }
                

                
                return Promise.all(promiseArray)
                .then(() => {
                    return {success, failure};
                })
            })
            .then((responses) => {
                return redisClient.hgetall(namespaces.performanceLogging(message.MessageId))
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
                            .then(() => {
                                // try {
                                //     sendToSlack({
                                //         text: "Send one batch in " + (Date.now() - startTime) + "ms"
                                //     });
                                // } catch (err) {
                                //     console.error("slack err", err)
                                // }
                                
                            })
                        }

                        
                        latestTime = Math.max(latestTime, parseInt(performanceData[key]));
                    }

                    for (let key in performanceData) {
                        let keySplit = key.split("end_time_");
                        if (keySplit.length === 1) {
                            continue;
                        }
                    }


                    // If we've gotten to here it means that all the others are filled out
                    let timeTaken = latestTime - startTime;
                    console.info(`BROADCAST: Sent all requests in ${timeTaken}ms`, latestTime, startTime);
                    return redisClient.del(namespaces.performanceLogging(topic))
                    .then(() => {
                        return redisClient.zcount(namespacedTopic, '-inf', '+inf')
                        .then((numberOfSubscribers) => {
                            
                            
                            return Promise.all([
                                redisClient.lrange(namespaces.failedSendList(topic, message.MessageId), 0, -1),
                                redisClient.get(namespaces.successfulCount(topic, message.MessageId))
                            ])
                            .then(([failures, successCount]) => {
                                
                                let slackMsg = {
                                    text: `Sent ${successCount} messages to ${numberOfSubscribers} subscribers \`${topic}\` in ${timeTaken}ms`
                                };
                                
                                if (failures.length === 0) {
                                    return slackMsg;
                                }
                             
                                let errors = failures.map((f) => JSON.parse(f).error);
                                slackMsg.attachments = [
                                    {
                                        fallback: "errors",
                                        text: errors.join('\n')
                                    }
                                    
                                ]
                                
                                
                                slackMsg.text += `\n\n${failures.length} failed messages. Errors encountered:`;
                                return slackMsg;
                            })
                        })
                        .then((completeSlackMsg) => {
                            return sendToSlack(completeSlackMsg);
                        })
                        
                        
                        
                    })
                })
                .then(() => {
                    return responses;
                })
            })
        })
    }
}