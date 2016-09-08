import BulkPublish from '../../lib/bulk-publish';
require('source-map-support').install();
import notifyUnsubscribe from '../../lib/util/notify-unsubscribe';
import {withMysql} from '../../lib/mysql/client';

export function handler(event, context, cb) {
    
    let sns = event.Records[0].Sns;
    let parsedMessage = JSON.parse(sns.Message);
    console.log('received message', parsedMessage);
    BulkPublish.send(parsedMessage.topicName, parsedMessage.range, parsedMessage.originalMessage, parsedMessage.broadcastIndex)
    .then((responses) => {
        return withMysql((mysqlClient) => {
            return new Promise((resolve, reject) => {
                console.log('Adding notification log');
                mysqlClient.query({
                        sql: 'call p_CreateNotificationLog(?, ?, ?, ?)',
                        values: [
                                    parsedMessage.topicName,
                                    responses.success.length + responses.failure.length,
                                    responses.failure.filter((f) => f.error.message === 'NotRegistered').length,
                                    responses.failure.filter((f) => f.error.message === 'InternalServerError').length,
                                ]
                    },
                    function(err, result) {
                        console.log('Result of call to p_CreateNotificationLog');
                        if (err) {
                            console.log('There was an error with the request');
                            console.log(err.code);
                            reject(new Error(err.code));
                        } else {
                            console.log('p_CreateNotificationLog was successful');
                            resolve(result);
                        }
                    });
            });
        }).then(() => {
            return responses;
        }).catch((err) => {
            console.log(err);
            return responses;
        });
    }).then((responses) => {
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
