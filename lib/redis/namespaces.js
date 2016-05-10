
export default {
    topic: (topic) => `topic:subscriptions::${topic}`,
    snsSubscription: (topic) => `sns:subscription:arn::${topic}`,
    performanceLogging: (messageId) => `broadcast:timing::${messageId}`,
    allTopicList: () => `topic:list`,
    extract: (fullStr) => fullStr.split('::')[1]
} 
