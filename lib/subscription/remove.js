import checkParameters from './check-parameters';
import {withRedis} from '../redis/client';
import namespaces from '../redis/namespaces';
import SNS from '../sns';

export default function(topic, subscription) {
    checkParameters(topic, subscription);

    let namespacedTopic = namespaces.topic(topic);

    return withRedis((redisClient) => {
        return redisClient.zrem(namespacedTopic, JSON.stringify(subscription.data))
        .then((numberRemoved) => {

            if (numberRemoved === 0) {

                // User actually wasn't subscribed in the first place, so
                // no need to do our SNS check.

                return false;
            }

            return redisClient.zcard(namespacedTopic)
            .then((numberOfSubscribers) => {

                if (numberOfSubscribers !== 0) {
                    return;
                }

                return SNS.removeTopicSubscription(topic)
                .then(() => {
                    return redisClient.srem(namespaces.allTopicList(), namespacedTopic);
                })
            })
            .then(() => {
                return true;
            })
        })
    }) 
}