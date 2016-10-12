import checkParameters from './check-parameters';
import {withRedis} from '../redis/client';
import namespaces from '../redis/namespaces';
import SNS from '../sns';
import webPush from '../web-push';
import remove from './remove'
import Notify from '../util/notify-activity';


export default function(topic, subscription) {
    checkParameters(topic, subscription);
    let namespacedTopic = namespaces.topic(topic);
    return withRedis((redisClient) => {
        
        return redisClient.zcard(namespacedTopic)
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
            return redisClient.multi()
                .zadd(namespacedTopic, Date.now(), JSON.stringify(subscription.data))
                .sadd(namespaces.allTopicList(),namespacedTopic)
                .exec();
        })
    })
    .then(([zaddResponse, saddResponse]) => {
        // if zaddResponse is 0 then the user was already subscribed. 
        if (zaddResponse === 1) {
            console.info("Added new subscriber to:", namespacedTopic);
        } else {
            console.info("Already subscribed user requested to be added again. Ignoring.");
        }
        return zaddResponse === 1;
    })
    .then((newSubscriber) => {
        if (!subscription.confirmationNotification) {
            return newSubscriber;
        }

        console.log("Sending confirmation notification...");

        console.log(JSON.stringify(subscription));

        return webPush.sendNotification(subscription.data.endpoint, {
            payload: JSON.stringify(subscription.confirmationNotification),
            userPublicKey: subscription.data.keys.p256dh,
            userAuth: subscription.data.keys.auth
        })
        .catch((err) => {
            // If an error occurred we need to unsub
            console.log("Error sending confirmation...", err.toString(), Object.keys(err))
            console.log(JSON.stringify(err));
            return remove(topic, subscription)
            .then(() => {
                throw err;
            })
        })
    })
    .then((notification) => {
        Notify.notifySubscriptionAdd(topic, subscription).catch((err) => {
            console.log(err);
        });
        return notification;
    })
}