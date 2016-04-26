import AWS from 'aws-sdk';
import {promisifyAll} from 'bluebird';
import {createArn, AWS_ACCOUNT_ID, createSNSTopic} from './arn';
import Redis from './redis/client';
import namespaces from './redis/namespaces';

const sns = promisifyAll(new AWS.SNS({
    region: process.env.SERVERLESS_REGION
}));

// The path to our other Lambda function that listens to publish events. We have
// to manually construct this from the environment variables we have available.

const LISTENER_FUNC_PATH = ['function', process.env.SERVERLESS_PROJECT + '-listener', process.env.SERVERLESS_STAGE].join(':');

export default {
    addTopicSubscription(topic) {
        return sns.subscribeAsync({
            TopicArn: createSNSTopic(topic),
            Protocol: 'lambda',
            Endpoint: createArn('lambda', process.env.SERVERLESS_REGION, AWS_ACCOUNT_ID, LISTENER_FUNC_PATH)
        })
        .then(({SubscriptionArn}) => {
            return Redis.setAsync(namespaces.snsSubscription(topic), SubscriptionArn);
        })
        .then(() => {
            console.info("SNS subscription created to topic: " + topic);
            return true;
        })
    },
    removeTopicSubscription(topic) {
        return Redis.getAsync(namespaces.snsSubscription(topic))
        .then((arn) => {
            if (arn === null) {
                throw new Error("Subscription ARN does not exist");
            }
            return sns.unsubscribeAsync({
                SubscriptionArn: arn
            })
        })
        .then(() => {
            return Redis.delAsync(namespaces.snsSubscription(topic))
        })
        .then((response) => {
            console.info("SNS subscription removed for topic: " + topic);
        })
    },
    publish(topic, message) {
        return sns.publishAsync({
            TopicArn: createSNSTopic(topic),
            Message: message,
            MessageStructure: typeof message === 'string' ? null : 'json'
        })
    }
}