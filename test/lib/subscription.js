import redisClient from '../../lib/redis';
import Promise from 'bluebird';
import SNS from '../../lib/sns';
import Subscription from '../../lib/subscription';
import sinon from 'sinon';

describe('Subscription', function() {

    // stub out the SNS subscription functions

    beforeEach(() => {
        sinon.stub(SNS, 'addTopicSubscription').returns(true);
        sinon.stub(SNS, 'removeTopicSubscription').returns(true);
    })

    afterEach(() => {
        SNS.addTopicSubscription.restore();
        SNS.removeTopicSubscription.restore();
    })


    it('Adds users to topic subscription', function() {
        return Subscription.add('test-topic', 'test-endpoint')
        .then((response) => {
            response.should.equal(true);
            return redisClient.sismemberAsync('topic_subscriptions__test-topic', 'test-endpoint')
        })
        .then((redisResponse) => {
            redisResponse.should.equal(1);
        });

    });

    it("Calls SNS subscription create when subscribing to new topic", function() {
        return Subscription.add('test-topic', 'test-endpoint')
        .then((response) => {
            SNS.addTopicSubscription.calledWith('test-topic').should.equal(true);
        });
    });

    it("Does not call SNS subscription create on existing topic", function() {
        return redisClient.saddAsync('topic_subscriptions__test-topic', 'test-endpoint-one')
        .then(function() {
            return Subscription.add('test-topic', 'test-endpoint-two')
        })
        .then((response) => {
            SNS.addTopicSubscription.calledOnce.should.equal(false);
        });
    })

    it('Removes users from a topic subscription', function() {
        // First add the entry we want to test removing.
        return redisClient.saddAsync('topic_subscriptions__test-topic', 'test-endpoint')
        .then(() => {
            return Subscription.remove('test-topic', 'test-endpoint');
        })
        .then((response) => {
            response.should.equal(true);
            return redisClient.sismemberAsync('topic_subscriptions__test-topic', 'test-endpoint')
        })
        .then((redisResponse) => {
            redisResponse.should.equal(0);
        })
    });

    it("Calls SNS unsubscribe when topic is empty", function() {
        // First add the entry we want to test removing.
        return redisClient.saddAsync('topic_subscriptions__test-topic', 'test-endpoint')
        .then(() => {
            return Subscription.remove('test-topic', 'test-endpoint');
        })
        .then((response) => {
            SNS.removeTopicSubscription.calledWith('test-topic').should.equal(true);
        })
    });

    it("Does not call SNS unsubscribe when topic is non-empty", function() {
        // First add the entry we want to test removing.
        return redisClient.saddAsync('topic_subscriptions__test-topic', ['test-endpoint-one', 'test-endpoint-two'])
        .then(() => {
            return Subscription.remove('test-topic', 'test-endpoint-two');
        })
        .then((response) => {
            SNS.removeTopicSubscription.calledOnce.should.equal(false);
        })
    })
});
