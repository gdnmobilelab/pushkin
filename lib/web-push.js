import webPush from 'web-push';

webPush.setGCMAPIKey(process.env.GCM_API_KEY);

export default webPush;