import {createClient as createRedisClient} from '../../../lib/redis/client';
import namespaces from '../../../lib/redis/namespaces';
import SNS from '../../../lib/sns';
import Subscription from '../../../lib/subscription';
import sinon from 'sinon';
import {EXAMPLE_REQUEST, BROWSER_SUBSCRIPTION_OBJECT} from '../../fixtures/example_web_push_subscription';
import should from 'should';

const redisClient = createRedisClient();

describe('Subscription/remove', function() {

    // stub out the SNS subscription functions

    beforeEach(() => {
        sinon.stub(SNS, 'removeTopicSubscription').returns(Promise.resolve());
    })

    afterEach(() => {
        SNS.removeTopicSubscription.restore();
    })


    it('Removes users from a topic subscription', function() {
        // First add the entry we want to test removing.
        return redisClient.zadd(['topic:subscriptions::test-topic', 1, JSON.stringify(BROWSER_SUBSCRIPTION_OBJECT)])
        .then(() => {
            return Subscription.remove('test-topic', EXAMPLE_REQUEST);
        })
        .then((response) => {
            response.should.equal(true);
            let multi = redisClient.multi();
            multi.zscore('topic:subscriptions::test-topic', JSON.stringify(EXAMPLE_REQUEST));
            multi.sismember(namespaces.allTopicList(), 'topic:subscriptions::test-topic');
            return multi.exec();
        })
        .then(([zscoreResponse, sismemberResponse]) => {
            should.equal(null, zscoreResponse);
            sismemberResponse.should.equal(0);
        })
    });

    it("Calls SNS unsubscribe when topic is empty", function() {
        // First add the entry we want to test removing.
        return redisClient.zadd(['topic:subscriptions::test-topic', 1, JSON.stringify(BROWSER_SUBSCRIPTION_OBJECT)])
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
        return redisClient.zadd('topic:subscriptions::test-topic', 1, JSON.stringify(BROWSER_SUBSCRIPTION_OBJECT), 2, JSON.stringify(newExample.data))
        .then((numAdded) => {
            return Subscription.remove('test-topic', newExample);
        })
        .then((response) => {
            SNS.removeTopicSubscription.calledOnce.should.equal(false);
        })
    })

});
