import BulkPublish from '../../lib/bulk-publish';
require('source-map-support').install();
import notifyUnsubscribe from '../../lib/util/notify-unsubscribe';
import Notify from '../../lib/util/notify-activity';

export function handler(event, context, cb) {
    
    let sns = event.Records[0].Sns;
    let parsedMessage = JSON.parse(sns.Message);
    console.log('received message', parsedMessage);
    BulkPublish.send(parsedMessage.topicName, parsedMessage.range, parsedMessage.originalMessage, parsedMessage.broadcastIndex)
    .then((responses) => {
        //No needless lambda
        if (responses.failure.length) {
            return notifyUnsubscribe(responses.failure, parsedMessage.topicName)
                .then(() => {
                    return responses
                });
        } else {
            return Promise.resolve(responses);
            // context.done();
        }
    })
    .then((responses) => {
        return Notify.notifyNotificationSent(parsedMessage.topicName, responses).catch((err) => {
            console.log(err);
        });
    })
    .catch((err) => {
        cb(err);
        // context.done(err);
    })
   
};
