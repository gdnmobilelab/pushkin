
export default function(func) {
    return function(event, context, cb) {
        context.callbackWaitsForEmptyEventLoop = false;
        
        Promise.resolve(func(event, context))
        .then((data) => {
            cb(null, data);
        })
        .catch((error) => {
            cb(JSON.stringify({
                statusCode: error.statusCode || 500,
                response: JSON.stringify(error.toString() || "An error occurred")
            }));
        })
    }
}