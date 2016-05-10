import Subscription from '../../lib/subscription';
import lambdaErrorHandler from '../../lib/util/lambda-error-handler';
import PromisifyLambda from '../../lib/util/promisify-lambda';

export default (event, context, cb) => {
    return Promise.resolve()
    .then(() => {

        if (event.action === 'add') {
            return Subscription.add(event.topic, event.subscription);
        } else {
            return Subscription.remove(event.topic, event.subscription);
        }

    })
    .then(() => {
        cb(null, {
            success: true
        });
    })
    .catch(lambdaErrorHandler(cb))
};