import redisClient from '../../lib/redis';
import Promise from 'bluebird';
import SNS from '../../lib/sns';
import Subscription from '../../lib/subscription';
import sinon from 'sinon';
import {expect} from 'chai';

describe.only('Subscription', function() {

    // stub out the SNS subscription functions

    before(() => {
        sinon.stub(SNS, 'addTopicSubscription').returns(true);
    })

    after(() => {
        SNS.addTopicSubscription.restore();
    })


    it('Adds users to topic subscription', function() {
        return Subscription.add('test-topic', 'test-endpoint')
        .then((response) => {
            expect(response).to.equal(true);
            return redisClient.sismemberAsync('test-topic', 'test-endpoint')
        })
        .then((redisResponse) => {
            expect(redisResponse).to.equal(1);
        });

    });

    it('Removes users from a topic subscription', function() {
        return redisClient.saddAsync('test-topic', 'test-endpoint')
        .then(() => {
            return Subscription.remove('test-topic', 'test-endpoint');
        })
        .then((response) => {
            expect(response).to.equal(true);
            return redisClient.sismemberAsync('test-topic', 'test-endpoint')
        })
        .then((redisResponse) => {
            expect(redisResponse).to.equal(0);
        })
    });
});
