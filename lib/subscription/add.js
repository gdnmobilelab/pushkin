import checkParameters from './check-parameters';
import redisClient from '../redis/client';
import namespaces from '../redis/namespaces';
import SNS from '../sns';

export default function(topic, subscription) {
    checkParameters(topic, subscription);

    let namespacedTopic = namespaces.topic(topic);

    return redisClient.zcardAsync(namespacedTopic)
    .then((numberOfSubscribers) => {
        
        if (numberOfSubscribers === 0) {

            // If there are no existing subscribers then we need to set up
            // an SNS subscription internally, so that we receive push events
            // along with native apps.

            return SNS.addTopicSubscription(topic);
        }
    }) 
    .then(() => {

        // Now that we've guaranteed we have SNS subscriptions, we can push
        // our new endpoint into Redis. We're using a sorted set to allow us to
        // later get a range of subscribers rather than all at once. Using the
        // current timestamp as the score, so that when that batching process
        // occurs we don't end up out of order.

        return redisClient.zaddAsync([namespacedTopic, Date.now(), JSON.stringify(subscription)])
    })
    .then((numAdded) => {

        // if numAdded is 0 then the user was already subscribed. 
        return numAdded === 1;
    })
}