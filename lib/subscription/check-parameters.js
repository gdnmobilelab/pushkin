import url from 'url';

export default function(topic, subscription) {

    if (typeof topic !== 'string' || topic.length === 0) {
        let err = new Error("You must provide a topic for the subscription");
        err.name = 'TopicRequired';
        throw err;
    }

    if (subscription.type === 'web') {
        let parsedUrl = url.parse(subscription.data.endpoint);
        if (parsedUrl.protocol !== 'https:' || parsedUrl.host === '') {
            let err = new Error("Endpoint must be a valid, HTTPS URL.");
            err.name = 'InvalidEndpoint';
            throw err;
        }

        if (!subscription.data.keys.p256dh || !subscription.data.keys.auth) {
            let err = new Error("Must provide both p256dh and auth keys (Chrome only, for now)");
            err.name = 'InvalidEndpoint';
            throw err;
        }
    } else {
        let err = new Error("Only support web notifications for now.");
        err.name = 'InvalidEndpoint';
        throw err;
    }
   
}