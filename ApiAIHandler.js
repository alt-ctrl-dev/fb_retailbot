'use strict'
const APIAiService = require('apiai');
const request = require('request');
const Utils = require("./Utils");

class ApiAIHandler {
    constructor(messageRouter, {
        API_AI_CLIENT_ACCESS_TOKEN
    }) {
        this.router = messageRouter;
        this.apiAiService = APIAiService(API_AI_CLIENT_ACCESS_TOKEN, {
            language: "en",
            requestSource: "fb"
        });
    }

    sendToApiAi(sender, text) {
        let sessID = sessionIds.get(sender); //XXX
        sendTypingOn(sender);
        let apiaiRequest = this.apiAiService.textRequest(text, {
            sessionId: sessID.id
        });

        apiaiRequest.on('response', (response) => {
            if (isDefined(response.result)) {
                handleApiAiResponse(sender, response);
            }
        });

        apiaiRequest.on('error', (error) => {
            console.error(error)
            sendTextMessage(sender, "Opps, something went wrong.");
            sendTypingOff(sender);
        });
        apiaiRequest.end();
    }
}

module.exports = ApiAIHandler;