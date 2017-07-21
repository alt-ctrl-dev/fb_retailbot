const FacebookHandler = require("./FacebookHandler")
const bodyParser = require('body-parser');


class MessageRouter {
    constructor() {
        this.fbHandler = new FacebookHandler(this);
    }

    handleRoutes(app) {
        if (!app) {
            return new Error('You must specify app from express');
        }
        // for Facebook verification
        //verify request came from facebook
        app.use(bodyParser.json({
            verify: this.fbHandler.verifyRequestSignature
        }));

        // Process application/x-www-form-urlencoded
        app.use(bodyParser.urlencoded({
            extended: false
        }))

        // Process application/json
        app.use(bodyParser.json())

        // Index route
        app.get('/', function (req, res) {
            res.send('Hello world, I am a bot')
        })

        app.get("/webhook", (req, res) => {
            console.log("request");
            if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === this.fbHandler.FB_VERIFY_TOKEN) {
                res
                    .status(200)
                    .send(req.query['hub.challenge']);
            } else {
                console.error("Failed validation. Make sure the validation tokens match.");
                res.sendStatus(403);
            }
        })

        /*
         * All callbacks for Messenger are POST-ed. They will be sent to the same
         * webhook. Be sure to subscribe your app to your page to receive callbacks
         * for your page.
         * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
         *
         */
        app.post("/webhook", (req, res) => {
            var data = req.body;

            // Make sure this is a page subscription
            if (data.object == 'page') {

                // Iterate over each entry There may be multiple if batched
                data
                    .entry
                    .forEach(function (pageEntry) {
                        var pageID = pageEntry.id;
                        var timeOfEvent = pageEntry.time;

                        // Iterate over each messaging event
                        pageEntry
                            .messaging
                            .forEach(function (messagingEvent) {
                                if (messagingEvent.optin) {
                                    this.fbHandler.receivedAuthentication(messagingEvent);
                                } else if (messagingEvent.message) {
                                    this.fbHandler.receivedMessage(messagingEvent);
                                } else if (messagingEvent.delivery) {
                                    this.fbHandler.receivedDeliveryConfirmation(messagingEvent);
                                } else if (messagingEvent.postback) {
                                    this.fbHandler.receivedPostback(messagingEvent);
                                } else if (messagingEvent.read) {
                                    this.fbHandler.receivedMessageRead(messagingEvent);
                                } else if (messagingEvent.account_linking) {
                                    this.fbHandler.receivedAccountLink(messagingEvent);
                                } else {
                                    console.log("Webhook received unknown messagingEvent: ", messagingEvent);
                                }
                            });
                    });
            }
            // Assume all went well. You must send back a 200, within 20 seconds
            res.sendStatus(200);
        });

    }
}

module.exports = MessageRouter;