import checkAPIKey from '../../lib/util/apikey-check';
import PromisifyLambda from '../../lib/util/promisify-lambda';

export default PromisifyLambda((event, context, cb) => {
    return checkAPIKey("admin", event)
    .then(() => {
        return {
            yay: true
        }
    })
});