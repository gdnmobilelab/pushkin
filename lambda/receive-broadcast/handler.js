import BulkPublish from '../../lib/bulk-publish';

export function handler(event, context, cb) {
    
    let sns = event.Records[0].Sns;
    let parsedMessage = JSON.parse(sns.Message);
    console.log('received message', parsedMessage)
    BulkPublish.send(parsedMessage.topicName, parsedMessage.range, parsedMessage.originalMessage, parsedMessage.broadcastIndex)
    .then(() => {
        context.done(null);
    })
    .catch((err) => {
        context.done(err);
    })
   
};
