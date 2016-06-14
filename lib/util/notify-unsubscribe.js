import SNS from '../../lib/sns';

export default function(failures, topic) {
    let notRegistered = failures.reduce((coll, f) => {
        if (f.error.message == 'NotRegistered') {
            coll.push(f.subscription);
        }

        return coll;
    }, []);

    console.log('Sending unsubscribe notification: ', process.env.BATCH_UNSUBSCRIBE_TOPIC, JSON.stringify({topic: topic, subscriptions: notRegistered}));
    return SNS.publish(process.env.BATCH_UNSUBSCRIBE_TOPIC, {topic: topic, subscriptions: notRegistered});
}