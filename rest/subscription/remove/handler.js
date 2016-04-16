'use strict';

import Subscription from '../../../lib/subscription'

module.exports.handler = function(event, context) {
    Subscription.remove(event.topic, event.endpoint)
    .then(() => {
        context.done(null, {
            success: true,
            endpoint: event.endpoint
        });
    })
};
