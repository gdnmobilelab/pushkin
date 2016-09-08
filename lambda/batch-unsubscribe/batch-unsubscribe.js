import PromiseTools from 'promise-tools';
import Subscription from '../../lib/subscription';
import sendToSlack from '../../lib/util/send-to-slack';
import {withMysql} from '../../lib/mysql/client';


export default (event, context, cb) => {
    let sns = event.Records[0].Sns;
    let parsedMessage = JSON.parse(sns.Message);
    console.log('received batch unsubscribe', parsedMessage);

    PromiseTools.map(parsedMessage.subscriptions, (subscription) => {
        return Subscription.remove(parsedMessage.topic, {
            type: 'web',
            data: subscription
        });
    }).then((removed) => {

        let slackMsg = {
            text: `Removed ${removed.length} NotRegistered subscribers`
        };

        return sendToSlack(slackMsg)
            .then(() => {
                return withMysql((mysqlClient) => {
                    //Maybe eventually batch this
                    return PromiseTools.map(parsedMessage.subscriptions, (subscription) => {
                        return new Promise((resolve, reject) => {
                            mysqlClient.query({
                                    sql: 'call p_MarkUserNotRegistered(?)',
                                    values: [subscription.endpoint]
                                },
                                function (err, result) {
                                    console.log('Result of call to p_MarkUserNotRegistered');
                                    if (err) {
                                        console.log('There was an error with the request');
                                        console.log(err.code);
                                        reject(new Error('I am an error!'));
                                    } else {
                                        console.log('p_MarkUserNotRegistered was successful');
                                        resolve(result);
                                    }
                                });
                            })
                    })
                });
            });

    }).then(() => {
        context.done(null)
    }).catch((err) => {
        context.done(err);
    })
}
