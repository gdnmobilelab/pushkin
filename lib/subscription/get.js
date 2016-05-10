import {withRedis} from '../redis/client';
import namespaces from '../redis/namespaces';

export default function(subscription) {
    
    // The string we will have actually stored in Redis.
    let subscriptionStored = JSON.stringify(subscription.data);
    
    return withRedis((redisClient) => {
        if (subscription.type !== 'web') {
            let err = new Error("Only web notifications currently supported");
            err.name = 'InvalidProtocol';
            throw err;
        }
        
        return redisClient.smembers(namespaces.allTopicList())
        .then((topics) => {
            
            // Take each of our topics and check if our subscription object
            // is in them.
            
            let multi = redisClient.multi();
            for (let topic of topics) {
                multi.zrank(topic, subscriptionStored);
            }
            return multi.exec()
            .then((subscriptions) => {
                
                let subscribedTopics = topics.filter((t, idx) => {
                    // if an entry does not appear in a sorted set zrank returns null
                    return subscriptions[idx] !== null
                })
                
                return subscribedTopics.map(namespaces.extract);
            })
        })
    });
    
}