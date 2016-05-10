import namespaces from '../../../lib/redis/namespaces';
import SNS from '../../../lib/sns';
import Subscription from '../../../lib/subscription';
import sinon from 'sinon';
import {EXAMPLE_REQUEST, BROWSER_SUBSCRIPTION_OBJECT} from '../../fixtures/example_web_push_subscription';
import mockAWSSinon from 'mock-aws-sinon';

describe("Subscription/get", function() {
    
    before(() => {
        mockAWSSinon('SNS', 'subscribe', function(args, cb) {
            cb(null, {SubscriptionArn: 'blah-blah'})
        })
        
        mockAWSSinon('lambda', 'addPermission', function(args, cb) {
            cb(null, {})
        })
    })
    
    after(() => {
        mockAWSSinon('SNS', 'subscribe').restore();
        mockAWSSinon('lambda', 'addPermission').restore();
    })
    
    it("should return all subscribed topics", function() {
        
        let cloneExample = JSON.parse(JSON.stringify(EXAMPLE_REQUEST));
        cloneExample.endpoint = "https://blahblah.local";
        return Subscription.add('test-topic', EXAMPLE_REQUEST)
        .then(() => {
            // add a different topic to ensure that we are only returning
            // the relevant ones
            Subscription.add('test-topic-two', cloneExample)
        })
        .then((res) => {
            return Subscription.get(EXAMPLE_REQUEST)
        })
        .then((res) => {
            res.length.should.equal(1);
            res[0].should.equal('test-topic');
        })
    })
    
})