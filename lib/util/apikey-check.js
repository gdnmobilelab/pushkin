
export default function(keyName, event) {
    let keyNameUpper = keyName.toUpperCase();
    return Promise.resolve()
    .then(() => {
        if (event.apiKey !== process.env[`API_KEY__${keyNameUpper}`]) {
            let err = new Error("You do not have permission to do this.");
            err.name = "Forbidden";
            err.code = 403;
            throw err;
        }
    })
    
}