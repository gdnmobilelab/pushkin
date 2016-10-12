import checkParameters from './check-parameters';
import {withRedis} from '../redis/client';
import namespaces from '../redis/namespaces';
import SNS from '../sns';
import Notify from '../util/notify-activity';

export default function(topic, subscription) {
    checkParameters(topic, subscription);

    let namespacedTopic = namespaces.topic(topic);

    return withRedis((redisClient) => {
        return redisClient.zrem(namespacedTopic, JSON.stringify(subscription.data))
        .then((numberRemoved) => {

            if (numberRemoved === 0) {
                
                console.info("User was not subscribed - doing nothing");
                // User actually wasn't subscribed in the first place, so
                // no need to do our SNS check.

                return false;
            }
            
            console.info("Removed user subscription to", topic);

            return redisClient.zcard(namespacedTopic)
            .then((numberOfSubscribers) => {

                if (numberOfSubscribers !== 0) {
                    return;
                }
                
                console.info("No subscribers left for this topic - removing SNS subscription");

                return SNS.removeTopicSubscription(topic)
                .then(() => {
                    return redisClient.srem(namespaces.allTopicList(), namespacedTopic);
                })
            })
            .then(() => {
                return true;
            })
        })
        .then((removed) => {
            Notify.notifySubscriptionRemove(topic, subscription).catch((err) => {
                console.log(err);
            });
            return removed;
        })
    }) 
}