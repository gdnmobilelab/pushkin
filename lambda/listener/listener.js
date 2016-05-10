import Subscription from '../../lib/subscription';
import { getTopicNameFromArn } from '../../lib/arn';
import PromisifyLambda from '../../lib/util/promisify-lambda';

export default PromisifyLambda((event, context, cb) => {
    Promise.resolve()
    .then(() => {
        // if (!event.Sns.Message['web-push']) {
        //     console.warn("Ignoring message as it has no web-push key", event.Sns.Message);
        //     return;
        // }
        let sns = event.Records[0].Sns;
        let topicName = getTopicNameFromArn(sns.TopicArn);
    
        return Subscription.broadcast(topicName, sns);
    })
    .then(() => {
        context.done(null)
    })
    .catch((err) => {
        context.done(err);
    })
});