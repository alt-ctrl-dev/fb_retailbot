'use strict'

const request = require('request');
const Utils = require("./Utils")

class FacebookHandler {
    constructor(messageRouter, {
        FB_PAGE_TOKEN,
        FB_VERIFY_TOKEN,
        FB_APP_SECRET
    }) {
        this.router = messageRouter;
        this.FB_PAGE_TOKEN = FB_PAGE_TOKEN;
        this.FB_VERIFY_TOKEN = FB_VERIFY_TOKEN;
        this.FB_APP_SECRET = FB_APP_SECRET;
    }

    /*
     * Verify that the callback came from Facebook. Using the App Secret from 
     * the App Dashboard, we can verify the signature that is sent with each 
     * callback in the x-hub-signature field, located in the header.
     *
     * https://developers.facebook.com/docs/graph-api/webhooks#setup
     *
     */
    verifyRequestSignature(req, res, buf) {
        if (process.env.DEV_ENV) return true;
        let crypto = require('crypto');
        var signature = req.headers["x-hub-signature"];

        if (!signature) {
            throw new Error('Couldn\'t validate the signature.');
        } else {
            var elements = signature.split('=');
            var method = elements[0];
            var signatureHash = elements[1];

            var expectedHash = crypto.createHmac(method, this.FB_APP_SECRET)
                .update(buf)
                .digest('hex');

            if (signatureHash != expectedHash) {
                throw new Error("Couldn't validate the request signature.");
            }
        }
    }

    receivedMessage(event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var timeOfMessage = event.timestamp;
        var message = event.message;

        //XXX
        if (!sessionIds.has(senderID)) {
            let session = {
                "id": uuid.v1(),
                "operator_needed": false,
                "name": ""
            }
            sessionIds.set(senderID, session);
        }

        var isEcho = message.is_echo;
        var messageId = message.mid;
        var appId = message.app_id;
        var metadata = message.metadata;

        // You may get a text or attachment but not both
        var messageText = message.text;
        var messageAttachments = message.attachments;
        var quickReply = message.quick_reply;

        if (isEcho) {
            handleEcho(messageId, appId, metadata);
            return;
        } else if (quickReply) {
            handleQuickReply(senderID, quickReply, messageId);
            return;
        }


        if (messageText) {
            //send message to api.ai
            this.router.sendToApiAi(senderID, messageText);
        } else if (messageAttachments) {
            handleMessageAttachments(messageAttachments, senderID);
        }
    }

    //https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-echo
    handleEcho(messageId, appId, metadata) {
        // Just logging message echoes to console
        console.log("Received echo for message %s and app %d with metadata %s", messageId, appId, metadata);
    }

    handleQuickReply(senderID, quickReply, messageId) {
        var quickReplyPayload = quickReply.payload;
        console.log("Quick reply for message %s with payload %s", messageId, quickReplyPayload);
        //send payload to api.ai
        sendToApiAi(senderID, quickReplyPayload);
    }
}

module.exports = FacebookHandler;