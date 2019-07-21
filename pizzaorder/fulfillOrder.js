const aws = require("aws-sdk");
const uuid = require('uuid/v4');

const saveOrder = (order) => {
    const dynamoDB = new aws.DynamoDB.DocumentClient({
        apiVersion: "2012-08-10",
        region: "us-east-1"
    });

    const params = {
        TableName: 'PizzaOrders',
        Item: order
    };

    return dynamoDB.put(params).promise();
};

const createOrder = (slots, sessionAttributes) => {

    return {
        orderId: uuid(),
        ...slots,
        total: sessionAttributes.totalPrice
    };
};

const createCloseResponse = () => {
    return {
        dialogAction: {
             type: "Close",
             fulfillmentState: "Fulfilled",
            message: {
                contentType: "PlainText",
                content: "Your order has been placed. Thank you! :-D"
            },
            responseCard: {
                version: 1,
                contentType: "application/vnd.amazonaws.card.generic",
                genericAttachments: [
                    {
                        title: "Your order has been placed!",
                        subTitle: "Do you need anything else?",
                        imageUrl: "https://i.ibb.co/D5c7xSB/Resized-pizza.png",
                        buttons: [
                            {
                                text: "Order another pizza",
                                value: "I want a pizza"
                            }
                        ]
                    }
                ]
            }
        }
    }
};

exports.handler = async (event) => {
    console.log(event);
    const { slots } = event.currentIntent;

    const order = createOrder(slots, event.sessionAttributes);
    await saveOrder(order);

    return createCloseResponse();
};
