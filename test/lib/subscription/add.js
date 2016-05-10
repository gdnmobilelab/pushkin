import {createClient as createRedisClient} from '../../../lib/redis/client';
import namespaces from '../../../lib/redis/namespaces';
import SNS from '../../../lib/sns';
import Subscription from '../../../lib/subscription';
import sinon from 'sinon';
import {EXAMPLE_REQUEST} from '../../fixtures/example_web_push_subscription';
import should from 'should';

const redisClient = createRedisClient();

describe('Subscription/add', function() {

    // stub out the SNS subscription functions

    beforeEach(() => {
        sinon.stub(SNS, 'addTopicSubscription').returns(Promise.resolve(true));
    })

    afterEach(() => {
        SNS.addTopicSubscription.restore();
    })


    it('Adds users to topic subscription', function() {
        return Subscription.add('test-topic', EXAMPLE_REQUEST)
        .then((response) => {
            response.should.equal(true);
            
            let multi = redisClient.multi();
            multi.zscore('topic:subscriptions::test-topic', JSON.stringify(EXAMPLE_REQUEST.data));
            multi.sismember(namespaces.allTopicList(), 'topic:subscriptions::test-topic')
            return multi.exec();
            
        })
        .then(([zscoreResponse, sismemberResponse]) => {
            should(zscoreResponse).not.be.null();
            sismemberResponse.should.equal(1);
            // Sanity check so we know it does return differently if not exist
            return redisClient.zscore('topic:subscriptions::test-topic', "SHOULD NOT EXIST")
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

        return redisClient.zadd(['topic:subscriptions::test-topic', 1, JSON.stringify(EXAMPLE_REQUEST)])
        .then(function() {
            return Subscription.add('test-topic', newExample)
        })
        .then((response) => {
            SNS.addTopicSubscription.calledOnce.should.equal(false);
        });
    })

})