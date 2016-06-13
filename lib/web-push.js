import webPush from 'web-push';

webPush.setGCMAPIKey(process.env.GCM_API_KEY);

const push = {
    sendNotification: function(endpoint, options) {
                     
        return webPush.sendNotification(endpoint, options)
        .then((resp) => {
            let json = JSON.parse(resp);
                    
            if (json.results[0].error) {
                if (json.results[0].error === 'MismatchSenderId' &&
                    process.env.BACKUP_GCM_API_KEY &&
                    options.overrideGCMAPIKey !== process.env.BACKUP_GCM_API_KEY) {
                   
                    // stupid hack to make up for me accidentally using staging creds in
                    // production. Can't change them in people's service workers now!
                    
                    let withOverride = Object.assign({}, options, {
                        overrideGCMAPIKey: process.env.BACKUP_GCM_API_KEY
                    });
                    
                    return push.sendNotification(endpoint, withOverride);
                } else {
                    throw new Error(json.results[0].error)
                }
            }
            return resp;
        })
    }
};

export default push;