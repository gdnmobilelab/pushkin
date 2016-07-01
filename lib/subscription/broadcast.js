import {withRedis} from '../redis/client';
import namespaces from '../redis/namespaces';
import { createSNSTopic, getTopicNameFromArn } from '../arn';
import SNS from '../sns';
import PromiseTools from 'promise-tools';
import sendToSlack from '../util/send-to-slack';

const pushesPerBatch = 20 // Kind of just made this up. Be interesting to test what works best.

export default function(topicName, sns) {
    let namespacedTopic = namespaces.topic(topicName);
    
    if (!sns.MessageId) {
        throw new Error("Must be provided with a unique MessageId to track execution time.")
    }

    let startTime = Date.now();
    
    // This is where Redis sorted sets become very useful. We can batch our workload not
    // by index but by score - which doesn't change if someone unsubscribes in the middle 
    // of the run.
    
    return withRedis((redisClient) => {
        let redisCountStart = Date.now();
        return redisClient.zcount(namespacedTopic, "-inf", "+inf")
        .then((numberOfSubscribers) => {

            console.info("Fetched Redis count in:", Date.now() - redisCountStart);

            // Grab every batch interval, given the number of subscribers we have.

            let batchStartIndexes = [];

            for (let i = pushesPerBatch; i < numberOfSubscribers; i = i + pushesPerBatch) {
                batchStartIndexes.push(i);
            }

            return batchStartIndexes;
        })
        .then((batchStartIndexes) => {

            return PromiseTools.map(batchStartIndexes, (index) => {
                return redisClient.zrange([namespacedTopic, index, index, 'WITHSCORES'])
                .then((arr) => {
                    // this command returns both the value and the score. We only want the score.
                    return arr[1];
                })
            }, batchStartIndexes.length) // Run them all at once
        })
        .then((scores) => {

            // We don't hardcode the scores we're searching for at the start and end because there's
            // no point. Plus, using +inf in the end means we'll grab anyone that has signed up in
            // the time since we ran the range query.

            scores.unshift('-inf');
            scores.push('+inf');

            let ranges = [];

            for (let i = 0; i < scores.length - 1; i++) {

                let goFrom = scores[i];
                let goTo = scores[i+1];

                if (i > 0) {

                    // The zrangebyscore command lets you select exclusively or inclusively.
                    // Since we don't want to overlap and run our interval indexes twice, we
                    // add a '(' in the second instance to make it exclusive.
                    //
                    // http://redis.io/commands/zrangebyscore

                    goFrom = '(' + goFrom
                }

                ranges.push([goFrom, goTo])
            }

            // We create a redis hash to let us track the performance of this broadcast - each receiver
            // logs its end time, then when all are filled we can see the overall start to end time. 

            let multiSetArgs = [namespaces.performanceLogging(sns.MessageId), 'start_time', Date.now()];
            ranges.forEach((range, index) => {

                // We pre-fill these hash keys with -1 so that we can detect later whether all
                // the receivers have completed or not.

                multiSetArgs.push(`end_time_${index}`, -1);
            })
            return redisClient.hmset(multiSetArgs)
            .then(() => {
                let startBatch = Date.now();
                return PromiseTools.map(ranges, (range, i) => {
                    return SNS.publish('batch_broadcast', {
                        range: range,
                        broadcastIndex: i,
                        topicName: topicName,
                        originalMessage: sns
                    });
                }, ranges.length)
                .then((responses) => {
                    let timeTaken = Date.now() - startBatch;
                    console.info(`Sent ${responses.length} batches for processing.`)
                    return sendToSlack({
                        text: `Sent ${responses.length} batches for processing in ${timeTaken}ms.`
                    })
                })
            });
        })
        
    })
    
    
}