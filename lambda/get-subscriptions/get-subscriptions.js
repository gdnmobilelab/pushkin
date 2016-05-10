import Subscription from '../../lib/subscription';


export function handler(event, context) {
    Subscription.get(event.subscription)
    .then((subscribed) => {
        context.done(null, subscribed);
    })
    .catch((err) => {
        context.fail(err);
    })
}