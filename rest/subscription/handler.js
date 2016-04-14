'use strict';

class Test {
	thing() {
		return "test";
	}
}

module.exports.handler = function(event, context) {
	console.log(event, context)
    return context.done(null, {
        message: 'Go Serverless! Your Lambda function executed successfully!'
    });
};
