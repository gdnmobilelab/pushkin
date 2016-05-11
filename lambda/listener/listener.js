import Subscription from '../../lib/subscription';
import { getTopicNameFromArn } from '../../lib/arn';

export default (event, context, cb) => {
    Promise.resolve()
    .then(() => {
        // if (!event.Sns.Message['web-push']) {
        //     console.warn("Ignoring message as it has no web-push key", event.Sns.Message);
        //     return;
        // }
        let sns = event.Records[0].Sns;
        let topicName = getTopicNameFromArn(sns.TopicArn);
        console.info("Sending broadcast to " + topicName);
        return Subscription.broadcast(topicName, sns);
    })
    .then(() => {
        cb(null, true);
    })
    .catch((err) => {
        cb(err);
    })
}