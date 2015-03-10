"use strict";
var http = require("http"),
    url = require("url"),
    path = require("path"),
    config = require("./config"),
    logger = require("./logger"),
    sd = require("socket-drawer"),
    socketsHandlers = require("./sockets/handlers"),
    socketsWares = require("./sockets/socketwares");

function setGlobals() {

    logger.setLevel("debug");
    global.dataPath = path.join(path.resolve(__dirname), config.storage.file.dataFolder);

    logger.debug("[app]:: setGlobals: data path is: " + global.dataPath);
}

function initializeSocketServer(httpServer, wsImplementation) {

    function doSockJS(httpServer) {

        var socketsServer = new sd.SocketsServer({
            httpServer: httpServer,
            implementation: sd.IMPLEMENTATIONS.SOCK_JS,
            sockUrl: path.join(path.resolve(__dirname), config.sockets.sockjs.public),
            path: config.sockets.sockjs.path,
            handlers: socketsHandlers,
            config: {
                debug: true
            }
        });

        socketsServer.use(socketsWares);

        return socketsServer;
    }

    function doWS(httpServer) {
        var socketsServer = new sd.SocketsServer({
            httpServer: httpServer,
            implementation: sd.IMPLEMENTATIONS.WS,
            path: config.sockets.ws.path,
            handlers: socketsHandlers,
            config: {
                debug: true
            }
        });

        socketsServer.use(socketsWares);

        return socketsServer;
    }

    function doSocketIO(httpServer){

        var socketsServer = new sd.SocketsServer({
            httpServer: httpServer,
            implementation: sd.IMPLEMENTATIONS.SOCKET_IO,
            path: config.sockets.socketio.path,
            handlers: socketsHandlers,
            config: {
                debug: true
            }
        });

        socketsServer.use(socketsWares);

        return socketsServer;
    }

    var socketsServer;

    switch (wsImplementation) {
        case sd.IMPLEMENTATIONS.SOCK_JS:
            socketsServer = doSockJS(httpServer);
            break;
        case sd.IMPLEMENTATIONS.WS:
            socketsServer = doWS(httpServer);
            break;
        case sd.IMPLEMENTATIONS.SOCKET_IO:
            socketsServer = doSocketIO(httpServer);
            break;
    }

    socketsServer.start();

    return socketsServer;
}

function initializeHttpServer(wsImplementation) {

    function handleHttpWSTypeCheckRequest(parsedUrl, req, res, wsImplementation) {
        var handled = false;

        if (req.method === "GET" && parsedUrl.pathname === "/api/wsType") {
            var answer = {implementation: wsImplementation};
            doHttpResponse(parsedUrl, res, answer);
            handled = true;
        }

        return handled;
    }

    function doHttpResponse(parsedUrl, res, data) {

        var answerStr = (typeof(data) === "string") ? data : JSON.stringify(data);
        var contentType = "application/json";

        if (parsedUrl.query && parsedUrl.query.callback) { //jsop request, wrap with callback function
            answerStr = parsedUrl.query.callback + "(" + answerStr + ");";
        }

        res.writeHead(200, {"Content-Type": contentType});
        res.write(answerStr, "UTF-8");
    }

    var httpServer = http.createServer();
    httpServer.listen(3001, "0.0.0.0");

    httpServer.on("request", function (req, res) {

        logger.info("HTTP - incoming request on URL = " + req.url);

        var parsed = url.parse(req.url, true);
        var handled = handleHttpWSTypeCheckRequest(parsed, req, res, wsImplementation);

        if (!handled) {
            logger.debug("HTTP - incoming request not handled!");
            res.writeHead(404, "Not Found");
        }

        res.end();
    });

    return httpServer;
}

(function () {

    setGlobals();

    //*************************************************
//    var wsImplementation = sd.IMPLEMENTATIONS.SOCK_JS;
//    var wsImplementation = sd.IMPLEMENTATIONS.WS;
    var wsImplementation = sd.IMPLEMENTATIONS.SOCKET_IO;
    //*************************************************

    var httpServer = initializeHttpServer(wsImplementation);

    initializeSocketServer(httpServer, wsImplementation);
})();