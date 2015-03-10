"use strict";

var winston = require("winston");

var logger = (function () {

    var loggerMethods = ["debug", "info", "warn", "error"];

    var winstonLogger = new winston.Logger({

        transports: [
            new winston.transports.Console({
                colorize: true,
                prettyPrint: true,
                timestamp:true,
                level: "error" }),
            new winston.transports.File({
                filename: "todomvc_sd_server.log",
                timestamp:true,
                level: "error"
            })
        ]
    });

    function Logger() {
    }

    Logger.prototype.setLevel =function(level){
        winstonLogger.transports.console.level = level;
        winstonLogger.transports.file.level = level;
    };

    loggerMethods.forEach(function (m) {
        Logger.prototype[m] = function () {
            var args = Array.prototype.slice.call(arguments);
            args.unshift(m);
            winstonLogger.log.apply(winstonLogger, args);
        };
    });


    return new Logger(); //singleton!
})();

module.exports = logger;


