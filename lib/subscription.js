import redisClient from './redis';
import SNS from './sns';

const checkParameters = function(parameters, types) {
    parameters.forEach((p, i) => {
        if (typeof p !== types[i]) {
            throw new Error(`Expected ${types[i]}, got ${p}.`);
        }
    });
    return true;
}

// We "namespace" this so that we can use the Redis KEYS command to get
// all of our subscriptions.
const namespaceTopic = (topic) => `topic_subscriptions__${topic}`;

export default {
    add(topic, endpoint) {
        checkParameters([topic, endpoint], ['string', 'string']);

        let namespacedTopic = namespaceTopic(topic);

        // First we check if we already have subscribers for this topic.

        return redisClient.scardAsync(namespacedTopic)
            .then((numberOfSubscribers) => {
                
                if (numberOfSubscribers === 0) {

                    // If there are no existing subscribers then we need to set up
                    // an SNS subscription internally, so that we receive push events
                    // along with native apps.

                    return SNS.addTopicSubscription(topic);
                }
            }) 
            .then((topicExists) => {
                
                if (topicExists === false) {
                    let err = new Error("Topic does not exist.");
                    err.code = 'TOPIC_DOES_NOT_EXIST'
                    throw err;
                }

                // Now that we've guaranteed we have SNS subscriptions, we can push
                // our new endpoint into Redis.

                return redisClient.saddAsync(namespacedTopic, endpoint)
            })
            .then((numAdded) => {

                // if numAdded is 0 then the user was already subscribed. 

                return numAdded === 1;
            })
    },
    remove(topic, endpoint) {
        checkParameters([topic, endpoint], ['string', 'string']);

        let namespacedTopic = namespaceTopic(topic);

        return redisClient.sremAsync(namespacedTopic, endpoint)
            .then((numberRemoved) => {

                if (numberRemoved === 0) {

                    // User actually wasn't subscribed in the first place, so
                    // no need to do our SNS check.

                    return false;
                }

                return redisClient.scardAsync(namespacedTopic)
                .then((numberOfSubscribers) => {

                    if (numberOfSubscribers !== 0) {
                        return;
                    }
    
                    return SNS.removeTopicSubscription(topic);

                })
                .then(() => {
                    return true;
                })
            })
    }
}