'use strict'

const request = require('request');


class WeatherHandler {
    constructor({
        WEATHER_API_KEY
    }) {
        this.WEATHER_API_KEY = WEATHER_API_KEY;
    }
}

module.exports = WeatherHandler;