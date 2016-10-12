import PromiseTools from 'promise-tools';
import {withMysql} from '../../lib/mysql/client';


function logSubscribe(topic, subscription) {
    return withMysql((mysqlClient) => {
        return new Promise((resolve, reject) => {
            console.log('Adding user to topic');
            mysqlClient.query({
                    sql: 'call p_AddUserToTopic(?, ?, ?)',
                    values: [subscription.data.endpoint, JSON.stringify(subscription.data), topic],
                    timeout: 3000
                },
                function(err, result) {
                    console.log('Result of call to p_AddUserToTopic');
                    if (err) {
                        console.log('There was an error with the request');
                        console.log(err.code);
                        reject(new Error(err.code));
                    } else {
                        console.log('p_AddUserToTopic was successful');
                        resolve(result);
                    }
                });
        });
    })
    .catch((err) => {
        console.log('MySQL error');
        console.log(err.code);
    });
}

function logUnsubscribe(topic, subscription) {
    return withMysql((mysqlClient) => {
        return new Promise((resolve, reject) => {
            mysqlClient.query({
                    sql: 'call p_RemoveUserFromTopic(?, ?)',
                    values: [subscription.data.endpoint, topic],
                    timeout: 3000
                },
                function(err, result) {
                    console.log('Result of call to p_RemoveUserFromTopic');
                    if (err) {
                        console.log('There was an error with the request');
                        console.log(err.code);
                        reject(new Error(err.code));
                    } else {
                        console.log('p_RemoveUserFromTopic was successful');
                        resolve(result);
                    }
                });
        });
    })
    .catch((err) => {
        console.error(err);
    });
}

function logBatchUnsubscribe(subscriptions) {
    return withMysql((mysqlClient) => {
        //Maybe eventually batch this
        return PromiseTools.map(subscriptions, (subscription) => {
            return new Promise((resolve, reject) => {
                mysqlClient.query({
                        sql: 'call p_MarkUserNotRegistered(?)',
                        values: [subscription.endpoint],
                        timeout: 3000
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
}

function logNotificationSent(topicName, responses) {
    return withMysql((mysqlClient) => {
        return new Promise((resolve, reject) => {
            console.log('Adding notification log');
            mysqlClient.query({
                    sql: 'call p_CreateNotificationLog(?, ?, ?, ?)',
                    values: [
                        topicName,
                        responses.success.length + responses.failure.length,
                        responses.failure.filter((f) => f.error.message === 'NotRegistered').length,
                        responses.failure.filter((f) => f.error.message === 'InternalServerError').length,
                    ],
                    timeout: 3000
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
}

export default (event, context, cb) => {
    let sns = event.Records[0].Sns;
    let parsedMessage = JSON.parse(sns.Message);
    console.log('received activity notification', parsedMessage);

    var logged;
    switch (parsedMessage.activity) {
        case 'SUBSCRIBE':
            logged = logSubscribe(parsedMessage.topic, parsedMessage.subscription);
            break;
        case 'UNSUBSCRIBE':
            logged = logUnsubscribe(parsedMessage.topic, parsedMessage.subscription);
            break;
        case 'BATCH_UNSUBSCRIBE':
            logged = logBatchUnsubscribe(parsedMessage.subscriptions);
            break;
        case 'NOTIFICATION_SENT':
            logged = logNotificationSent(parsedMessage.topic, parsedMessage.responses);
            break;
    }
}
