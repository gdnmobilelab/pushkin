import {createClient as createRedisClient} from '../../lib/redis/client';
import namespaces from '../../lib/redis/namespaces';
import {createDummySubscribers} from '../utils';
import crypto from 'crypto';
import urlBase64 from 'urlsafe-base64';
import BulkPublish from '../../lib/bulk-publish';
import nock from 'nock';
import should from 'should';
import webPush from 'web-push';
import sinon from 'sinon';

const userCurve = crypto.createECDH('prime256v1');
const userPublicKey = urlBase64.encode(userCurve.generateKeys());
const userAuth = urlBase64.encode(crypto.randomBytes(16));
const redisClient = createRedisClient();

const addEndpointToNock = function(nockInstance, endpoint) {
    return nockInstance
        .post(endpoint)
        .reply(201, {
            "multicast_id": 5818568061551720000,
            "success": 1,
            "failure": 0,
            "canonical_ids": 0,
            "results": [
                {
                    "message_id": "0:1463159425177924%b5e11c9ef9fd7ecd"
                }
            ]
        });
}

describe.only("Bulk publisher", function() {

   
    beforeEach(() => {
        
    })

    afterEach(() => {
        nock.cleanAll();
    })

    it("Should publish to all endpoints", function() {

        let nockInstance = nock('https://subscription.local');
        
        [0,1,2,3,4].forEach((i) => {
            addEndpointToNock(nockInstance, "/endpoint-" + i);
        })

        let topic = 'dummy-topic'
        let namespacedTopic = namespaces.topic(topic);
        let hmsetArgs = [
            namespaces.performanceLogging('test-message'),
            'start_time',
            Date.now(),
            'end_time_0',
            -1,
            'end_time_1',
            -1
        ];
        
        return redisClient.hmset(hmsetArgs)
        .then(() => {
            return createDummySubscribers(redisClient, {
                topic: namespacedTopic,
                number: 10,
                scoreGenerator: (i) => i,
                subscriptionGenerator: (i) => {
                    return JSON.stringify({
                        endpoint: `https://subscription.local/endpoint-${i}`,
                        keys: {
                            p256dh: userPublicKey,
                            auth: userAuth
                        }
                    })
                }
            })
        }) 
        .then(() => {
            return BulkPublish.send(topic, [0,'(5'], {"Message": "hello", "MessageId": "test-message"}, 0);
        })
        .then((sendResult) => {
            sendResult.failure.length.should.equal(0);
            nockInstance.isDone().should.equal(true);
            return redisClient.hget(namespaces.performanceLogging('test-message'), 'end_time_0')
        })
        .then((redisResponse) => {
            parseInt(redisResponse,10).should.greaterThan(-1);

            // reset nock for the second round
            nockInstance = nock('https://subscription.local')
            
            let idxes = [5,6,7,8,9];
            idxes.forEach((i) => {
                addEndpointToNock(nockInstance, "/endpoint-" + i);
            })    

            return BulkPublish.send(topic, [5,'(10'], {"Message": "hello", "MessageId": "test-message"}, 1);
        })
        .then((sendResult) => {
            sendResult.failure.length.should.equal(0);
            return redisClient.hgetall(namespaces.performanceLogging(topic));
        })
        .then((redisResponse) => {
            nockInstance.done();
            should(redisResponse).be.null();
        })
    })
    
    it.only("should allow a single request to fail while other succeed", () => {
        let nockInstance = nock('https://subscription.local');
        
        [0,2,3,4].forEach((i) => {
            addEndpointToNock(nockInstance, "/endpoint-" + i);
        });
        
        let topic = 'dummy-topic'
        let namespacedTopic = namespaces.topic(topic);
        
        return createDummySubscribers(redisClient, {
            topic: namespacedTopic,
            number: 5,
            scoreGenerator: (i) => i * 1000,
            subscriptionGenerator: (i) => {
                return JSON.stringify({
                    endpoint: `https://subscription.local/endpoint-${i}`,
                    keys: {
                        p256dh: userPublicKey,
                        auth: userAuth
                    }
                })
            }
        })
        .then(() => {
            return BulkPublish.send(topic, ['-inf','+inf'], {"Message": "hello", "MessageId": "test-message"}, 0);
        })
        .then((sendResults) => {

            sendResults.failure.length.should.equal(1);
            sendResults.success.length.should.equal(4);
            return redisClient.lrange(namespaces.failedSendList(topic, "test-message"), 0, -1)
        })
        .then((redisResponse) => {
            redisResponse.length.should.equal(1);
            JSON.parse(redisResponse[0]).id.should.equal('1000');
        })
    })
})