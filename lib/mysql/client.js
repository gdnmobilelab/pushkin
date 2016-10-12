import * as mysql from 'mysql';


export function withMysql(promiseChain) {
    var currentActiveClient = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        debug: false
    });

    // Pass the client to our promise chain
    let chain = promiseChain(currentActiveClient);

    // Then make sure we both catch success and failures of the promise
    // and check if we're good to close our connection or not

    return chain.then(
        function(result) {
            console.log('Closing mysql connection...');
            currentActiveClient.end();
            Promise.resolve(result);
        },
        function(error) {
            console.log('Closing mysql connection...');
            currentActiveClient.end();
            Promise.reject(error);
        }
    );
}