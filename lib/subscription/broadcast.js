import redisClient from '../redis/client';
import namespaces from '../redis/namespaces';
import SNS from '../sns';

export default function(topic, message) {
    let namespacedTopic = namespaces.topic(topic);

    /*
        This is where Redis sorted sets become very useful. We can batch our workload not
        by index but by score - which doesn't change if someone unsubscribes in the middle 
        of the run.
    */

    const pushesPerBatch = 200 // ?!?!

    return redisClient.zcount(namespacedTopic, "-inf", "+inf")
    .then((numberOfSubscribers) => {

        let batches = [0];

        for (let i = 0; i <= numberOfSubscribers; i++) {

            // effectively we're rounding up here to make sure our last
            // batch covers the remainder

            batches.push(i + pushesPerBatch)
        }

    })
}