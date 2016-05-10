
export function createDummySubscribers(redisClient, {topic, number, scoreGenerator, subscriptionGenerator}) {

    if (!scoreGenerator) {
        scoreGenerator = (i) => i * 3;
    }

    if (!subscriptionGenerator) {
        subscriptionGenerator = (i) => `doesn't-matter-${i}`;
    }
    
    let redisArgs = [topic];
    
    for (let i = 0; i < number; i++) {
        redisArgs.push(scoreGenerator(i), subscriptionGenerator(i));
    }
   
    return redisClient.zadd(redisArgs);
}