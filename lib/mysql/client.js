import * as mysql from 'mysql';

let currentActiveClient = null;
let numberOfChainsAttachedToClient = 0;

// Check if we have any promise chains still using this connection
// if not, we can safely close out the connection

const closeCurrentConnectionIfNecessary = function() {
    numberOfChainsAttachedToClient = numberOfChainsAttachedToClient - 1;

    if (numberOfChainsAttachedToClient === 0) {
        let deactivatingClient = currentActiveClient;
        currentActiveClient = null;
        deactivatingClient.end()
    }

    return Promise.resolve()
};

export function forceClose() {
    if (currentActiveClient) {
        return currentActiveClient.end()

    }
    return Promise.resolve();
}

export function withMysql(promiseChain) {
    if (!currentActiveClient) {
        currentActiveClient = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            debug: false
        });
        numberOfChainsAttachedToClient = 1;
    } else {
        numberOfChainsAttachedToClient = numberOfChainsAttachedToClient + 1;
    }

    // Pass the client to our promise chain
    let chain = promiseChain(currentActiveClient);

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