'use strict'

const request = require('request');
const Utils = require("./Utils")

class FacebookHandler {
    constructor(messageRouter) {
        this.router = messageRouter;
    }

    get FB_APP_SECRET() {
        return process.env.FB_APP_SECRET
    }

    get FB_PAGE_TOKEN() {
        return process.env.FB_PAGE_TOKEN
    }

    get FB_VERIFY_TOKEN() {
        return process.env.FB_VERIFY_TOKEN;
    }

    receivedMessage(event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var timeOfMessage = event.timestamp;
        var message = event.message;

        if (!sessionIds.has(senderID)) {
            sessionIds.set(senderID, uuid.v1());
        }
        // console.log("Received message for user %d and page %d at %d with message:",
        // senderID, recipientID, timeOfMessage); console.log(JSON.stringify(message));

        var isEcho = message.is_echo;
        var messageId = message.mid;
        var appId = message.app_id;
        var metadata = message.metadata;

        // You may get a text or attachment but not both
        var messageText = message.text;
        var messageAttachments = message.attachments;
        var quickReply = message.quick_reply;

        if (isEcho) {
            this.handleEcho(messageId, appId, metadata);
            return;
        } else if (quickReply) {
            this.handleQuickReply(senderID, quickReply, messageId);
            return;
        }

        if (messageText) {
            //send message to api.ai
            sendToApiAi(senderID, messageText);
        } else if (messageAttachments) {
            this.handleMessageAttachments(messageAttachments, senderID);
        }
    }

    handleMessageAttachments(messageAttachments, senderID) {
        //for now just reply
        this.sendTextMessage(senderID, "Attachment received. Thank you.");
    }

    handleQuickReply(senderID, quickReply, messageId) {
        var quickReplyPayload = quickReply.payload;
        console.log("Quick reply for message %s with payload %s", messageId, quickReplyPayload);
        //send payload to api.ai
        this.messageRouter.apiaiHandler.sendToApiAi(senderID, quickReplyPayload);
    }

    // https://developers.facebook.com/docs/messenger-platform/webhook-reference/mes
    // s age-echo
    handleEcho(messageId, appId, metadata) {
        // Just logging message echoes to console
        console.log("Received echo for message %s and app %d with metadata %s", messageId, appId, metadata);
    }

    /*
     * Send a message with Quick Reply buttons.
     *
     */
    sendQuickReply(recipientId, text, replies, metadata) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                text: text,
                metadata: Utils.isDefined(metadata) ?
                    metadata : '',
                quick_replies: replies
            }
        };

        callSendAPI(messageData);
    }

    /*
     * Send a read receipt to indicate the message has been read
     *
     */
    sendReadReceipt(recipientId) {

        var messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "mark_seen"
        };

        this.callSendAPI(messageData);
    }

    /*
     * Turn typing indicator on
     *
     */
    sendTypingOn(recipientId) {

        var messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "typing_on"
        };

        callSendAPI(messageData);
    }

    /*
     * Turn typing indicator off
     *
     */
    sendTypingOff(recipientId) {

        var messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "typing_off"
        };

        callSendAPI(messageData);
    }

    /*
     * Send a message with the account linking call-to-action
     *
     */
    sendAccountLinking(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "button",
                        text: "Welcome. Link your account.",
                        buttons: [{
                            type: "account_link",
                            url: config.SERVER_URL + "/authorize"
                        }]
                    }
                }
            }
        };

        callSendAPI(messageData);
    }

    greetUserText(userId) {
        //first read user firstname
        request({
            uri: 'https://graph.facebook.com/v2.7/' + userId,
            qs: {
                access_token: this.FB_PAGE_TOKEN
            }

        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {

                var user = JSON.parse(body);

                if (user.first_name) {
                    console.log("FB user: %s %s, %s", user.first_name, user.last_name, user.gender);

                    this.sendTextMessage(userId, "Welcome " + user.first_name + '!');
                } else {
                    console.log("Cannot get data for fb user with id", userId);
                }
            } else {
                console.error(response.error);
            }

        });
    }

    /*
     * Call the Send API. The message data goes in the body. If successful, we'll
     * get the message id in a response
     *
     */
    callSendAPI(messageData) {
        request({
            uri: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {
                access_token: config.FB_PAGE_TOKEN
            },
            method: 'POST',
            json: messageData

        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                var recipientId = body.recipient_id;
                var messageId = body.message_id;

                if (messageId) {
                    console.log("Successfully sent message with id %s to recipient %s", messageId, recipientId);
                } else {
                    console.log("Successfully called Send API for recipient %s", recipientId);
                }
            } else {
                console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
            }
        });
    }

    /*
     * Postback Event
     *
     * This event is called when a postback is tapped on a Structured Message.
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
     *
     */
    receivedPostback(event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var timeOfPostback = event.timestamp;

        // The 'payload' param is a developer-defined field which is set in a postback
        // button for Structured Messages.
        var payload = event.postback.payload;

        switch (payload) {
            case 'GET_STARTED':
                greetUserText(senderID);
                break;
            case 'JOB_APPLY':
                //get feedback with new jobs
                sendToApiAi(senderID, "job openings");
                break;
            case 'CHAT':
                //user wants to chat
                this.sendTextMessage(senderID, "I love chatting too. Do you have any other questions for me?");
                break;
            case 'CONTACT_INFO':
                //TODO user wants Contact Info
                let buttons = [{
                    type: "phone_number",
                    title: "Call us",
                    payload: "+16505551234"
                }, {
                    type: "postback",
                    title: "Keep on Chatting",
                    payload: "CHAT"
                }];

                sendButtonMessage(senderID, "What would you like to do next?", buttons);
                break;

            default:
                //unindentified payload
                this.sendTextMessage(senderID, "I'm not sure what you want. Can you be more specific?");
                break;

        }

        console.log("Received postback for user %d and page %d with payload '%s' at %d", senderID, recipientID, payload, timeOfPostback);

    }

    /*
     * Message Read Event
     *
     * This event is called when a previously-sent message has been read.
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
     *
     */
    receivedMessageRead(event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;

        // All messages before watermark (a timestamp) or sequence have been seen.
        var watermark = event.read.watermark;
        var sequenceNumber = event.read.seq;

        console.log("Received message read event for watermark %d and sequence number %d", watermark, sequenceNumber);
    }

    /*
     * Account Link Event
     *
     * This event is called when the Link Account or UnLink Account action has been
     * tapped.
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
     *
     */
    receivedAccountLink(event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;

        var status = event.account_linking.status;
        var authCode = event.account_linking.authorization_code;

        console.log("Received account link event with for user %d with status %s and auth code %s ", senderID, status, authCode);
    }

    /*
     * Delivery Confirmation Event
     *
     * This event is sent to confirm the delivery of a message. Read more about
     * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
     *
     */
    receivedDeliveryConfirmation(event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var delivery = event.delivery;
        var messageIDs = delivery.mids;
        var watermark = delivery.watermark;
        var sequenceNumber = delivery.seq;

        if (messageIDs) {
            messageIDs
                .forEach((messageID) => {
                    console.log("Received delivery confirmation for message ID: %s", messageID);
                });
        }

        console.log("All message before %d were delivered.", watermark);
    }

    /*
     * Authorization Event
     *
     * The value for 'optin.ref' is defined in the entry point. For the "Send to
     * Messenger" plugin, it is the 'data-ref' field. Read more at
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
     *
     */
    receivedAuthentication(event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var timeOfAuth = event.timestamp;

        // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
        // The developer can set this to an arbitrary value to associate the
        // authentication callback with the 'Send to Messenger' click event. This is a
        // way to do account linking when the user clicks the 'Send to Messenger'
        // plugin.
        var passThroughParam = event.optin.ref;

        console.log("Received authentication for user %d and page %d with pass through param '%s' at " +
            "%d",
            senderID, recipientID, passThroughParam, timeOfAuth);

        // When an authentication is received, we'll send a message back to the sender
        // to let them know it was successful.
        this.sendTextMessage(senderID, "Authentication successful");
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

        let crypto = require('crypto');
        let signature = req.headers["x-hub-signature"];

        if (!signature) {
            throw new Error('Couldn\'t validate the signature.');
        } else {
            let elements = signature.split('=');
            let method = elements[0];
            let signatureHash = elements[1];

            let expectedHash = crypto
                .createHmac(method, this.FB_APP_SECRET)
                .update(buf)
                .digest('hex');

            if (signatureHash != expectedHash) {
                throw new Error("Couldn't validate the request signature.");
            }
        }
    }

    sendTextMessage(recipientId, text) {
        console.log(`sending message to ${text} to ${recipientId}`);
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                text: text
            }
        }
        this.callSendAPI(messageData);
    }
}

module.exports = FacebookHandler;