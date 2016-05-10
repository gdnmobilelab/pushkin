import handler from '../../lambda/subscription/subscription.js';
import PromisifyLambda from 'promisify-aws-lambda';
import Subscription from '../../lib/subscription';
import {EXAMPLE_REQUEST} from '../fixtures/example_web_push_subscription';
import sinon from 'sinon';

describe('Subscription endpoints', function() {

    // stub out the SNS subscription functions

    before(() => {
        sinon.stub(Subscription, 'add').returns(Promise.resolve());
        sinon.stub(Subscription, 'remove').returns(Promise.resolve());

        // dummy IAM role
        process.env.IAM_ROLE = 'arn:aws:iam::000000001:role/pushy-testtest-r-IamRoleLambda-RANDOMCHARS';
    })

    after(() => {
        Subscription.add.restore();
        Subscription.remove.restore();
    })


    it('Calls the add subscription method', function() {

        return PromisifyLambda(handler, {
            action: 'add',
            topic: 'test-topic',
            subscription: EXAMPLE_REQUEST
        })
        .then((response) => {
            Subscription.add.calledWith('test-topic', EXAMPLE_REQUEST).should.equal(true);
            response.success.should.equal(true);
        });

    });

    it('Calls the remove subscription method', function() {

        return PromisifyLambda(handler, {
            action: 'remove',
            topic: 'test-topic',
            subscription: EXAMPLE_REQUEST
        })
        .then((response) => {
            Subscription.remove.calledWith('test-topic', EXAMPLE_REQUEST).should.equal(true);
            response.success.should.equal(true);
        });

    });
});
