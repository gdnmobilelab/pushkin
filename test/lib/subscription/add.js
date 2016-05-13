import {createClient as createRedisClient} from '../../../lib/redis/client';
import namespaces from '../../../lib/redis/namespaces';
import SNS from '../../../lib/sns';
import Subscription from '../../../lib/subscription';
import sinon from 'sinon';
import {EXAMPLE_REQUEST} from '../../fixtures/example_web_push_subscription';
import should from 'should';
import webPush from '../../../lib/web-push';

const redisClient = createRedisClient();

describe('Subscription/add', function() {

    // stub out the SNS subscription functions

    beforeEach(() => {
        sinon.stub(SNS, 'addTopicSubscription').returns(Promise.resolve(true));
        sinon.stub(SNS, 'removeTopicSubscription').returns(Promise.resolve(true));
    })

    afterEach(() => {
        SNS.addTopicSubscription.restore();
        SNS.removeTopicSubscription.restore();
    })


    it('Adds users to topic subscription', function() {
        return Subscription.add('test-topic', EXAMPLE_REQUEST)
        .then((response) => {
            response.should.equal(true);
            
            let multi = redisClient.multi();
            multi.zscore(namespaces.topic('test-topic'), JSON.stringify(EXAMPLE_REQUEST.data));
            multi.sismember(namespaces.allTopicList(), namespaces.topic('test-topic'))
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

        return redisClient.zadd([namespaces.topic('test-topic'), 1, JSON.stringify(EXAMPLE_REQUEST)])
        .then(function() {
            return Subscription.add('test-topic', newExample)
        })
        .then((response) => {
            SNS.addTopicSubscription.calledOnce.should.equal(false);
        });
    })
    
    describe("with confirmation notifications", function() {
        
        afterEach(() => {
            webPush.sendNotification.restore()
        })
        
        let withNotification = Object.assign({
            confirmationNotification: [
                {
                    "test": "yes"
                }
            ]
        }, EXAMPLE_REQUEST);
        
   
    
        it("Send a confirmation notification when specified", function() {
            sinon.stub(webPush, "sendNotification")
            .returns(Promise.resolve(JSON.stringify({
                "multicast_id": 5818568061551720000,
                "success": 1,
                "failure": 0,
                "canonical_ids": 0,
                "results": [
                    {
                        "message_id": "0:1463159425177924%b5e11c9ef9fd7ecd"
                    }
                ]
            })));
            
            return Subscription.add('test-topic', withNotification)
            .then((response) => {
                response.should.equal(true);
                webPush.sendNotification.calledOnce.should.equal(true);
                return redisClient.zscore(namespaces.topic('test-topic'), JSON.stringify(withNotification.data));
            })
            .then((redisResponse) => {
                should(redisResponse).not.be.null();
            })
        });
    
        it("Remove subscription when confirmation notification fails", function() {
            sinon.stub(webPush, "sendNotification")
            .returns(Promise.resolve(JSON.stringify({
                "multicast_id": 5818568061551720000,
                "success": 0,
                "failure": 1,
                "canonical_ids": 0,
                "results": [
                    {
                        "error": "it failed"
                    }
                ]
            })));
            
        
            return Subscription.add('test-topic', withNotification)
            .catch((err) => {
                err.message.should.equal("it failed")
                return redisClient.zscore(namespaces.topic('test-topic'), JSON.stringify(withNotification.data));
            })
            .then((redisResponse) => {
                should(redisResponse).be.null();
            })
        });
        
     })

})