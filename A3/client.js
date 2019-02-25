/**
 * @file client.js
 * @overview Chat application logic
 * @author Mitchell Sawatzky
 */

const log = require(`${__rootname}/log.js`);
const uuid = require('uuid/v4');
const randomName = require('random-name');

let clients = {};
let nicknames = {};
let history = [];

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
    self.id = id; // connectionID
    self.userID = null;

    /**
     * Send a message to the client
     */
    self.send = function(message) {
        let outgoing = JSON.stringify(message);
        log.debug(`[WS] [${self.id}] <<`, message);
        self.socket.send(outgoing);
    };

    /**
     * Send a message to all clients except this one
     * @param {*} message - the message to send
     * @param {bool} [sendToSelf=false] - true to send to this client as well
     */
    self.broadcast = function(message, sendToSelf=false) {
        for (let id in clients) {
            if (!sendToSelf && id === self.id) {
                continue;
            }
            clients[id].send(message);
        }
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
                // ClientHello [userID]: initiate handshake
                // if the id is provided, check if it exists and assign the
                // previous id. Otherwise, create a new id.
                if (message[1] && nicknames.hasOwnProperty(message[1])) {
                    self.userID = message[1];
                } else {
                    self.userID = uuid();
                    nicknames[self.userID] = {
                        name: getUniqueName(),
                        color: '000000'
                    };
                }

                self.send([
                    'ServerHello',
                    self.id,
                    self.userID
                ]);

                self.broadcast([
                    'Join',
                    self.userID,
                    nicknames[self.userID]
                ]);
                break;
            case 'History':
                // History
                self.send(['History', history]);
                break;
            case 'Message':
                // Message <message>
                if (message[1] && message[1].length) {
                    let now = Date.now()
                    self.broadcast([
                        'Message',
                        self.userID,
                        now,
                        message[1]
                    ], true);
                    history.push({
                        uid: self.userID,
                        time: now,
                        content: message[1]
                    });
                }
                break;
            case 'NickList':
                // NickList: get all nicknames
                let response = {};
                for (let clientID in clients) {
                    response[clients[clientID].userID] = nicknames[clients[clientID].userID];
                };
                self.send([
                    'NickList',
                    response
                ]);
                break;
            case 'SetNick':
                // SetNick <nick>
                let unique = true;
                for (let uid in nicknames) {
                    if (message[1] === nicknames[uid].name) {
                        unique = false;
                        break;
                    }
                }
                if (!unique) {
                    self.send(['ServerMessage', 'That nickname has been taken.']);
                } else {
                    nicknames[self.userID].name = message[1];
                    self.broadcast(['Nick', self.userID, message[1]], true);
                    self.send(['ServerMessage', 'Your nickname has been changed.']);
                }
                break;
            case 'NickColor':
                // NickColor <color>: set own nick color
                if (/^[0-9a-fA-F]{6}$/.test(message[1])) {
                    nicknames[self.userID].color = message[1].toUpperCase();
                    self.broadcast([
                        'NickColor',
                        self.userID,
                        message[1].toUpperCase()
                    ], true);
                    self.send(['ServerMessage', 'Your color has been changed']);
                } else {
                    self.send(['ServerMessage', 'The colour you provided is not valid']);
                }
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
        clients[id].broadcast([
            'Part',
            clients[id].userID
        ]);
        clients[id].socket.close();
        delete clients[id];
    } else {
        log.warn(`[WS] Client ${id} does not exist to be destroyed`);
    }
}

/**
 * Generate a unique random name
 * @function
 * @private
 * @returns {string} the newly-generated name
 */
function getUniqueName() {
    let names = [];
    for (let uid in nicknames) {
        names.push(nicknames[uid].name);
    }

    let name;
    do {
        name = randomName.first();
    } while (names.indexOf(name) !== -1);
    return name;
}

/**
 * @namespace client
 */
module.exports = {
    createClient: createClient,
    destroyClient: destroyClient
};
