'use strict'
const APIAiService = require('apiai');
const request = require('request');
const Utils = require("./Utils");

class ApiAIHandler {
    constructor(messageRouter, facebookHandler) {
        this.router = messageRouter;
        this.apiAiService = APIAiService(process.env.API_AI_CLIENT_ACCESS_TOKEN, {
            language: "en",
            requestSource: "fb"
        });
    }

    /*
     * Send an image using the Send API.
     *
     */
    sendImageMessage(recipientId, imageUrl) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "image",
                    payload: {
                        url: imageUrl
                    }
                }
            }
        };

        callSendAPI(messageData);
    }

    /*
     * Send a Gif using the Send API.
     *
     */
    sendGifMessage(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "image",
                    payload: {
                        url: config.SERVER_URL + "/assets/instagram_logo.gif"
                    }
                }
            }
        };

        callSendAPI(messageData);
    }

    /*
     * Send audio using the Send API.
     *
     */
    sendAudioMessage(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "audio",
                    payload: {
                        url: config.SERVER_URL + "/assets/sample.mp3"
                    }
                }
            }
        };

        callSendAPI(messageData);
    }

    /*
     * Send a video using the Send API.
     * example videoName: "/assets/allofus480.mov"
     */
    sendVideoMessage(recipientId, videoName) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "video",
                    payload: {
                        url: config.SERVER_URL + videoName
                    }
                }
            }
        };

        callSendAPI(messageData);
    }

    /*
     * Send a video using the Send API.
     * example fileName: fileName"/assets/test.txt"
     */
    sendFileMessage(recipientId, fileName) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "file",
                    payload: {
                        url: config.SERVER_URL + fileName
                    }
                }
            }
        };

        callSendAPI(messageData);
    }

    /*
     * Send a button message using the Send API.
     *
     */
    sendButtonMessage(recipientId, text, buttons) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "button",
                        text: text,
                        buttons: buttons
                    }
                }
            }
        };

        callSendAPI(messageData);
    }

    sendGenericMessage(recipientId, elements) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "generic",
                        elements: elements
                    }
                }
            }
        };

        callSendAPI(messageData);
    }

    sendReceiptMessage(recipientId, recipient_name, currency, payment_method, timestamp, elements, address, summary, adjustments) {
        // Generate a random receipt ID as the API requires a unique ID
        var receiptId = "order" + Math.floor(Math.random() * 1000);

        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "receipt",
                        recipient_name: recipient_name,
                        order_number: receiptId,
                        currency: currency,
                        payment_method: payment_method,
                        timestamp: timestamp,
                        elements: elements,
                        address: address,
                        summary: summary,
                        adjustments: adjustments
                    }
                }
            }
        };

        callSendAPI(messageData);
    }

    handleApiAiAction(sender, action, responseText, contexts, parameters) {
        switch (action) {
            case "move-in":
                if ((parameters.hasOwnProperty("accountid") && parameters["accountid"] != '') && (parameters.hasOwnProperty("address") && parameters["address"] != '') && (parameters.hasOwnProperty("date") && parameters["date"] != '')) {
                    let account_data = require("./data.js");

                    if (account_data.account.findIndex((id) => parameters["accountid"] === id) >= 0) {
                        this.facebookHandler.sendTextMessage(sender, responseText);
                    } else {
                        this.facebookHandler.sendTextMessage(sender, `No matching account ID exist. Move-in to ${parameters["address"]} for ${parameters["date"]} will be cancelled`);
                    };
                } else {
                    this.facebookHandler.sendTextMessage(sender, responseText);
                }
                break;

            case "current-weather":
            case "get-current-weather":
                if (parameters.hasOwnProperty("geo-city") && parameters["geo-city"] != '') {
                    request({
                        url: 'http://api.openweathermap.org/data/2.5/weather', //URL to hit
                        qs: {
                            appid: config.WEATHER_API_KEY,
                            q: parameters["geo-city"],
                            units: "metric"
                        }, //Query string data
                    }, (error, response, body) => {
                        if (!error && response.statusCode == 200) {
                            let weather = JSON.parse(body);
                            console.log(weather);
                            if (weather.hasOwnProperty("weather")) {
                                let desc = `Weather condition for today: ${weather["weather"][0]["description"]}`;
                                //sendTextMessage(sender, desc);
                                let temp = `Current temperature: ${weather["main"]["temp"]} °C`;
                                //sendTextMessage(sender, temp);
                                let temp_min = `Min temperature: ${weather["main"]["temp_min"]} °C`;
                                //sendTextMessage(sender, temp_min);
                                let temp_max = `Max temperature: ${weather["main"]["temp_max"]} °C`;
                                this.facebookHandler.sendTextMessage(sender, `${desc} ${temp} ${temp_min} ${temp_max}`);
                            } else {
                                this.facebookHandler.sendTextMessage(sender, `No weather forecast available for ${parameters["geo-city"]}`);
                            }
                        } else {
                            console.error(response.error);
                            this.facebookHandler.sendTextMessage(sender, `Could not retrieve weather details for ${parameters["geo-city"]}`);
                        }
                    });
                } else {
                    this.facebookHandler.sendTextMessage(sender, responseText);
                }
                break;
            case "faq-delivery":
                this.facebookHandler.sendTextMessage(sender, responseText);
                sendTypingOn(sender);

                //ask what user wants to do next
                setTimeout(() => {
                    let buttons = [{
                        type: "web_url",
                        url: "https://www.myapple.com/track_order",
                        title: "Track my order"
                    }, {
                        type: "phone_number",
                        title: "Call us",
                        payload: "+16505551234"
                    }, {
                        type: "postback",
                        title: "Keep on Chatting",
                        payload: "CHAT"
                    }];

                    sendButtonMessage(sender, "What would you like to do next?", buttons);
                }, 3000);
                break;
            case "job-enquiry":
                {
                    let reply = [{
                        "content_type": "text",
                        "title": "Accountant",
                        "payload": "Accountant"
                    }, {
                        "content_type": "text",
                        "title": "Sales rep",
                        "payload": "Sales"
                    }, {
                        "content_type": "text",
                        "title": "Not Interested",
                        "payload": "Not Interested"
                    }]

                    this.facebookHandler.sendQuickReply(sender, responseText, reply)
                }
                break;

            case "detailed-application":
                if (Utils.isDefined(contexts[0]) && (contexts[0].name == 'job_application' || contexts[0].name == 'job-application-details_dialog_context') && contexts[0].parameters) {
                    let phone_number = (Utils.isDefined(contexts[0].parameters['phone-number']) && contexts[0].parameters['phone-number'] != '') ?
                        contexts[0].parameters['phone-number'] :
                        '';
                    let user_name = (Utils.isDefined(contexts[0].parameters['user-name']) && contexts[0].parameters['user-name'] != '') ?
                        contexts[0].parameters['user-name'] :
                        '';
                    let previous_job = (Utils.isDefined(contexts[0].parameters['previous-job']) && contexts[0].parameters['previous-job'] != '') ?
                        contexts[0].parameters['previous-job'] :
                        '';
                    let years_of_experience = (Utils.isDefined(contexts[0].parameters['years-of-experience']) && contexts[0].parameters['years-of-experience'] != '') ?
                        contexts[0].parameters['years-of-experience'] :
                        '';
                    let job_vacancy = (Utils.isDefined(contexts[0].parameters['job-vacancy']) && contexts[0].parameters['job-vacancy'] != '') ?
                        contexts[0].parameters['job-vacancy'] :
                        '';

                    if (phone_number == '' && user_name != '' && previous_job != '' && years_of_experience == '') {
                        let replies = [{
                            "content_type": "text",
                            "title": "Less than 1 year",
                            "payload": "Less than 1 year"
                        }, {
                            "content_type": "text",
                            "title": "Less than 10 year",
                            "payload": "Less than 10 year"
                        }, {
                            "content_type": "text",
                            "title": "More than 10 years",
                            "payload": "More than 10 years"
                        }];
                        this.facebookHandler.sendQuickReply(sender, responseText, replies);
                    } else if (phone_number != '' && user_name != '' && previous_job != '' && years_of_experience != '' && job_vacancy != '') {
                        let emailContent = 'A new job enquiry from ' + user_name + ' for the job: ' + job_vacancy + '.<br> Previous job position: ' + previous_job + '..<br> Years of experience: ' + years_of_experience + '..<br> Phone number: ' + phone_number + '.';

                        sendEmail('New job application', emailContent);
                        this.facebookHandler.sendTextMessage(sender, responseText);
                    } else {
                        this.facebookHandler.sendTextMessage(sender, responseText);
                    }
                }

                break;
            default:
                //unhandled action, just send back the text
                this.facebookHandler.sendTextMessage(sender, responseText);
        }
    }

    handleMessage(message, sender) {
        switch (message.type) {
            case 0: //text
                this.facebookHandler.sendTextMessage(sender, message.speech);
                break;
            case 2: //quick replies
                let replies = [];
                for (var b = 0; b < message.replies.length; b++) {
                    let reply = {
                        "content_type": "text",
                        "title": message.replies[b],
                        "payload": message.replies[b]
                    }
                    replies.push(reply);
                }
                this.facebookHandler.sendQuickReply(sender, message.title, replies);
                break;
            case 3: //image
                sendImageMessage(sender, message.imageUrl);
                break;
            case 4:
                // custom payload
                var messageData = {
                    recipient: {
                        id: sender
                    },
                    message: message.payload.facebook

                };

                callSendAPI(messageData);

                break;
        }
    }

    handleCardMessages(messages, sender) {

        let elements = [];
        for (var m = 0; m < messages.length; m++) {
            let message = messages[m];
            let buttons = [];
            for (var b = 0; b < message.buttons.length; b++) {
                let isLink = (message.buttons[b].postback.substring(0, 4) === 'http');
                let button;
                if (isLink) {
                    button = {
                        "type": "web_url",
                        "title": message.buttons[b].text,
                        "url": message.buttons[b].postback
                    }
                } else {
                    button = {
                        "type": "postback",
                        "title": message.buttons[b].text,
                        "payload": message.buttons[b].postback
                    }
                }
                buttons.push(button);
            }

            let element = {
                "title": message.title,
                "image_url": message.imageUrl,
                "subtitle": message.subtitle,
                "buttons": buttons
            };
            elements.push(element);
        }
        sendGenericMessage(sender, elements);
    }

    handleApiAiResponse(sender, response) {
        console.log(`handleApiAiResponse`)

        let responseText = response.result.fulfillment.speech;
        let responseData = response.result.fulfillment.data;
        let messages = response.result.fulfillment.messages;
        let action = response.result.action;
        let contexts = response.result.contexts;
        let parameters = response.result.parameters;

        console.log(`responseText`)
        console.log(responseText)

        console.log(`responseData`)
        console.log(responseData)

        console.log(`messages`)
        console.log(messages)

        console.log(`action`)
        console.log(action)

        console.log(`contexts`)
        console.log(contexts)

        console.log(`parameters`)
        console.log(parameters)

        sendTypingOff(sender);

        if (Utils.isDefined(messages) && (messages.length == 1 && messages[0].type != 0 || messages.length > 1)) {
            let timeoutInterval = 1100;
            let previousType;
            let cardTypes = [];
            let timeout = 0;
            for (var i = 0; i < messages.length; i++) {

                if (previousType == 1 && (messages[i].type != 1 || i == messages.length - 1)) {

                    timeout = (i - 1) * timeoutInterval;
                    setTimeout(handleCardMessages.bind(null, cardTypes, sender), timeout);
                    cardTypes = [];
                    timeout = i * timeoutInterval;
                    setTimeout(handleMessage.bind(null, messages[i], sender), timeout);
                } else if (messages[i].type == 1 && i == messages.length - 1) {
                    cardTypes.push(messages[i]);
                    timeout = (i - 1) * timeoutInterval;
                    setTimeout(handleCardMessages.bind(null, cardTypes, sender), timeout);
                    cardTypes = [];
                } else if (messages[i].type == 1) {
                    cardTypes.push(messages[i]);
                } else {
                    timeout = i * timeoutInterval;
                    setTimeout(handleMessage.bind(null, messages[i], sender), timeout);
                }

                previousType = messages[i].type;

            }
        } else if (responseText == '' && !Utils.isDefined(action)) {
            //api ai could not evaluate input.
            console.log('Unknown query' + response.result.resolvedQuery);
            this.facebookHandler.sendTextMessage(sender, "I'm not sure what you want. Can you be more specific?");
        } else if (Utils.isDefined(action)) {
            handleApiAiAction(sender, action, responseText, contexts, parameters);
        } else if (Utils.isDefined(responseData) && Utils.isDefined(responseData.facebook)) {
            try {
                console.log('Response as formatted message' + responseData.facebook);
                this.facebookHandler.sendTextMessage(sender, responseData.facebook);
            } catch (err) {
                this.facebookHandler.sendTextMessage(sender, err.message);
            }
        } else if (Utils.isDefined(responseText)) {
            this.facebookHandler.sendTextMessage(sender, responseText);
        }
    }

    sendToApiAi(sender, text) {
        this.facebookHandler.sendTypingOn(sender);
        let apiaiRequest = apiAiService.textRequest(text, {
            sessionId: sessionIds.get(sender)
        });

        apiaiRequest.on('response', (response) => {
            if (Utils.isDefined(response.result)) {
                handleApiAiResponse(sender, response);
            }
        });

        apiaiRequest.on('error', (error) => {
            console.error(error)
            this.facebookHandler.sendTextMessage(sender, "Opps, something went wrong.");
            this.facebookHandler.sendTypingOff(sender);
        });
        apiaiRequest.end();
    }
}

module.exports = ApiAIHandler;