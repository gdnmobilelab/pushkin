import {createClient as createRedisClient} from '../../lib/redis/client';
import namespaces from '../../lib/redis/namespaces';
import {createDummySubscribers} from '../utils';
import crypto from 'crypto';
import urlBase64 from 'urlsafe-base64';
import BulkPublish from '../../lib/bulk-publish';
import nock from 'nock';
import should from 'should';

const userCurve = crypto.createECDH('prime256v1');
const userPublicKey = urlBase64.encode(userCurve.generateKeys());
const userAuth = urlBase64.encode(crypto.randomBytes(16));
const redisClient = createRedisClient();

describe("Bulk publisher", function() {

   
    beforeEach(() => {

    })

    afterEach(() => {
        nock.cleanAll();
    })

    it("Should publish to all endpoints", function() {

        let nockInstance = nock('https://subscription.local')
            .post(/endpoint\-/)
            .times(5)
            .reply(201, {
                ok: true
            });

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
        .then(() => {
            nockInstance.isDone().should.equal(true);
            return redisClient.hget(namespaces.performanceLogging('test-message'), 'end_time_0')
        })
        .then((redisResponse) => {
            parseInt(redisResponse,10).should.greaterThan(-1);

            // reset nock for the second round
            let nockInstance = nock('https://subscription.local')
                .post(/endpoint\-/)
                .times(5)
                .reply(201, {
                    ok: true
                });

            return BulkPublish.send(topic, [5,'(10'], {"test": "test"}, 1);
        })
        .then(() => {
            return redisClient.hgetall(namespaces.performanceLogging(topic));
        })
        .then((redisResponse) => {
            nockInstance.isDone().should.equal(true);
            should(redisResponse).be.null();
        })
    })
})