/**
 * @file client.js
 * @overview Chat application logic
 * @author Mitchell Sawatzky
 */

const log = require(`${__rootname}/log.js`);
let clients = {};

/**
 * Chat client class
 * @class Client
 * @private
 * @param {ws.WebSocket} socket - the client's socket
 * @param {string} id - a UUID identifying this client
 */
function Client(socket, id) {
    // capture context
    let self = this;

    self.socket = socket;
    self.id = id;

    /**
     * Send a message to the client
     */
    self.send = function(message) {
        let outgoing = JSON.stringify(message);
        log.debug(`[WS] [${self.id}] <<`, message);
        self.socket.send(outgoing);
    };

    /**
     * Handle a message from the client
     * @param {string} message - the client message
     */
    self.handleMessage = function(message) {
        if (!message.length) {
            log.debug(`[WS] Empty payload`);
        }
        switch (message[0]) {
            case 'ClientHello':
                self.send([
                    'ServerHello',
                    self.id
                ]);
                break;
            default:
                log.warn(`Unknown OPCODE: ${message[0]}`);
                break;
        }
    };

    self.socket.on('message', (message) => {
        let incoming;
        try {
            incoming = JSON.parse(message);
        } catch (e) {
            log.debug(`[WS] [${self.id}] Invalid JSON (${message})`);
            return;
        }
        log.debug(`[WS] [${self.id}] >>`, incoming);
        self.handleMessage(incoming);
    });
}

/**
 * Create a new Client object
 * @function
 * @memberof client
 * @param {ws.WebSocket} socket - the socket the client will use to communicate
 * @param {string} id - the id of the new client
 */
function createClient(socket, id) {
    if (clients.hasOwnProperty(id)) {
        log.warn(`[WS] Client ${id} already exists!`);
        socket.close();
    } else {
        clients[id] = new Client(socket, id);
    }
}

/**
 * Destroy a Client object
 * @function
 * @memberof client
 * @param {string} id - the id of the client to destroy
 */
function destroyClient(id) {
    if (clients.hasOwnProperty(id)) {
        clients[id].socket.close();
        delete clients[id];
    } else {
        log.warn(`[WS] Client ${id} does not exist to be destroyed`);
    }
}

/**
 * @namespace client
 */
module.exports = {
    createClient: createClient,
    destroyClient: destroyClient
};
