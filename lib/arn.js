
export function createArn(service, region, accountId, name) {
    return ['arn','aws', service, region, accountId, name].join(':');
}