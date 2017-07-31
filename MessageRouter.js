const FacebookHandler = require("./FacebookHandler")
const ApiAIHandler = require("./ApiAIHandler")
const bodyParser = require('body-parser');
const CustomerStore = require("./CustomerStore")

class MessageRouter {
    constructor(config) {
        this.config = config;
        this.customerStore = new CustomerStore();
        this.fbHandler = new FacebookHandler(this, config);
        this.apiaiHandler = new ApiAIHandler(this, config);
    }

    handleRoutes(app) {
        if (!app) {
            return new Error('You must specify app from express');
        }
    }

    verifyRequestSignature(req, res, buf) {
        this.fbHandler.verifyRequestSignature.bind(this.fbHandler, req, res, buf);
    }

    receivedMessage(messagingEvent) {
        this.fbHandler.receivedMessage.bind(this.fbHandler, messagingEvent);
    }

    sendToApiAi() {
        this.apiaiHandler.sendToApiAi.bind(this.apiaiHandler, senderID, messageText);
    }
}

module.exports = MessageRouter;