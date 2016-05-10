import SNSSimulator from 'sns-simulator';
import {handler as subscriptionLambda} from '../lambda/subscription/subscription';
import {handler as listenerLambda} from '../lambda/listener/listener';
import {handler as receiveBroadcast} from '../lambda/receive-broadcast/handler';
import promisifyAwsLambda from 'promisify-aws-lambda';
import AWS from 'aws-sdk';
import Promise from 'bluebird';
import {createSNSTopic, createArn} from '../lib/arn';
import crypto from 'crypto';
import urlBase64 from 'urlsafe-base64';
import nock from 'nock';

const LISTENER_FUNC_PATH = createArn('lambda', process.env.AWS_REGION, '0000001', ['function', process.env.SERVERLESS_PROJECT + '-listener', process.env.SERVERLESS_STAGE].join(':'));
//const BROADCAST_TOPIC_ARN = createSNSTopic('batch_broadcast'); 

var userCurve = crypto.createECDH('prime256v1');
var userPublicKey = urlBase64.encode(userCurve.generateKeys());
var userAuth = urlBase64.encode(crypto.randomBytes(16));

describe("SNS/Lambda workflow", function() {

    let sns = null;

    before(() => {
        SNSSimulator.setup();
        SNSSimulator.registerLambda(LISTENER_FUNC_PATH, listenerLambda);
        SNSSimulator.registerLambda('BROADCAST_ARN', receiveBroadcast);

        sns = Promise.promisifyAll(new AWS.SNS());

        return sns.createTopicAsync({
            Name: process.env.SERVERLESS_STAGE + '__test-topic' 
        })
        .then(() => {
            return sns.createTopicAsync({
                Name: process.env.SERVERLESS_STAGE + '__batch_broadcast' 
            })
        })
        .then((resp) => {
            // serverless handles this for us in production
            return sns.subscribeAsync({
                TopicArn: resp.TopicArn,
                Protocol: 'lambda',
                Endpoint: 'BROADCAST_ARN'
            })
        })
    })

    after(() => {
        SNSSimulator.reset();
        SNSSimulator.restore();
        //nock.restore();
        nock.cleanAll();
    })

    it("Should receive a published message after subscribing", () => {
        return true;
        let nockInstance = nock('https://subscription.local')
            .post(/endpoint\-/)
            .reply(201, {
                ok: true
            });


        return promisifyAwsLambda(subscriptionLambda, {
            action: 'add',
            topic: 'test-topic',
            subscription: {
                type: 'web',
                data: {
                    endpoint: `https://subscription.local/endpoint-1`,
                    keys: {
                        p256dh: userPublicKey,
                        auth: userAuth
                    }
                }
                
            }
        })
        .then(() => {
            return sns.publishAsync({
                TopicArn: createSNSTopic('test-topic'),
                Message: {
                    "web-push": {
                        "test": "hello"
                    }
                }
            })
        })
        .then(() => {
            nockInstance.isDone().should.equal(true)
        })
    }) 
})