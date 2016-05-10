import SNS from '../../lib/sns';
import mockAWSSinon from 'mock-aws-sinon';
import namespaces from '../../lib/redis/namespaces';
import {createClient as createRedisClient} from '../../lib/redis/client';
import should from 'should';
import {createArn, createSNSTopic, AWS_ACCOUNT_ID} from '../../lib/arn';
import sinon from 'sinon';

const FAKE_ARN = 'arn:aws:sns:us-east-1:234234234:staging__test:asdfasdfasdfasfd';
const redisClient = createRedisClient();

describe("SNS", function() {

    before(() => {
        mockAWSSinon('SNS','subscribe').returns({
            SubscriptionArn: FAKE_ARN
        });
        
        mockAWSSinon('SNS','unsubscribe').returns(true);
        
        mockAWSSinon('lambda','addPermission', function(data, cb) {
            cb(null, {})
        })
    })

    after(() => {
        mockAWSSinon('SNS','subscribe').restore();
        mockAWSSinon('SNS','unsubscribe').restore();
        mockAWSSinon('lambda', 'addPermission').restore();
        mockAWSSinon.restore();
    })


    it("Adds a topic subscription and stores in Redis", () => {
        return SNS.addTopicSubscription('test')
        .then(() => {
            return redisClient.get(namespaces.snsSubscription('test'))
        })
        .then((arn) => {
            arn.should.equal(FAKE_ARN);
            mockAWSSinon('SNS','subscribe').calledWith(sinon.match({
                TopicArn: createSNSTopic('test'),
                Protocol: 'lambda',
                Endpoint: createArn('lambda', process.env.SERVERLESS_REGION, AWS_ACCOUNT_ID, ['function', process.env.SERVERLESS_PROJECT + '-listener', process.env.SERVERLESS_STAGE].join(':'))
            })).should.equal(true);
        })
    })

    it("Removes a topic subscription from Redis", () => {
        return SNS.addTopicSubscription('test')
        .then(() => {
            return SNS.removeTopicSubscription('test')
        })
        .then(() => {
            return redisClient.get(namespaces.snsSubscription('test'))
        })
        .then((returnArn) => {
            should.equal(returnArn, null);
            mockAWSSinon('SNS','unsubscribe').calledWith(sinon.match({
                SubscriptionArn: FAKE_ARN
            })).should.equal(true);
        })
    })
})