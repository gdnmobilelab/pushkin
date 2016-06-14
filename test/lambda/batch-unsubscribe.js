import handler from '../../lambda/batch-unsubscribe/batch-unsubscribe.js';
import PromisifyLambda from 'promisify-aws-lambda';
import {EXAMPLE_REQUEST} from '../fixtures/example_batch_unsubscribe';
import sinon from 'sinon';

describe('Batch Unsubscribe endpoints', function() {

    // stub out the SNS subscription functions

    before(() => {
        sinon.stub(Subscription, 'remove').returns(Promise.resolve());

        // dummy IAM role
        process.env.IAM_ROLE = 'arn:aws:iam::000000001:role/pushy-testtest-r-IamRoleLambda-RANDOMCHARS';
    });

    after(() => {
        Subscription.remove.restore();
    });


    it('Calls the add subscription method', function() {

        return PromisifyLambda(handler, EXAMPLE_REQUEST)
            .then((response) => {
                response.success.should.equal(true);
            });

    });
});
