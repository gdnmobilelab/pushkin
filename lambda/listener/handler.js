import Subscription from '../../lib/subscription';
import { getTopicNameFromArn } from '../../lib/arn';


export function handler(event, context, cb) {
    Promise.resolve()
    .then(() => {
        if (!event.Sns.Message['web-push']) {
            console.warn("Ignoring message as it has no web-push key", event.Sns.Message);
            return;
        }
        let topicName = getTopicNameFromArn(event.Sns.TopicArn);
    
        return Subscription.broadcast(topicName, event.Sns);
    })
    .then(() => {
        context.done(null)
    })
    .catch((err) => {
        context.done(err);
    })
}