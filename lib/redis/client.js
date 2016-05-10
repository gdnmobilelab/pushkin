import promiseRedis from 'promise-redis';

const redis = promiseRedis(); // uses native Promise implementation

/*
 * By default AWS Lambdas won't finish until the event loop is closed
 * which means we can't keep things like Redis connections open
 * persistently. Instead, we use this promise chain to open and close
 * connections as required. It allows use to re-use an open connection
 * and only close it when every promise chain is complete.
 */

let currentActiveClient = null;
let numberOfChainsAttachedToClient = 0;

// Check if we have any promise chains still using this connection
// if not, we can safely close out the connection

const closeCurrentConnectionIfNecessary = function() {
    numberOfChainsAttachedToClient = numberOfChainsAttachedToClient - 1;
    
    if (numberOfChainsAttachedToClient === 0) {
        let deactivatingClient = currentActiveClient;
        currentActiveClient = null;
        return deactivatingClient.quit()
    }
    
    return Promise.resolve()
}

// Primarily exporting this for use in tests

export function createClient() {
    return redis.createClient(process.env.REDIS_HOST);   
}

export function forceClose() {
    if (currentActiveClient) {
        currentActiveClient.quit();
    }
}

export function withRedis(promiseChain) {
    
    if (!currentActiveClient) {
        currentActiveClient = createClient();
        numberOfChainsAttachedToClient = 1;
    } else {
        numberOfChainsAttachedToClient = numberOfChainsAttachedToClient + 1;
    }
    
    // Pass the client to our promise chain
    let chain = promiseChain(currentActiveClient)
    
    // Then make sure we both catch success and failures of the promise
    // and check if we're good to close our connection or not
    
    return chain.then(
        function(result) {
            return closeCurrentConnectionIfNecessary()
            .then(() => {
                return result
            });
        },
        function(error) {
            return closeCurrentConnectionIfNecessary()
            .then(() => {
                throw error
            });
        }
    );
}