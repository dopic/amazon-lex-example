const aws = require("aws-sdk");

const createInvalidSlotResponse = (slots, slotToElicit, message) => {
    slots[slotToElicit] = null;
    return {
        dialogAction: {
            type: "ElicitSlot",
            message: {
                contentType: "PlainText",
                content: message
            },
            intentName: "OrderAPizza",
            slots,
            slotToElicit: slotToElicit
        }
    }
};

const createConfirmationResponse = (slots, totalPrice) => {
    return {
        sessionAttributes: {
            totalPrice
        },
        dialogAction: {
            type: "ConfirmIntent",
            message: {
                contentType: "PlainText",
                content: `Ok. Do you confirm your order for a ${slots.flavour} pizza, with ${slots.crust} stuffed edge to be delivered at ${slots.address} for U$${totalPrice.toFixed(2)}?`
            },
            intentName: "OrderAPizza",
            slots,
            responseCard: {
                version: 1,
                contentType: "application/vnd.amazonaws.card.generic",
                genericAttachments: [
                    {
                        title: "Order confirmation",
                        subTitle: "Can I place your order?",
                        buttons: [
                            {
                                text: "Yes",
                                value: "yes"
                            }, {
                                text: "No",
                                value: "no"
                            }
                        ]
                    }
                ]
            }
        }
    }
};

const createDelegateResponse = (slots) => {
    return {
        dialogAction: {
            type: "Delegate",
            slots
        }
    }
};

const getFlavourPrice = (type, flavour) => {
    const dynamoDB = new aws.DynamoDB({
        apiVersion: "2012-08-10",
        region: "us-east-1"
    });

    const queryParams = {
        TableName: "PizzaFlavours",
        KeyConditionExpression: "#tp = :flavourType and flavour = :flavour",
        ExpressionAttributeNames: {
            "#tp": "type"
        },
        ExpressionAttributeValues: {
            ":flavourType": {
                "S": type
            },
            ":flavour": {
                "S": flavour
            }
        },

    };

    return new Promise((resolve, reject) => {
        dynamoDB.query(queryParams, function (err, data) {
            if (err) return reject(err);

            if (data.Items.length <= 0) return resolve();

            console.log(JSON.stringify(data.Items[0]))
            return resolve(parseFloat(data.Items[0].price.N));
        })

    });
};

exports.handler = async (event) => {
    console.log(event);

    const { slots, confirmationStatus } = event.currentIntent;
    if (confirmationStatus !== 'None') return createDelegateResponse(slots);

    if (!slots.flavour) return createInvalidSlotResponse(slots, 'flavour', 'What is the pizza flavour that you want?');
    const flavourPrice = await getFlavourPrice('pizza', slots.flavour);
    if (flavourPrice === undefined) return createInvalidSlotResponse(slots, 'flavour', 'This pizza flavour is not available. Can you choose another one? :-)');

    if (!slots.crust) return createInvalidSlotResponse(slots, 'crust', 'What is the crust flavour?');
    const crustPrice = await getFlavourPrice('crust', slots.crust);
    if (crustPrice === undefined) return createInvalidSlotResponse(slots, 'crust', 'This crust flavour is not available. Can you choose another one? :-)');

    if (!slots.address) return createInvalidSlotResponse(slots, 'address', 'What is the delivery address?');

    return createConfirmationResponse(slots, flavourPrice + crustPrice);
};
