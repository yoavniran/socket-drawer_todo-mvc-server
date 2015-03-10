"use strict";
var logger = require("../../logger");

var loggingWare = (function () {

    return function (resource, data, metadata, method, pathData, session, helpers, next) {

        logger.debug("[loggingWare]: incoming request on: " + resource);

        next(); //make sure the next socketware or the handler are called
    };
})();

module.exports = loggingWare;