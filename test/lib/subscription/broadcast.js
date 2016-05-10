import {createClient as createRedisClient} from '../../../lib/redis/client';
import SNS from '../../../lib/sns';
import Subscription from '../../../lib/subscription';
import sinon from 'sinon';
import {EXAMPLE_REQUEST} from '../../fixtures/example_web_push_subscription';
import should from 'should';
import Promise from 'bluebird';
import namespaces from '../../../lib/redis/namespaces';
import {createDummySubscribers} from '../../utils';

const redisClient = createRedisClient();

describe('Subscription/broadcast', function() {

    beforeEach(() => {
        sinon.stub(SNS, 'publish').returns(true);
    })

    afterEach(() => {
        SNS.publish.restore();
    })


    it("Only calls SNS publish once if subscribers is < batch number", () => {
        let topic = 'dummy-topic'
        let namespacedTopic = namespaces.topic(topic);
        
        return createDummySubscribers(redisClient, {
            topic: namespacedTopic,
            number: 50
        })
        .then(() => {
            return Subscription.broadcast(topic, {test: 'test', MessageId: 'test-id'})
        })
        .then(() => {
             SNS.publish.calledOnce.should.equal(true);
             SNS.publish.calledWith('batch_broadcast', sinon.match({
                range: ['-inf', '+inf'],
                broadcastIndex: 0,
                originalMessage: {test: 'test', MessageId: 'test-id'}
             })).should.equal(true)
        })
    })

    it("Calls SNS publish the correct number of times for batching", () => {
        let topic = 'dummy-topic'
        let namespacedTopic = namespaces.topic(topic);
        
        return createDummySubscribers(redisClient, {
            topic: namespacedTopic,
            number: 450
        })
        .then(() => {
            return Subscription.broadcast(topic, {test: 'test', MessageId: 'test-id'})
        })
        .then(() => {
             SNS.publish.callCount.should.equal(3);

             SNS.publish.calledWith('batch_broadcast', sinon.match({
                range: ['-inf', '600'],
                broadcastIndex: 0,
                originalMessage: {test: 'test', MessageId: 'test-id'}
             })).should.equal(true);

             SNS.publish.calledWith('batch_broadcast', sinon.match({
                range: ['(600', '1200'],
                broadcastIndex: 1,
                originalMessage: {test: 'test', MessageId: 'test-id'}
             })).should.equal(true)

             SNS.publish.calledWith('batch_broadcast', sinon.match({
                range: ['(1200', '+inf'],
                broadcastIndex: 2,
                originalMessage: {test: 'test', MessageId: 'test-id'}
             })).should.equal(true)

             return redisClient.hgetall(namespaces.performanceLogging('test-id'))
        })
        .then((redisResponse) => {
            parseInt(redisResponse.start_time).should.be.greaterThan(0); // is Date.now(), so, variable
            redisResponse.end_time_0.should.equal('-1');
            redisResponse.end_time_1.should.equal('-1');
            redisResponse.end_time_2.should.equal('-1');
        })
    })
});