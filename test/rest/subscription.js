import add from '../../rest/subscription/add/handler.js';
import remove from '../../rest/subscription/remove/handler.js';
import mochaPlugin from 'serverless-mocha-plugin';
import Promise from 'bluebird';
import Subscription from '../../lib/subscription';
import sinon from 'sinon';
import {expect} from 'chai';

const wrappedAdd = Promise.promisifyAll(mochaPlugin.lambdaWrapper.wrap(add.handler));
const wrappedRemove = Promise.promisifyAll(mochaPlugin.lambdaWrapper.wrap(remove.handler));

describe('Subscription endpoints', function() {

    // stub out the SNS subscription functions

    before(() => {
        sinon.stub(Subscription, 'add').returns(Promise.resolve());
        sinon.stub(Subscription, 'remove').returns(Promise.resolve());
    })

    after(() => {
        Subscription.add.restore();
        Subscription.remove.restore();
    })


    it('returns add endpoint correctly', function() {

        return wrappedAdd.runAsync({
            topic: 'test-topic',
            endpoint: 'test-endpoint-to-add'
        })
        .then((response) => {
            expect(response.endpoint).to.equal('test-endpoint-to-add');
        });
    });

    it('returns remove endpoint correctly', function() {
        return wrappedRemove.runAsync({
            topic: 'test-topic',
            endpoint: 'test-endpoint'
        })
        .then((response) => {
            expect(response.endpoint).to.equal('test-endpoint');
        })
    });
});
