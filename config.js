"use strict";

module.exports = {

    "sockets":{
        sockjs: {
            "path": "/wsock",
            "public": "/public/javascripts/sockjs.js"
        },
        ws: {
            "path": "/wsock"
        },
        socketio: {
            "path": "/wsock"
        }
    },
    "storage":{
        file:{
            "dataFolder": "data"
        }
    }
};