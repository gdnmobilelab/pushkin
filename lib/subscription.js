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

export default {
    add(topic, endpoint) {
        checkParameters([topic, endpoint], ['string', 'string']);

        // First we check if we already have subscribers for this topic.

        return redisClient.scardAsync(topic)
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
                // our new endpoint into Redis.

                return redisClient.saddAsync(topic, endpoint)
            })
            .then(() => {
                return true;
            })
    },
    remove(topic, endpoint) {
        checkParameters([topic, endpoint], ['string', 'string'])
        return redisClient.sremAsync(topic, endpoint)
        .then(() => true)
    }
}