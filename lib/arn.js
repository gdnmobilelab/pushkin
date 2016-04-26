// Only way I could easily find to extract the current account ID without
// hard-coding it in a config

export const AWS_ACCOUNT_ID = process.env.IAM_ROLE.split(':')[4];

export function createArn(service, region, accountId, name) {
    return ['arn','aws', service, region, accountId, name].join(':');
}

export function createSNSTopic(topicName) {
    return createArn('sns', process.env.SERVERLESS_REGION, AWS_ACCOUNT_ID, process.env.SERVERLESS_STAGE + "__" + topicName);
}

export function getTopicNameFromArn(arn) {
    return arn.split(":")[5].split('__')[1];
}