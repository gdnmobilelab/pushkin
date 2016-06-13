import AWS from 'aws-sdk';
import {createArn, AWS_ACCOUNT_ID, createSNSTopic} from './arn';
import {withRedis} from './redis/client';
import namespaces from './redis/namespaces';

const callbackPromise = (func) => {
    return new Promise((fulfill, reject) => {
        let cb = (err, response) => {
            if (err) {
                return reject(err);
            }
            fulfill(response);
        }
        func(cb);
    })
    
}

const sns = new AWS.SNS({
    region: process.env.SERVERLESS_REGION
});

const lambda = new AWS.Lambda({
    region: process.env.SERVERLESS_REGION
});

// The path to our other Lambda function that listens to publish events. We have
// to manually construct this from the environment variables we have available.

const LISTENER_FUNC_PATH = ['function', process.env.SERVERLESS_PROJECT + '-listener', process.env.SERVERLESS_STAGE].join(':');

export default {
    addTopicSubscription(topic) {
       
        let functionArn = createArn('lambda', process.env.SERVERLESS_REGION, AWS_ACCOUNT_ID, LISTENER_FUNC_PATH);
        let topicArn = createSNSTopic(topic);
        return callbackPromise((cb) => {
            sns.subscribe({
                TopicArn: topicArn,
                Protocol: 'lambda',
                Endpoint: functionArn
            }, cb);
        })
        .catch((err) => {
            if (err.name === 'NotFound') {
                err.statusCode = 404;
            }
            throw err;
        })
        .then(({SubscriptionArn}) => {
            return withRedis((redisClient) => redisClient.set(namespaces.snsSubscription(topic), SubscriptionArn));
        })
        .then(() => {
            return new Promise((fulfill, reject) => {
                lambda.getPolicy({
                    FunctionName: functionArn,
                    Qualifier: process.env.SERVERLESS_STAGE
                }, (err, resp) => {
                    if (err) {
                        return reject(err);
                    }
                    
                    let parsedPolicy = JSON.parse(resp.Policy);
                    
                    let statementsForSNS = parsedPolicy.Statement.filter((statement) => statement.Principal.Service === "sns.amazonaws.com");
                    
                    
                    statementsForSNS.forEach((st) => {
                        try {
                            if (!st.Condition) {
                                // is wildcard
                                return fulfill(true);
                            }
                            if (st.Condition.ArnLike["AWS:SourceArn"] === topicArn) {
                                return fulfill(true);
                            }
                        } catch (err) {
                            console.error(err);
                        }
                    })
                    
                    return fulfill(false);
                })
                
            })
            .then((statementExists) => {
                if (statementExists) {
                    return true
                }
                // We also need to give the SNS topic permission to execute this lambda.
                return new Promise((fulfill, reject) => {
                    lambda.addPermission({
                        FunctionName: functionArn,
                        StatementId: Date.now().toString(),
                        Action: 'lambda:InvokeFunction',
                        Principal: 'sns.amazonaws.com',
                        Qualifier: process.env.SERVERLESS_STAGE
                    }, (err, resp) => {
                        if (err) {
                            return reject(err);
                        }
                        fulfill(resp);
                    })
                }) 
            })
            

        })
        .then((resp) => {
            console.info("SNS subscription created to topic: " + topic);
            return true;
        })
    },
    removeTopicSubscription(topic) {
        return withRedis((redisClient) => {
            return redisClient.get(namespaces.snsSubscription(topic))
            .then((arn) => {
                if (arn === null) {
                    throw new Error("Subscription ARN does not exist");
                }
                return callbackPromise((cb) => sns.unsubscribe({
                    SubscriptionArn: arn
                },cb))
            })
            .then(() => {
                return redisClient.del(namespaces.snsSubscription(topic))
            })
            .then((response) => {
                console.info("SNS subscription removed for topic: " + topic);
            })
        })
        
    },
    publish(topic, message) {
        return callbackPromise((cb) => sns.publish({
            TopicArn: createSNSTopic(topic),
            Message: JSON.stringify(message),
            //MessageStructure: typeof message === 'string' ? null : 'json'
        }, cb));
    }
}