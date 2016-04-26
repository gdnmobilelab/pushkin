
export default {
    topic: (topic) => `topic:subscriptions::${topic}`,
    snsSubscription: (topic) => `sns:subscription:arn::${topic}`,
    performanceLogging: (messageId) => `broadcast:timing::${messageId}`
} 
