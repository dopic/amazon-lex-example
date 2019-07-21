
const aws = require('aws-sdk');

const proxyResponse = (status, message) => {
    console.log(message);

    return {
        statusCode: status,
        body: JSON.stringify(message)
    };
};

exports.handler = async (event) => {
    console.log(event);

    const payload = JSON.parse(event.body);
    const lex = new aws.LexRuntime({
        region: "us-east-1"
    });

    const params = {
        botAlias: '$LATEST',
        botName: 'PizzaBot',
        inputText: payload.message,
        userId: payload.userId,
        sessionAttributes: payload.sessionAttributes || {}
    };

    try {
        var lexResponse = await lex.postText(params).promise();
        return proxyResponse(200, lexResponse);
    } catch (e) {
        console.log(e);
        return proxyResponse(400, 'Ops. Houston, we have a problem! :-(');
    }
};
