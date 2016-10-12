import SNS from '../../lib/sns';


function notify(payload) {
    return SNS.publish(process.env.ACTIVITY_LOGGER_TOPIC, payload).then((data) => {
        console.log('Sent activity notification successfully to topic: ' + process.env.ACTIVITY_LOGGER_TOPIC);
        console.log('Payload sent to activity notification: ' + JSON.stringify(payload));
    }).catch((err) => {
        console.log('There was an error sending an activity notification');
        console.log(err);
    })
}

export default {
    notifySubscriptionAdd: function(topic, subscription) {
        console.log('Sending subscription to be logged');
        return notify({
            activity: 'SUBSCRIBE',
            topic: topic,
            subscription: subscription
        });
    },

    notifySubscriptionRemove: function(topic, subscription) {
        return notify({
            activity: 'UNSUBSCRIBE',
            topic: topic,
            subscription: subscription
        });
    },

    notifyBatchUnsubscribe: function(subscriptions) {
        return notify({
            activity: 'BATCH_UNSUBSCRIBE',
            subscriptions: subscriptions
        });
    },

    notifyNotificationSent: function(topic, responses) {
        return notify({
            activity: 'NOTIFICATION_SENT',
            topic: topic,
            responses: responses
        });
    }
}