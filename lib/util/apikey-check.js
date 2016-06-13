
export default function(keyName, event) {
    let keyNameUpper = keyName.toUpperCase();
    return Promise.resolve()
    .then(() => {
        let keyInConfig = process.env[`API_KEY__${keyNameUpper}`];
        if (event.apiKey !== keyInConfig) {
            console.error(`Attempt to access function with key ${event.apiKey}, expected ${keyInConfig} (${keyNameUpper})`)
            let err = new Error("You do not have permission to do this.");
            err.name = "Forbiddena";
            err.code = 403;
            throw err;
        }
    })
    
}