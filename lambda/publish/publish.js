import checkAPIKey from '../../lib/util/apikey-check';
import LambdaErrorHandler from '../../lib/util/lambda-error-handler';
import SNS from '../../lib/sns';

export default (event, context, cb) => {
    return checkAPIKey("admin", event)
    .then(() => {
        return SNS.publish(event.topic, event.message);
    })
    .then(() => {
        cb(null, {
            success: true,
            message: event.message
        })
    })
    .catch(LambdaErrorHandler(cb))
}