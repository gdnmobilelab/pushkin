import redisClient from '../../lib/redis/client';
import SNS from '../../lib/sns';
import Subscription from '../../lib/subscription';
import sinon from 'sinon';
import {EXAMPLE_REQUEST} from '../fixtures/example_web_push_subscription';
import should from 'should';

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
        return Subscription.add('test-topic', EXAMPLE_REQUEST)
        .then((response) => {
            response.should.equal(true);
            return redisClient.zscoreAsync('topic:subscriptions::test-topic', JSON.stringify(EXAMPLE_REQUEST))
        })
        .then((redisResponse) => {
            redisResponse.should.not.be.null();

            // Sanity check so we know it does return differently if not exist
            return redisClient.zscoreAsync('topic:subscriptions::test-topic', "SHOULD NOT EXIST")
        })
        .then((redisResponse) => {
            should.equal(null, redisResponse);
        })

    });

    it("Calls SNS subscription create when subscribing to new topic", function() {
        return Subscription.add('test-topic', EXAMPLE_REQUEST)
        .then((response) => {
            SNS.addTopicSubscription.calledWith('test-topic').should.equal(true);
        });
    });

    it("Does not call SNS subscription create on existing topic", function() {

        let newExample = JSON.parse(JSON.stringify(EXAMPLE_REQUEST))
        newExample.data.endpoint = 'https://blah.blah';

        return redisClient.zaddAsync(['topic:subscriptions::test-topic', 1, JSON.stringify(EXAMPLE_REQUEST)])
        .then(function() {
            return Subscription.add('test-topic', newExample)
        })
        .then((response) => {
            SNS.addTopicSubscription.calledOnce.should.equal(false);
        });
    })

    it('Removes users from a topic subscription', function() {
        // First add the entry we want to test removing.
        return redisClient.zaddAsync(['topic:subscriptions::test-topic', 1, JSON.stringify(EXAMPLE_REQUEST)])
        .then(() => {
            return Subscription.remove('test-topic', EXAMPLE_REQUEST);
        })
        .then((response) => {
            response.should.equal(true);
            return redisClient.zscoreAsync('topic:subscriptions::test-topic', JSON.stringify(EXAMPLE_REQUEST))
        })
        .then((redisResponse) => {
            should.equal(null, redisResponse);
        })
    });

    it("Calls SNS unsubscribe when topic is empty", function() {
        // First add the entry we want to test removing.
        return redisClient.zaddAsync(['topic:subscriptions::test-topic', 1, JSON.stringify(EXAMPLE_REQUEST)])
        .then(() => {
            return Subscription.remove('test-topic', EXAMPLE_REQUEST);
        })
        .then((response) => {
            SNS.removeTopicSubscription.calledWith('test-topic').should.equal(true);
        })
    });

    it("Does not call SNS unsubscribe when topic is non-empty", function() {

        let newExample = JSON.parse(JSON.stringify(EXAMPLE_REQUEST))
        newExample.data.endpoint = 'https://blah.blah';

        // First add the entry we want to test removing.
        return redisClient.zaddAsync('topic:subscriptions::test-topic', 1, JSON.stringify(EXAMPLE_REQUEST), 2, JSON.stringify(newExample))
        .then((numAdded) => {
            return Subscription.remove('test-topic', newExample);
        })
        .then((response) => {
            SNS.removeTopicSubscription.calledOnce.should.equal(false);
        })
    })
});
