
export default {
    topic: (topic) => `${process.env.SERVERLESS_STAGE}:topic:subscriptions::${topic}`,
    snsSubscription: (topic) => `${process.env.SERVERLESS_STAGE}:sns:subscription:arn::${topic}`,
    performanceLogging: (messageId) => `${process.env.SERVERLESS_STAGE}:broadcast:timing::${messageId}`,
    allTopicList: () => `${process.env.SERVERLESS_STAGE}:topic:list`,
    failedSendList: (topic, messageId) => `${process.env.SERVERLESS_STAGE}:broadcast:failed::${topic}:${messageId}`,
    successfulCount: (topic, messageId) => `${process.env.SERVERLESS_STAGE}:broadcast:succeeded::${topic}:${messageId}`,
    extract: (fullStr) => fullStr.split('::')[1]
} 
