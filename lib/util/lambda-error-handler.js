import {forceClose as forceCloseRedis} from '../redis/client';

// Generic handler for our lambdas that attempts to parse out
// errors in a way our error template can parse. It'll use the
// statusCode in the HTTP response, and output the response
// as the JSON body.

export default function(cb) {
    return (error) => {
        
        // Make sure we have killed our Redis connection, otherwise
        // the Lambda event loop won't stop
        
        forceCloseRedis();
        
        cb(JSON.stringify({
            statusCode: error.statusCode || 500,
            response: JSON.stringify(error.toString() || "An error occurred")
        }));
    }
}