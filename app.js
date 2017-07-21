'use strict';

const express = require('express');
const app = express();

const MessageRouter = require('./MessageRouter.js');

// Messenger API parameters
if (!process.env.FB_PAGE_TOKEN) {
	throw new Error('missing FB_PAGE_TOKEN');
}
if (!process.env.FB_VERIFY_TOKEN) {
	throw new Error('missing FB_VERIFY_TOKEN');
}
if (!process.env.FB_APP_SECRET) {
	throw new Error('missing FB_APP_SECRET');
}
if (!process.env.SERVER_URL) {
	throw new Error('missing SERVER_URL');
}
if (!process.env.WEATHER_API_KEY) {
	throw new Error('missing SERVER_URL');
}

app.set('port', (process.env.PORT || 5000))

const messageRoute = new MessageRouter(app);

//serve static files in the public directory
app.use(express.static('public'));

messageRoute.handleRoutes(app);

// Spin up the server
app
	.listen(app.get('port'), function () {
		console.log('running on port', app.get('port'))
	})