import getSubscription from '../../lib/subscription/get';


export function handler(event, context) {
    getSubscription(event.subscription)
    .then((subscribed) => {
        context.done(null, subscribed);
    })
    .catch((err) => {
        context.fail(err);
    })
}