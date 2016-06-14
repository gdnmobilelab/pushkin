import fetch from 'node-fetch';

export default function(obj) {
    if (!process.env.SLACK_WEBHOOK) {
        return console.info("no webhook")
    }
    
    let toSend = Object.assign({
        username: "pushy-debug-" + process.env.SERVERLESS_STAGE.toUpperCase(),
        icon_url: process.env.SERVERLESS_STAGE === "staging" ? "http://www.stg.gdnmobilelab.com/icon.png" : "http://www.gdnmobilelab.com/icon.png"
    }, obj)
    console.log("webhook?", process.env.SLACK_WEBHOOK)
    return fetch(process.env.SLACK_WEBHOOK, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(toSend)
    })
    .catch((err) => {
        console.error(err);
    })
    .then((res) => res.text())
}