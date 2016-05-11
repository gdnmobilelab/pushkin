
export default {
    topic: (topic) => `${process.env.SERVERLESS_STAGE}:topic:subscriptions::${topic}`,
    snsSubscription: (topic) => `${process.env.SERVERLESS_STAGE}:sns:subscription:arn::${topic}`,
    performanceLogging: (messageId) => `${process.env.SERVERLESS_STAGE}:broadcast:timing::${messageId}`,
    allTopicList: () => `${process.env.SERVERLESS_STAGE}:topic:list`,
    extract: (fullStr) => fullStr.split('::')[1]
} 
