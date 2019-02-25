/**
 * @file websocket.js
 * @overview Websocket logic
 * @author Mitchell Sawatzky
 */

const ws = require('ws');
const uuid = require('uuid/v4');
const conf = require(`${__rootname}/conf.json`);
const log = require(`${__rootname}/log.js`);
const client = require(`${__rootname}/client.js`);

let websocketServer;

/**
 * Initialize the server and start listening for requests
 * @function init
 * @param {http.Server} httpServer - the http server to attach this webserver to
 * @memberof websocket
 */
function init(httpServer) {
    log.debug('Creating websocket server');
    websocketServer = new ws.Server({
        server: httpServer
    });

    log.info('WebSocket Server attached to http server');
    websocketServer.on('connection', handleConnection);
}

/**
 * Handle a new connection
 * @function handleConnection
 * @private
 * @param {ws.WebSocket} socket - the new websocket (connected)
 * @param {http.IncomingMessage} request - the http request for the new socket
 */
function handleConnection(socket, request) {
    let connectionID = uuid();
    log.info(`[WS] New WS Connection from ${request.connection.remoteAddress} -> ${connectionID}`);

    client.createClient(socket, connectionID);

    socket.on('close', () => {
        log.info(`[WS] ${request.connection.remoteAddress}(${connectionID}) closed the websocket connection`);
        client.destroyClient(connectionID);
    });
}

/**
 * @namespace websocket
 */
module.exports = {
    init: init
}
