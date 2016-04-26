import Subscription from '../../lib/subscription';
import 'source-map-support/register'

export function handler(event, context, cb) {
    Promise.resolve()
    .then(() => {

        if (event.action === 'add') {
            return Subscription.add(event.topic, event.subscription);
        } else {
            return Subscription.remove(event.topic, event.subscription);
        }

    })
    .then(() => {
        context.done(null, {
            success: true
        })
    })
    .catch((err) => {
        console.log('failed')
        context.fail(err.toString());
    });
}
