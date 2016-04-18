import AWS from 'aws-sdk';
import Promise from 'bluebird';
import {createArn} from './arn';
import Redis from './redis';

const sns = Promise.promisifyAll(new AWS.SNS());

AWS.config.update({
    region: process.env.SERVERLESS_REGION
})

// Only way I could easily find to extract the current account ID without
// hard-coding it in a config

const AWS_ACCOUNT_ID = process.env.IAM_ROLE.split(':')[4];

// The path to our other Lambda function that listens to publish events. We have
// to manually construct this from the environment variables we have available.

const LISTENER_FUNC_PATH = ['function', process.env.SERVERLESS_PROJECT + '-listener', process.env.SERVERLESS_STAGE].join(':');

const namespaceTopicSubscriptionARN = (topic) => `sns_subscription_arn__${topic}`;

export default {
    addTopicSubscription(topic, awsConfig) {
        return sns.subscribeAsync({
            TopicArn: createArn('sns', process.env.SERVERLESS_REGION, AWS_ACCOUNT_ID, topic),
            Protocol: 'lambda',
            Endpoint: createArn('lambda', process.env.SERVERLESS_REGION, AWS_ACCOUNT_ID, LISTENER_FUNC_PATH)
        })
        .then(({SubscriptionArn}) => {
            return Redis.setAsync(namespaceTopicSubscriptionARN(topic), SubscriptionArn);
        })
        .then(() => {
            return true;
        })
        .catch((err) => {
            if (err.cause.message === 'Invalid parameter: TopicArn') {
                // This topic doesn't actually exist.
                return false;
            }
            // Otherwise it's another, unknown error.
            throw err;
        })
    },
    removeTopicSubscription(topic, awsConfig) {
        return Redis.getAsync(namespaceTopicSubscriptionARN(topic))
        .then((arn) => {
            if (arn === null) {
                throw new Error("Subscription ARN does not exist");
            }
            return sns.unsubscribeAsync({
                SubscriptionArn: arn
            })
        })
        .then((response) => {
            console.log('unsubscribe response', response);
        })
    }
}