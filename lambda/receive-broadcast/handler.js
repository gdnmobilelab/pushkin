import BulkPublish from '../../lib/bulk-publish';
require('source-map-support').install();
import notifyUnsubscribe from '../../lib/util/notify-unsubscribe';

export function handler(event, context, cb) {
    
    let sns = event.Records[0].Sns;
    let parsedMessage = JSON.parse(sns.Message);
    console.log('received message', parsedMessage);
    BulkPublish.send(parsedMessage.topicName, parsedMessage.range, parsedMessage.originalMessage, parsedMessage.broadcastIndex)
    .then((responses) => {
        //No needless lambda
        if (responses.failure.length) {
            notifyUnsubscribe(responses.failure, parsedMessage.topicName).then(() => {
                context.done(null);
            }).catch((err) => {
                context.done(err);
            });
        } else {
            context.done();
        }
    })
    .catch((err) => {
        context.done(err);
    })
   
};
